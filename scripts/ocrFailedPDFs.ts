import { promises as fs } from 'fs';
import path from 'path';
import { MongoClient, Db, Collection } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/community/vectorstores/mongodb_atlas';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import Tesseract from 'tesseract.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

// Load environment variables first
dotenv.config({ path: '.env.local' });

interface UploadTracker {
  fileName: string;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'ocr_processing' | 'ocr_completed' | 'ocr_failed';
  chunks?: number;
  error?: string;
  uploadedAt?: Date;
  textLength?: number;
  language?: string;
  ocrAttempted?: boolean;
  extractionMethod?: 'pdf-parse' | 'ocr';
}

class OCRTextbookUploader {
  private client: MongoClient;
  private db: Db;
  private trackingCollection: Collection<UploadTracker>;
  private embeddings: OpenAIEmbeddings;
  private collection: any;

  constructor() {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    this.client = new MongoClient(process.env.MONGODB_URI);
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

  detectLanguage(text: string): string {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const hasArabic = arabicPattern.test(text);
    
    if (hasArabic) {
      const arabicChars = (text.match(arabicPattern) || []).length;
      const totalChars = text.length;
      const arabicRatio = arabicChars / totalChars;
      
      if (arabicRatio > 0.3) {
        return 'arabic';
      }
    }
    
    return 'mixed';
  }

  async processFailedFile(doc: UploadTracker): Promise<void> {
    const { fileName, filePath } = doc;
    console.log(`\nOCR Processing: ${fileName}`);
    
    // Update status to OCR processing
    await this.trackingCollection.updateOne(
      { fileName },
      { 
        $set: { 
          status: 'ocr_processing',
          ocrAttempted: true
        } 
      }
    );

    try {
      // Extract text using OCR
      const extractedText = await this.extractTextWithOCR(filePath, fileName);
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('OCR extraction yielded insufficient text content');
      }

      const language = this.detectLanguage(extractedText);
      console.log(`  Detected language: ${language}`);
      console.log(`  Extracted ${extractedText.length} characters via OCR`);

      // Split text into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 200,
        separators: ['\n\n', '\n', '۔', '؟', '!', '।', ' ', ''],
      });
      
      const chunks = await splitter.splitText(extractedText);
      console.log(`  Created ${chunks.length} chunks`);

      // Add metadata to each chunk
      const metadata = chunks.map((_, index) => ({
        source: fileName,
        type: 'textbook',
        language: language,
        extractionMethod: 'ocr',
        chunkIndex: index,
        totalChunks: chunks.length
      }));

      // Upload to vector store
      console.log('  Uploading to vector store...');
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

      // Update tracking to OCR completed
      await this.trackingCollection.updateOne(
        { fileName },
        { 
          $set: { 
            status: 'ocr_completed',
            chunks: chunks.length,
            textLength: extractedText.length,
            language: language,
            extractionMethod: 'ocr',
            uploadedAt: new Date()
          } 
        }
      );

      console.log(`  ✓ Successfully OCR processed and uploaded ${fileName} (${chunks.length} chunks, ${language})`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown OCR error';
      console.error(`  ✗ OCR failed for ${fileName}: ${errorMessage}`);
      
      // Update tracking to OCR failed
      await this.trackingCollection.updateOne(
        { fileName },
        { 
          $set: { 
            status: 'ocr_failed',
            error: `OCR: ${errorMessage}`
          } 
        }
      );
    }
  }

  async processAllFailedFiles(): Promise<void> {
    // Get all failed files that haven't been OCR processed yet
    const failedFiles = await this.trackingCollection.find({ 
      status: 'failed',
      $or: [
        { ocrAttempted: { $exists: false } },
        { ocrAttempted: false }
      ]
    }).toArray();

    console.log(`Found ${failedFiles.length} failed files to process with OCR`);

    for (const doc of failedFiles) {
      await this.processFailedFile(doc);
      // Add delay between files to avoid overloading
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  async getStatistics() {
    const stats = await this.trackingCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const ocrStats = await this.trackingCollection.aggregate([
      { $match: { extractionMethod: 'ocr' } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    const totalChunks = await this.trackingCollection.aggregate([
      { $match: { $or: [{ status: 'completed' }, { status: 'ocr_completed' }] } },
      { $group: { _id: null, total: { $sum: '$chunks' } } }
    ]).toArray();

    return {
      statusCounts: stats,
      ocrStats: ocrStats,
      totalChunks: totalChunks[0]?.total || 0
    };
  }
}

async function main() {
  const uploader = new OCRTextbookUploader();
  
  try {
    await uploader.connect();
    
    console.log('Starting OCR processing for failed PDFs');
    console.log('========================================');
    
    await uploader.processAllFailedFiles();
    
    console.log('\n========================================');
    console.log('OCR Processing Summary:');
    const stats = await uploader.getStatistics();
    console.log('All status counts:', stats.statusCounts);
    console.log('OCR specific stats:', stats.ocrStats);
    console.log('Total chunks created:', stats.totalChunks);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await uploader.disconnect();
  }
}

// Run the script
main().catch(console.error);