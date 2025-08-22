import { promises as fs } from 'fs';
import { MongoClient, Db, Collection } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/community/vectorstores/mongodb_atlas';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';
import path from 'path';

const execAsync = promisify(exec);
dotenv.config({ path: '.env.local' });

interface UploadTracker {
  fileName: string;
  filePath: string;
  status: string;
  chunks?: number;
  error?: string;
  uploadedAt?: Date;
  textLength?: number;
  language?: string;
  ocrAttempted?: boolean;
  extractionMethod?: string;
}

class SimpleOCRUploader {
  private client: MongoClient;
  private db: Db;
  private trackingCollection: Collection<UploadTracker>;
  private embeddings: OpenAIEmbeddings;
  private collection: any;

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    this.db = this.client.db('chatter');
    this.trackingCollection = this.db.collection<UploadTracker>('upload_tracking');
    this.collection = this.db.collection('training_data');
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to MongoDB');
  }

  async disconnect() {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  async convertPDFToImages(pdfPath: string, outputDir: string): Promise<string[]> {
    try {
      // Use ImageMagick to convert PDF to PNG images
      const command = `convert -density 200 -quality 100 "${pdfPath}" "${outputDir}/page_%03d.png"`;
      await execAsync(command);
      
      // List generated images
      const files = await fs.readdir(outputDir);
      const imageFiles = files
        .filter(f => f.startsWith('page_') && f.endsWith('.png'))
        .map(f => path.join(outputDir, f))
        .sort();
      
      return imageFiles;
    } catch (error) {
      throw new Error(`Failed to convert PDF to images: ${error}`);
    }
  }

  async extractTextWithOCR(filePath: string, fileName: string): Promise<string> {
    const tempDir = path.join('/tmp', `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    try {
      // Create temp directory
      await fs.mkdir(tempDir, { recursive: true });
      
      console.log('  Converting PDF to images...');
      const imageFiles = await this.convertPDFToImages(filePath, tempDir);
      
      if (imageFiles.length === 0) {
        throw new Error('No images generated from PDF');
      }
      
      console.log(`  Converted to ${imageFiles.length} images`);
      
      let fullText = '';
      const maxPages = Math.min(imageFiles.length, 10); // Limit to first 10 pages
      
      for (let i = 0; i < maxPages; i++) {
        const imagePath = imageFiles[i];
        console.log(`  OCR processing page ${i + 1}/${maxPages}...`);
        
        try {
          const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'ara+eng',
            {
              logger: () => {}, // Suppress logging
            }
          );
          
          if (text && text.trim()) {
            fullText += text.trim() + '\n\n';
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (pageError) {
          console.warn(`    Failed to OCR page ${i + 1}: ${pageError}`);
        }
      }
      
      return fullText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
        
    } finally {
      // Cleanup
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Failed to cleanup temp directory:', e);
      }
    }
  }

  async processOneFailedFile(): Promise<boolean> {
    // Get one failed file
    const failedFile = await this.trackingCollection.findOne({ 
      status: 'failed',
      $or: [
        { ocrAttempted: { $exists: false } },
        { ocrAttempted: false }
      ]
    });

    if (!failedFile) {
      console.log('No more failed files to process');
      return false;
    }

    const { fileName, filePath } = failedFile;
    console.log(`\nOCR Testing: ${fileName}`);
    
    // Update status
    await this.trackingCollection.updateOne(
      { fileName },
      { $set: { status: 'ocr_processing', ocrAttempted: true } }
    );

    try {
      const extractedText = await this.extractTextWithOCR(filePath, fileName);
      
      if (!extractedText || extractedText.trim().length < 20) {
        throw new Error('OCR yielded insufficient text content');
      }

      console.log(`  ✓ OCR extracted ${extractedText.length} characters`);
      console.log(`  Sample text: "${extractedText.substring(0, 100)}..."`);

      // Create chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 200,
        separators: ['\n\n', '\n', '۔', '؟', '!', ' ', ''],
      });
      
      const chunks = await splitter.splitText(extractedText);
      
      // Add metadata
      const metadata = chunks.map((_, index) => ({
        source: fileName,
        type: 'textbook',
        language: 'mixed',
        extractionMethod: 'ocr',
        chunkIndex: index,
        totalChunks: chunks.length
      }));

      // Upload to vector store
      console.log(`  Uploading ${chunks.length} chunks...`);
      await MongoDBAtlasVectorSearch.fromTexts(
        chunks,
        metadata,
        this.embeddings,
        {
          collection: this.collection,
          indexName: "vector_index",
          textKey: "text",
          embeddingKey: "text_embedding",
        }
      );

      // Update tracking
      await this.trackingCollection.updateOne(
        { fileName },
        { 
          $set: { 
            status: 'ocr_completed',
            chunks: chunks.length,
            textLength: extractedText.length,
            language: 'mixed',
            extractionMethod: 'ocr',
            uploadedAt: new Date()
          } 
        }
      );

      console.log(`  ✓ Successfully processed ${fileName} with OCR!`);
      return true;

    } catch (error) {
      console.error(`  ✗ OCR failed: ${error}`);
      
      await this.trackingCollection.updateOne(
        { fileName },
        { $set: { status: 'ocr_failed', error: `OCR: ${error}` } }
      );
      
      return true; // Continue with next file
    }
  }
}

async function main() {
  const uploader = new SimpleOCRUploader();
  
  try {
    await uploader.connect();
    
    console.log('Testing OCR on one failed PDF...');
    console.log('====================================');
    
    const processed = await uploader.processOneFailedFile();
    
    if (processed) {
      console.log('\n✓ OCR test completed successfully!');
      console.log('You can now run the full OCR processing with: npm run upload:ocr');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await uploader.disconnect();
  }
}

main().catch(console.error);