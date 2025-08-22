import { MongoClient, Db, Collection } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/community/vectorstores/mongodb_atlas';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import Tesseract from 'tesseract.js';

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
  retryCount?: number;
}

class RetryAndCleanupManager {
  private client: MongoClient;
  private db: Db;
  private trackingCollection: Collection<UploadTracker>;
  private dataCollection: Collection;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    this.db = this.client.db('chatter');
    this.trackingCollection = this.db.collection<UploadTracker>('upload_tracking');
    this.dataCollection = this.db.collection('training_data');
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!
    });
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to MongoDB for retry and cleanup');
  }

  async disconnect() {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  // Convert PDF to images using ImageMagick
  async convertPDFToImages(pdfPath: string, outputDir: string): Promise<string[]> {
    try {
      const command = `convert -density 300 -quality 95 "${pdfPath}" "${outputDir}/page_%04d.png"`;
      await execAsync(command);
      
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

  // Enhanced OCR with better preprocessing
  async extractTextWithEnhancedOCR(filePath: string, fileName: string): Promise<string> {
    const tempDir = path.join('/tmp', `ocr_enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      
      console.log('  Converting PDF to high-quality images...');
      const imageFiles = await this.convertPDFToImages(filePath, tempDir);
      
      if (imageFiles.length === 0) {
        throw new Error('No images generated from PDF');
      }
      
      console.log(`  Converted to ${imageFiles.length} images`);
      
      let fullText = '';
      const maxPages = Math.min(imageFiles.length, 15); // Process more pages
      
      for (let i = 0; i < maxPages; i++) {
        const imagePath = imageFiles[i];
        console.log(`  OCR processing page ${i + 1}/${maxPages} with enhanced settings...`);
        
        try {
          // Try multiple OCR configurations
          const configs = [
            { lang: 'ara+eng', psm: '1' }, // Auto page segmentation
            { lang: 'ara+eng', psm: '3' }, // Fully automatic page segmentation
            { lang: 'ara+eng', psm: '6' }, // Single uniform block
          ];
          
          let bestText = '';
          let maxLength = 0;
          
          for (const config of configs) {
            try {
              const { data: { text } } = await Tesseract.recognize(
                imagePath,
                config.lang,
                {
                  logger: () => {},
                  tessedit_pageseg_mode: config.psm,
                  tessedit_ocr_engine_mode: '2', // LSTM engine
                  tessedit_char_blacklist: '[]{}()<>',
                }
              );
              
              if (text && text.trim().length > maxLength) {
                bestText = text.trim();
                maxLength = text.trim().length;
              }
            } catch (configError) {
              console.warn(`    Config ${config.psm} failed: ${configError}`);
            }
          }
          
          if (bestText) {
            fullText += bestText + '\n\n';
          }
          
          await new Promise(resolve => setTimeout(resolve, 800));
          
        } catch (pageError) {
          console.warn(`    Failed to OCR page ${i + 1}: ${pageError}`);
        }
      }
      
      return fullText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .trim();
        
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Failed to cleanup temp directory:', e);
      }
    }
  }

  // Retry failed OCR files with enhanced settings
  async retryFailedOCR(): Promise<void> {
    const failedFiles = await this.trackingCollection.find({ 
      status: 'ocr_failed',
      $or: [
        { retryCount: { $exists: false } },
        { retryCount: { $lt: 2 } }
      ]
    }).toArray();

    console.log(`🔄 Found ${failedFiles.length} OCR failed files to retry`);

    for (const doc of failedFiles) {
      const { fileName, filePath } = doc;
      const retryCount = (doc.retryCount || 0) + 1;
      
      console.log(`\n🔄 Retry ${retryCount}: ${fileName}`);
      
      // Update retry count
      await this.trackingCollection.updateOne(
        { fileName },
        { 
          $set: { 
            status: 'ocr_processing',
            retryCount: retryCount
          } 
        }
      );

      try {
        const extractedText = await this.extractTextWithEnhancedOCR(filePath, fileName);
        
        if (!extractedText || extractedText.trim().length < 20) {
          throw new Error('Enhanced OCR still yielded insufficient text content');
        }

        console.log(`  ✓ Enhanced OCR extracted ${extractedText.length} characters`);

        // Create chunks and upload (similar to previous OCR logic)
        const chunks = extractedText.match(/.{1,1500}/g) || [extractedText];
        const metadata = chunks.map((_, index) => ({
          source: fileName,
          type: 'textbook',
          language: 'mixed',
          extractionMethod: 'enhanced_ocr',
          chunkIndex: index,
          totalChunks: chunks.length,
          retryAttempt: retryCount
        }));

        await MongoDBAtlasVectorSearch.fromTexts(
          chunks,
          metadata,
          this.embeddings,
          {
            collection: this.dataCollection,
            indexName: "vector_index",
            textKey: "text",
            embeddingKey: "text_embedding",
          }
        );

        await this.trackingCollection.updateOne(
          { fileName },
          { 
            $set: { 
              status: 'ocr_completed',
              chunks: chunks.length,
              textLength: extractedText.length,
              language: 'mixed',
              extractionMethod: 'enhanced_ocr',
              uploadedAt: new Date()
            } 
          }
        );

        console.log(`  ✅ Successfully processed ${fileName} on retry ${retryCount}!`);

      } catch (error) {
        console.error(`  ❌ Retry ${retryCount} failed: ${error}`);
        
        await this.trackingCollection.updateOne(
          { fileName },
          { 
            $set: { 
              status: 'ocr_failed',
              error: `Retry ${retryCount}: ${error}`,
              retryCount: retryCount
            } 
          }
        );
      }

      // Delay between retries
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Clean up irrelevant or low-quality chunks
  async cleanupIrrelevantChunks(): Promise<void> {
    console.log('\n🧹 Starting cleanup of irrelevant chunks...');

    // Find chunks that are too short or contain mostly non-Arabic/English text
    const irrelevantChunks = await this.dataCollection.find({
      $or: [
        { text: { $regex: /^.{1,20}$/ } }, // Very short chunks
        { text: { $regex: /^[^\u0600-\u06FF\u0000-\u007F]+$/ } }, // No Arabic or English
        { text: { $regex: /^[\s\W]*$/ } }, // Only whitespace/punctuation
        { text: { $regex: /^(undefined|null|error|failed|loading)$/i } } // Error text
      ]
    }).toArray();

    console.log(`Found ${irrelevantChunks.length} potentially irrelevant chunks`);

    if (irrelevantChunks.length > 0) {
      const idsToDelete = irrelevantChunks.map(chunk => chunk._id);
      const deleteResult = await this.dataCollection.deleteMany({
        _id: { $in: idsToDelete }
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} irrelevant chunks`);
      
      // Log some examples of what was deleted
      const examples = irrelevantChunks.slice(0, 5).map(chunk => chunk.text.substring(0, 50));
      console.log('Examples of deleted content:', examples);
    }
  }

  // Update chunk metadata to improve searchability
  async improveChunkMetadata(): Promise<void> {
    console.log('\n🔧 Improving chunk metadata...');

    const chunks = await this.dataCollection.find({
      $or: [
        { language: { $exists: false } },
        { grade_level: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${chunks.length} chunks needing metadata improvement`);

    let updated = 0;
    for (const chunk of chunks) {
      const improvements: any = {};
      
      // Detect language if missing
      if (!chunk.language) {
        const text = chunk.text || '';
        const hasArabic = /[\u0600-\u06FF]/.test(text);
        const hasEnglish = /[a-zA-Z]/.test(text);
        
        if (hasArabic && hasEnglish) improvements.language = 'mixed';
        else if (hasArabic) improvements.language = 'arabic';
        else if (hasEnglish) improvements.language = 'english';
        else improvements.language = 'unknown';
      }

      // Estimate grade level based on source filename
      if (!chunk.grade_level && chunk.source) {
        const filename = chunk.source.toLowerCase();
        if (filename.includes('ص ١') || filename.includes('ص 1')) improvements.grade_level = 1;
        else if (filename.includes('ص ٢') || filename.includes('ص 2')) improvements.grade_level = 2;
        else if (filename.includes('ص ٣') || filename.includes('ص 3')) improvements.grade_level = 3;
        else if (filename.includes('ص ٤') || filename.includes('ص 4')) improvements.grade_level = 4;
        else if (filename.includes('ص ٥') || filename.includes('ص 5')) improvements.grade_level = 5;
        else if (filename.includes('ص ٦') || filename.includes('ص 6')) improvements.grade_level = 6;
        else if (filename.includes('ص ٧') || filename.includes('ص 7')) improvements.grade_level = 7;
        else if (filename.includes('ص ٨') || filename.includes('ص 8')) improvements.grade_level = 8;
        else if (filename.includes('ص ٩') || filename.includes('ص 9')) improvements.grade_level = 9;
        else if (filename.includes('ص ١٠') || filename.includes('ص 10')) improvements.grade_level = 10;
        else if (filename.includes('ص ١١') || filename.includes('ص 11')) improvements.grade_level = 11;
        else if (filename.includes('ص ١٢') || filename.includes('ص 12')) improvements.grade_level = 12;
      }

      if (Object.keys(improvements).length > 0) {
        await this.dataCollection.updateOne(
          { _id: chunk._id },
          { $set: improvements }
        );
        updated++;
      }
    }

    console.log(`✅ Updated metadata for ${updated} chunks`);
  }

  async getStatistics(): Promise<void> {
    const stats = await this.trackingCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const totalChunks = await this.dataCollection.countDocuments();
    
    const languageStats = await this.dataCollection.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]).toArray();

    const gradeStats = await this.dataCollection.aggregate([
      { $group: { _id: '$grade_level', count: { $sum: 1 } } }
    ]).toArray();

    console.log('\n📊 Updated Statistics:');
    console.log('File Status:', stats);
    console.log(`Total Chunks: ${totalChunks}`);
    console.log('Language Distribution:', languageStats);
    console.log('Grade Distribution:', gradeStats);
  }

  async runFullCleanupAndRetry(): Promise<void> {
    console.log('🚀 Starting full cleanup and retry process');
    console.log('=' .repeat(60));

    try {
      // Step 1: Retry failed OCR files
      await this.retryFailedOCR();
      
      // Step 2: Clean up irrelevant chunks
      await this.cleanupIrrelevantChunks();
      
      // Step 3: Improve metadata
      await this.improveChunkMetadata();
      
      // Step 4: Show final statistics
      await this.getStatistics();
      
      console.log('\n✅ Cleanup and retry process completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during cleanup and retry:', error);
    }
  }
}

async function main() {
  const manager = new RetryAndCleanupManager();
  
  try {
    await manager.connect();
    await manager.runFullCleanupAndRetry();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await manager.disconnect();
  }
}

main().catch(console.error);