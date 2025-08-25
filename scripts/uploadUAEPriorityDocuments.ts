import { promises as fs } from 'fs';
import path from 'path';
import { MongoClient, Db, Collection } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/community/vectorstores/mongodb_atlas';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config({ path: '.env.local' });

interface UAEUploadTracker {
  fileName: string;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'ocr_processing' | 'ocr_completed' | 'ocr_failed';
  priority: 'uae_critical' | 'uae_high' | 'uae_medium' | 'regular';
  documentType: 'moe_official' | 'curriculum_guide' | 'educational_research' | 'textbook';
  chunks?: number;
  error?: string;
  uploadedAt?: Date;
  textLength?: number;
  language?: string;
  extractionMethod?: 'pdf-parse' | 'ocr';
}

class UAEPriorityUploader {
  private client: MongoClient;
  private db: Db;
  private trackingCollection: Collection<UAEUploadTracker>;
  private embeddings: OpenAIEmbeddings;
  private collection: any;
  private uaeDocsPath: string;

  constructor() {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    this.client = new MongoClient(process.env.MONGODB_URI);
    this.db = this.client.db('chatter');
    this.trackingCollection = this.db.collection<UAEUploadTracker>('uae_priority_uploads');
    this.collection = this.db.collection('training_data');
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    this.uaeDocsPath = './textbooks/best/';
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to MongoDB');
  }

  async disconnect() {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  private getDocumentPriority(fileName: string): { priority: UAEUploadTracker['priority'], type: UAEUploadTracker['documentType'] } {
    const lowerName = fileName.toLowerCase();
    
    // UAE Ministry of Education official documents - CRITICAL PRIORITY
    if (lowerName.includes('moe') || lowerName.includes('ministry') || lowerName.includes('final')) {
      return { priority: 'uae_critical', type: 'moe_official' };
    }
    
    // Educational development and curriculum research - HIGH PRIORITY
    if (lowerName.includes('تطور التعليم') || lowerName.includes('منهج') || lowerName.includes('دراسة')) {
      return { priority: 'uae_high', type: 'educational_research' };
    }
    
    // Curriculum guides and assessment documents - HIGH PRIORITY
    if (lowerName.includes('تقييم') || lowerName.includes('استراتيجية') || lowerName.includes('curriculum')) {
      return { priority: 'uae_high', type: 'curriculum_guide' };
    }
    
    // Default priority for other UAE documents
    return { priority: 'uae_medium', type: 'textbook' };
  }

  private detectLanguage(text: string): string {
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
    
    return 'english';
  }

  async extractTextWithPDFParse(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  async convertPDFToImages(pdfPath: string, outputDir: string): Promise<string[]> {
    try {
      const command = `convert -density 200 -quality 100 "${pdfPath}" "${outputDir}/page_%03d.png"`;
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

  async extractTextWithOCR(filePath: string): Promise<string> {
    const tempDir = path.join('/tmp', `uae_ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      
      console.log('  Converting PDF to images for OCR...');
      const imageFiles = await this.convertPDFToImages(filePath, tempDir);
      
      if (imageFiles.length === 0) {
        throw new Error('No images generated from PDF');
      }
      
      console.log(`  Processing ${imageFiles.length} pages with OCR...`);
      
      let fullText = '';
      // Process more pages for UAE priority documents
      const maxPages = Math.min(imageFiles.length, 20); 
      
      for (let i = 0; i < maxPages; i++) {
        const imagePath = imageFiles[i];
        console.log(`    OCR page ${i + 1}/${maxPages}...`);
        
        try {
          const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'ara+eng',
            { logger: () => {} }
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
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Failed to cleanup temp directory:', e);
      }
    }
  }

  async processUAEDocument(fileName: string): Promise<void> {
    const filePath = path.join(this.uaeDocsPath, fileName);
    const { priority, type } = this.getDocumentPriority(fileName);
    
    console.log(`\n🇦🇪 Processing UAE Document: ${fileName}`);
    console.log(`   Priority: ${priority.toUpperCase()}`);
    console.log(`   Type: ${type}`);
    
    // Check if already processed
    const existing = await this.trackingCollection.findOne({ fileName });
    if (existing && existing.status === 'completed') {
      console.log(`   ✓ Already processed, skipping`);
      return;
    }

    // Create or update tracking record
    await this.trackingCollection.updateOne(
      { fileName },
      { 
        $set: { 
          fileName,
          filePath,
          priority,
          documentType: type,
          status: 'processing'
        } 
      },
      { upsert: true }
    );

    try {
      // Try PDF parsing first
      console.log('   📄 Attempting PDF text extraction...');
      let extractedText = '';
      let extractionMethod: 'pdf-parse' | 'ocr' = 'pdf-parse';

      try {
        extractedText = await this.extractTextWithPDFParse(filePath);
        if (extractedText.length < 100) {
          throw new Error('Insufficient text extracted via PDF parsing');
        }
      } catch (pdfError) {
        console.log('   🔍 PDF parsing failed, using OCR...');
        extractionMethod = 'ocr';
        extractedText = await this.extractTextWithOCR(filePath);
        
        if (extractedText.length < 50) {
          throw new Error('OCR extraction yielded insufficient text content');
        }
      }

      const language = this.detectLanguage(extractedText);
      console.log(`   📝 Extracted ${extractedText.length} characters (${language})`);

      // Create specialized chunks for UAE priority documents
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: priority === 'uae_critical' ? 2000 : 1500, // Larger chunks for critical docs
        chunkOverlap: priority === 'uae_critical' ? 300 : 200,  // More overlap for better context
        separators: ['\n\n', '\n', '۔', '؟', '!', '।', '.', ' ', ''],
      });
      
      const chunks = await splitter.splitText(extractedText);
      console.log(`   📊 Created ${chunks.length} chunks`);

      // Enhanced metadata for UAE priority documents
      const metadata = chunks.map((_, index) => ({
        source: fileName,
        type: 'uae_textbook',
        priority: priority,
        documentType: type,
        language: language,
        extractionMethod: extractionMethod,
        chunkIndex: index,
        totalChunks: chunks.length,
        country: 'UAE',
        isUAEOfficial: priority === 'uae_critical',
        // Add boost factor for retrieval prioritization
        priorityBoost: priority === 'uae_critical' ? 3 : priority === 'uae_high' ? 2 : 1
      }));

      // Upload to vector store with UAE priority markers
      console.log('   🚀 Uploading to vector store with UAE priority...');
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

      // Update tracking to completed
      await this.trackingCollection.updateOne(
        { fileName },
        { 
          $set: { 
            status: 'completed',
            chunks: chunks.length,
            textLength: extractedText.length,
            language: language,
            extractionMethod: extractionMethod,
            uploadedAt: new Date()
          } 
        }
      );

      console.log(`   ✅ Successfully processed UAE document: ${fileName}`);
      console.log(`      📚 ${chunks.length} chunks | 🏆 ${priority} priority | 🇦🇪 UAE Official: ${priority === 'uae_critical'}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Failed to process ${fileName}: ${errorMessage}`);
      
      await this.trackingCollection.updateOne(
        { fileName },
        { 
          $set: { 
            status: 'failed',
            error: errorMessage
          } 
        }
      );
    }
  }

  async processAllUAEDocuments(): Promise<void> {
    try {
      const files = await fs.readdir(this.uaeDocsPath);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      console.log(`\n🇦🇪 UAE Priority Document Upload System`);
      console.log('=' .repeat(60));
      console.log(`Found ${pdfFiles.length} UAE documents to process`);
      
      // Sort by priority (critical first)
      const sortedFiles = pdfFiles.sort((a, b) => {
        const aPriority = this.getDocumentPriority(a).priority;
        const bPriority = this.getDocumentPriority(b).priority;
        
        const priorityOrder = { 'uae_critical': 0, 'uae_high': 1, 'uae_medium': 2, 'regular': 3 };
        return priorityOrder[aPriority] - priorityOrder[bPriority];
      });

      for (const fileName of sortedFiles) {
        await this.processUAEDocument(fileName);
        // Shorter delay for priority processing
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error('Error reading UAE documents directory:', error);
    }
  }

  async getUAEStatistics() {
    const stats = await this.trackingCollection.aggregate([
      {
        $group: {
          _id: { status: '$status', priority: '$priority' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const priorityStats = await this.trackingCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$priority', count: { $sum: 1 }, totalChunks: { $sum: '$chunks' } } }
    ]).toArray();

    const typeStats = await this.trackingCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$documentType', count: { $sum: 1 } } }
    ]).toArray();

    return {
      statusStats: stats,
      priorityStats: priorityStats,
      typeStats: typeStats
    };
  }
}

async function main() {
  const uploader = new UAEPriorityUploader();
  
  try {
    await uploader.connect();
    
    console.log('🇦🇪 Starting UAE Priority Document Processing');
    console.log('================================================');
    
    await uploader.processAllUAEDocuments();
    
    console.log('\n================================================');
    console.log('📊 UAE Document Processing Summary:');
    const stats = await uploader.getUAEStatistics();
    console.log('Status breakdown:', stats.statusStats);
    console.log('Priority breakdown:', stats.priorityStats);
    console.log('Document type breakdown:', stats.typeStats);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await uploader.disconnect();
  }
}

// Run the UAE priority upload
main().catch(console.error);