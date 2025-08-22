import { MongoClient, Db, Collection } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/community/vectorstores/mongodb_atlas';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { exec } from 'child_process';
import { promisify } from 'util';
import Tesseract from 'tesseract.js';

const execAsync = promisify(exec);
dotenv.config({ path: '.env.local' });

interface HighPriorityTracker {
  fileName: string;
  filePath: string;
  status: string;
  chunks?: number;
  error?: string;
  uploadedAt?: Date;
  textLength?: number;
  language?: string;
  priority: 'HIGHEST' | 'HIGH';
  importance: 'CRITICAL' | 'ESSENTIAL';
  extractionMethod?: string;
  qualityScore?: number;
}

class HighPriorityTextbookUploader {
  private client: MongoClient;
  private db: Db;
  private trackingCollection: Collection<HighPriorityTracker>;
  private dataCollection: Collection;
  private vectorStore: MongoDBAtlasVectorSearch;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    this.db = this.client.db('chatter');
    this.trackingCollection = this.db.collection<HighPriorityTracker>('high_priority_uploads');
    this.dataCollection = this.db.collection('training_data');
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!
    });

    this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
      collection: this.dataCollection,
      indexName: "vector_index",
      textKey: "text",
      embeddingKey: "text_embedding",
    });

    // Enhanced text splitter for high-priority content
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1200, // Smaller chunks for better precision
      chunkOverlap: 150, // More overlap for better context
      separators: ['\n\n', '\n', '。', '؟', '!', '?', '.', '،', ',', ' '],
    });
  }

  async connect() {
    await this.client.connect();
    console.log('🔗 Connected to MongoDB for high-priority uploads');
  }

  async disconnect() {
    await this.client.close();
    console.log('👋 Disconnected from MongoDB');
  }

  async convertPDFToImages(pdfPath: string, outputDir: string): Promise<string[]> {
    try {
      // Use higher quality settings for high-priority content
      const command = `convert -density 400 -quality 100 "${pdfPath}" "${outputDir}/page_%05d.png"`;
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

  async extractTextWithPremiumOCR(filePath: string, fileName: string): Promise<{text: string; qualityScore: number}> {
    const tempDir = path.join('/tmp', `premium_ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      
      console.log('  🔬 Converting to ultra-high quality images...');
      const imageFiles = await this.convertPDFToImages(filePath, tempDir);
      
      if (imageFiles.length === 0) {
        throw new Error('No images generated from PDF');
      }
      
      console.log(`  📸 Generated ${imageFiles.length} high-quality images`);
      
      let fullText = '';
      let totalConfidence = 0;
      let processedPages = 0;
      const maxPages = Math.min(imageFiles.length, 20); // Process more pages for high-priority
      
      for (let i = 0; i < maxPages; i++) {
        const imagePath = imageFiles[i];
        console.log(`  🔍 Premium OCR processing page ${i + 1}/${maxPages}...`);
        
        try {
          // Try multiple high-quality OCR configurations
          const configs = [
            { lang: 'ara+eng', psm: '1', oem: '2' }, // Best quality LSTM
            { lang: 'ara+eng', psm: '3', oem: '2' },
            { lang: 'ara+eng', psm: '6', oem: '2' },
            { lang: 'ara+eng', psm: '4', oem: '2' }, // Single column
          ];
          
          let bestText = '';
          let bestConfidence = 0;
          
          for (const config of configs) {
            try {
              const result = await Tesseract.recognize(
                imagePath,
                config.lang,
                {
                  logger: () => {},
                  tessedit_pageseg_mode: config.psm,
                  tessedit_ocr_engine_mode: config.oem,
                  tessedit_char_whitelist: '', // Allow all characters
                  preserve_interword_spaces: '1',
                  tessedit_do_invert: '0',
                }
              );
              
              if (result.data && result.data.text && result.data.confidence > bestConfidence) {
                bestText = result.data.text.trim();
                bestConfidence = result.data.confidence;
              }
            } catch (configError) {
              console.warn(`      Config failed: ${configError}`);
            }
          }
          
          if (bestText && bestText.length > 10) {
            fullText += bestText + '\n\n';
            totalConfidence += bestConfidence;
            processedPages++;
          }
          
          // Shorter delay for high-priority processing
          await new Promise(resolve => setTimeout(resolve, 600));
          
        } catch (pageError) {
          console.warn(`    Failed to process page ${i + 1}: ${pageError}`);
        }
      }
      
      const averageConfidence = processedPages > 0 ? totalConfidence / processedPages : 0;
      const qualityScore = Math.min(100, Math.max(0, averageConfidence));
      
      const cleanedText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .replace(/[^\u0000-\u007F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
        .trim();
        
      console.log(`  ✨ Premium OCR completed: ${cleanedText.length} chars, ${qualityScore.toFixed(1)}% confidence`);
      
      return {
        text: cleanedText,
        qualityScore: qualityScore
      };
        
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Failed to cleanup temp directory:', e);
      }
    }
  }

  async extractTextFromPDF(filePath: string): Promise<{text: string; method: string; qualityScore: number}> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (data.text && data.text.trim().length > 100) {
        console.log('  📄 Direct PDF text extraction successful');
        return {
          text: data.text.trim(),
          method: 'direct_extraction',
          qualityScore: 95 // High score for direct extraction
        };
      } else {
        console.log('  🔍 PDF requires OCR processing...');
        const ocrResult = await this.extractTextWithPremiumOCR(filePath, path.basename(filePath));
        return {
          text: ocrResult.text,
          method: 'premium_ocr',
          qualityScore: ocrResult.qualityScore
        };
      }
    } catch (error) {
      console.log('  🔍 Fallback to premium OCR...');
      const ocrResult = await this.extractTextWithPremiumOCR(filePath, path.basename(filePath));
      return {
        text: ocrResult.text,
        method: 'premium_ocr_fallback',
        qualityScore: ocrResult.qualityScore
      };
    }
  }

  detectLanguage(text: string): string {
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    if (hasArabic && hasEnglish) return 'mixed';
    if (hasArabic) return 'arabic';
    if (hasEnglish) return 'english';
    return 'unknown';
  }

  async processHighPriorityFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    
    // Check if already processed
    const existing = await this.trackingCollection.findOne({ fileName });
    if (existing && (existing.status === 'completed' || existing.status === 'high_priority_completed')) {
      console.log(`⏭️  Skipping ${fileName} - already processed`);
      return;
    }

    console.log(`\n🌟 HIGH PRIORITY: Processing ${fileName}`);
    
    // Mark as processing
    await this.trackingCollection.updateOne(
      { fileName },
      {
        $set: {
          fileName,
          filePath,
          status: 'high_priority_processing',
          priority: 'HIGHEST',
          importance: 'CRITICAL',
          uploadedAt: new Date()
        }
      },
      { upsert: true }
    );

    try {
      const { text, method, qualityScore } = await this.extractTextFromPDF(filePath);
      
      if (!text || text.trim().length < 50) {
        throw new Error('Insufficient high-quality text content extracted');
      }

      console.log(`  📊 Quality Score: ${qualityScore.toFixed(1)}%`);
      console.log(`  📝 Extracted ${text.length} characters using ${method}`);
      
      const language = this.detectLanguage(text);
      console.log(`  🌍 Detected language: ${language}`);

      // Enhanced chunking for high-priority content
      const chunks = await this.textSplitter.splitText(text);
      console.log(`  ✂️  Created ${chunks.length} high-quality chunks`);

      // Enhanced metadata for high-priority content
      const metadata = chunks.map((chunk, index) => ({
        source: fileName,
        type: 'high_priority_textbook',
        language: language,
        extractionMethod: method,
        chunkIndex: index,
        totalChunks: chunks.length,
        priority: 'HIGHEST',
        importance: 'CRITICAL',
        qualityScore: qualityScore,
        processedAt: new Date(),
        isHighPriority: true,
        searchPriority: 1.0 // Boost search ranking
      }));

      // Upload to vector store with priority marking
      console.log('  🚀 Uploading to high-priority vector store...');
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

      // Update tracking with success
      await this.trackingCollection.updateOne(
        { fileName },
        {
          $set: {
            status: 'high_priority_completed',
            chunks: chunks.length,
            textLength: text.length,
            language: language,
            extractionMethod: method,
            qualityScore: qualityScore,
            uploadedAt: new Date()
          }
        }
      );

      console.log(`  ✅ HIGH PRIORITY SUCCESS: ${fileName} (${chunks.length} chunks, ${qualityScore.toFixed(1)}% quality)`);

    } catch (error) {
      console.error(`  ❌ HIGH PRIORITY FAILED: ${fileName} - ${error}`);
      
      await this.trackingCollection.updateOne(
        { fileName },
        {
          $set: {
            status: 'high_priority_failed',
            error: error.toString(),
            uploadedAt: new Date()
          }
        }
      );
    }
  }

  async uploadHighPriorityTextbooks(directory: string): Promise<void> {
    console.log('🌟 STARTING HIGH-PRIORITY TEXTBOOK UPLOAD');
    console.log('🎯 Processing textbooks/best/ - Maximum Quality & Priority');
    console.log('=' .repeat(80));

    try {
      const files = await fs.readdir(directory);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      console.log(`📚 Found ${pdfFiles.length} high-priority PDF files`);
      
      if (pdfFiles.length === 0) {
        console.log('⚠️  No PDF files found in textbooks/best/');
        return;
      }

      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const filePath = path.join(directory, file);
        
        console.log(`\n📖 Processing ${i + 1}/${pdfFiles.length}: ${file}`);
        await this.processHighPriorityFile(filePath);
        
        // Short delay between files
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate high-priority upload report
      await this.generateHighPriorityReport();

    } catch (error) {
      console.error('❌ High-priority upload process failed:', error);
    }
  }

  async generateHighPriorityReport(): Promise<void> {
    console.log('\n📊 HIGH-PRIORITY UPLOAD REPORT');
    console.log('=' .repeat(50));

    const stats = await this.trackingCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgQuality: { $avg: '$qualityScore' },
          totalChunks: { $sum: '$chunks' }
        }
      }
    ]).toArray();

    stats.forEach(stat => {
      const avgQuality = stat.avgQuality ? stat.avgQuality.toFixed(1) : 'N/A';
      console.log(`${stat._id}: ${stat.count} files (${stat.totalChunks || 0} chunks, ${avgQuality}% avg quality)`);
    });

    const totalHighPriorityChunks = await this.dataCollection.countDocuments({
      isHighPriority: true
    });

    console.log(`\n🌟 Total High-Priority Chunks: ${totalHighPriorityChunks}`);
    
    // Show some high-priority content examples
    const samples = await this.dataCollection.find({ 
      isHighPriority: true,
      qualityScore: { $gte: 80 }
    }).limit(3).toArray();

    if (samples.length > 0) {
      console.log('\n💎 High-Quality Content Samples:');
      samples.forEach((sample, index) => {
        const preview = sample.text.substring(0, 100).replace(/\s+/g, ' ');
        console.log(`${index + 1}. "${preview}..." (Quality: ${sample.qualityScore?.toFixed(1)}%)`);
        console.log(`   Source: ${sample.source}`);
      });
    }

    console.log('\n✨ HIGH-PRIORITY UPLOAD COMPLETED SUCCESSFULLY!');
  }
}

async function main() {
  const uploader = new HighPriorityTextbookUploader();
  
  try {
    await uploader.connect();
    await uploader.uploadHighPriorityTextbooks('/Users/stanhus/Documents/work/incept_service-ragbot/textbooks/best');
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await uploader.disconnect();
  }
}

main().catch(console.error);