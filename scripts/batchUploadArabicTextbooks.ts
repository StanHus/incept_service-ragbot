import { promises as fs } from 'fs';
import path from 'path';
import { MongoClient, Db, Collection } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/community/vectorstores/mongodb_atlas';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import pdf from 'pdf-parse';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config({ path: '.env.local' });

interface UploadTracker {
  fileName: string;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunks?: number;
  error?: string;
  uploadedAt?: Date;
  textLength?: number;
  language?: string;
}

class ArabicTextbookUploader {
  private client: MongoClient;
  private db: Db;
  private trackingCollection: Collection<UploadTracker>;
  private processedFiles: Set<string> = new Set();
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
    
    // Load already processed files
    const processed = await this.trackingCollection.find({ status: 'completed' }).toArray();
    processed.forEach(file => this.processedFiles.add(file.fileName));
    console.log(`Found ${this.processedFiles.size} already processed files`);
  }

  async disconnect() {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      
      // Configure pdf-parse options for better Arabic text extraction
      const options = {
        // Attempt to extract text with proper encoding
        max: 0, // Parse all pages
        // Custom render function for better text extraction
        pagerender: (pageData: any) => {
          // Options for text extraction
          const renderOptions = {
            normalizeWhitespace: false,
            disableCombineTextItems: false
          };
          
          return pageData.getTextContent(renderOptions)
            .then((textContent: any) => {
              let text = '';
              for (const item of textContent.items) {
                if (item.str) {
                  text += item.str + ' ';
                }
              }
              return text;
            });
        }
      };
      
      const pdfData = await pdf(dataBuffer, options);
      
      let fullText = pdfData.text || '';
      
      // Additional cleaning for Arabic text
      fullText = fullText
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n')  // Replace multiple newlines with single
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')  // Remove control characters
        .trim();

      return fullText;
    } catch (error) {
      console.error(`Error extracting text from ${filePath}:`, error);
      // Return empty string instead of throwing to continue processing
      return '';
    }
  }

  detectLanguage(text: string): string {
    // Simple language detection based on character ranges
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

  async processFile(filePath: string, fileName: string): Promise<void> {
    // Check if already processed
    if (this.processedFiles.has(fileName)) {
      console.log(`Skipping ${fileName} - already processed`);
      return;
    }

    console.log(`\nProcessing: ${fileName}`);
    
    // Update tracking to processing
    await this.trackingCollection.updateOne(
      { fileName },
      { 
        $set: { 
          fileName,
          filePath,
          status: 'processing' 
        } 
      },
      { upsert: true }
    );

    try {
      // Extract text using pdfjs
      console.log('  Extracting text with Arabic support...');
      const extractedText = await this.extractTextFromPDF(filePath);
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('Insufficient text content extracted from PDF');
      }

      const language = this.detectLanguage(extractedText);
      console.log(`  Detected language: ${language}`);
      console.log(`  Extracted ${extractedText.length} characters`);

      // Use RecursiveCharacterTextSplitter for better handling of Arabic text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,  // Larger chunks for Arabic text
        chunkOverlap: 200,
        separators: ['\n\n', '\n', '۔', '؟', '!', '।', ' ', ''],  // Include Arabic punctuation
      });
      
      const chunks = await splitter.splitText(extractedText);
      console.log(`  Created ${chunks.length} chunks`);

      // Add metadata to each chunk
      const metadata = chunks.map((_, index) => ({
        source: fileName,
        type: 'textbook',
        language: language,
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

      // Update tracking to completed
      await this.trackingCollection.updateOne(
        { fileName },
        { 
          $set: { 
            status: 'completed',
            chunks: chunks.length,
            textLength: extractedText.length,
            language: language,
            uploadedAt: new Date()
          } 
        }
      );

      this.processedFiles.add(fileName);
      console.log(`  ✓ Successfully uploaded ${fileName} (${chunks.length} chunks, ${language})`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  ✗ Failed to process ${fileName}: ${errorMessage}`);
      
      // Update tracking to failed
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

  async processDirectory(dirPath: string): Promise<void> {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        // Recursively process subdirectories
        console.log(`\nEntering directory: ${file.name}`);
        await this.processDirectory(fullPath);
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        await this.processFile(fullPath, file.name);
        // Add a small delay to avoid overloading the API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
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

    const totalChunks = await this.trackingCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$chunks' } } }
    ]).toArray();

    const languageStats = await this.trackingCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]).toArray();

    return {
      statusCounts: stats,
      totalChunks: totalChunks[0]?.total || 0,
      languageDistribution: languageStats
    };
  }

  async resetFailedUploads() {
    // Reset failed uploads to pending so they can be retried
    const result = await this.trackingCollection.updateMany(
      { status: 'failed' },
      { $set: { status: 'pending' } }
    );
    console.log(`Reset ${result.modifiedCount} failed uploads to pending`);
    
    // Remove from processed files set
    const failed = await this.trackingCollection.find({ status: 'pending' }).toArray();
    failed.forEach(file => this.processedFiles.delete(file.fileName));
  }
}

async function main() {
  const uploader = new ArabicTextbookUploader();
  
  try {
    await uploader.connect();
    
    // Optionally reset failed uploads
    await uploader.resetFailedUploads();
    
    const textbooksDir = path.join(process.cwd(), 'textbooks');
    console.log(`Starting batch upload with Arabic support from: ${textbooksDir}`);
    console.log('========================================');
    
    await uploader.processDirectory(textbooksDir);
    
    console.log('\n========================================');
    console.log('Upload Summary:');
    const stats = await uploader.getStatistics();
    console.log('Status counts:', stats.statusCounts);
    console.log('Total chunks created:', stats.totalChunks);
    console.log('Language distribution:', stats.languageDistribution);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await uploader.disconnect();
  }
}

// Run the script
main().catch(console.error);