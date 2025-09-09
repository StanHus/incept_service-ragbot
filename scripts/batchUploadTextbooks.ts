import { promises as fs } from "fs";
import path from "path";
import pdf from "pdf-parse";
import { MongoClient, Db, Collection } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/community/vectorstores/mongodb_atlas";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config({ path: ".env.local" });

interface UploadTracker {
  fileName: string;
  filePath: string;
  status: "pending" | "processing" | "completed" | "failed";
  chunks?: number;
  error?: string;
  uploadedAt?: Date;
}

class TextbookUploader {
  private client: MongoClient;
  private db: Db;
  private trackingCollection: Collection<UploadTracker>;
  private processedFiles: Set<string> = new Set();
  private embeddings: OpenAIEmbeddings;
  private collection: any;

  constructor() {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    this.client = new MongoClient(process.env.MONGODB_URI);
    this.db = this.client.db("chatter");
    this.trackingCollection =
      this.db.collection<UploadTracker>("upload_tracking");
    this.collection = this.db.collection("training_data");
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async connect() {
    await this.client.connect();
    console.log("Connected to MongoDB");

    // Load already processed files
    const processed = await this.trackingCollection
      .find({ status: "completed" })
      .toArray();
    processed.forEach((file) => this.processedFiles.add(file.fileName));
    console.log(`Found ${this.processedFiles.size} already processed files`);
  }

  async disconnect() {
    await this.client.close();
    console.log("Disconnected from MongoDB");
  }

  async processFile(filePath: string, fileName: string): Promise<void> {
    // Check if already processed
    if (this.processedFiles.has(fileName)) {
      console.log(`Skipping ${fileName} - already processed`);
      return;
    }

    console.log(`Processing: ${fileName}`);

    // Update tracking to processing
    await this.trackingCollection.updateOne(
      { fileName },
      {
        $set: {
          fileName,
          filePath,
          status: "processing",
        },
      },
      { upsert: true }
    );

    try {
      // Read PDF file
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);

      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error("No text content found in PDF");
      }

      // Split text into chunks
      const splitter = new CharacterTextSplitter({
        separator: "\n",
        chunkSize: 1000,
        chunkOverlap: 100,
      });

      const chunks = await splitter.splitText(pdfData.text);
      console.log(`  Created ${chunks.length} chunks`);

      // Add metadata to each chunk
      const metadata = chunks.map(() => ({
        source: fileName,
        type: "textbook",
      }));

      // Upload to vector store
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
            status: "completed",
            chunks: chunks.length,
            uploadedAt: new Date(),
          },
        }
      );

      this.processedFiles.add(fileName);
      console.log(`  ✓ Successfully uploaded ${fileName}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`  ✗ Failed to process ${fileName}: ${errorMessage}`);

      // Update tracking to failed
      await this.trackingCollection.updateOne(
        { fileName },
        {
          $set: {
            status: "failed",
            error: errorMessage,
          },
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
        await this.processDirectory(fullPath);
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        await this.processFile(fullPath, file.name);
        // Add a small delay to avoid overloading the API
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  async getStatistics() {
    const stats = await this.trackingCollection
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const totalChunks = await this.trackingCollection
      .aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$chunks" } } },
      ])
      .toArray();

    return {
      statusCounts: stats,
      totalChunks: totalChunks[0]?.total || 0,
    };
  }
}

async function main() {
  const uploader = new TextbookUploader();

  try {
    await uploader.connect();

    const textbooksDir = path.join(process.cwd(), "textbooks", "instructions");
    console.log(`Starting batch upload from: ${textbooksDir}`);
    console.log("========================================");

    await uploader.processDirectory(textbooksDir);

    console.log("\n========================================");
    console.log("Upload Summary:");
    const stats = await uploader.getStatistics();
    console.log("Status counts:", stats.statusCounts);
    console.log("Total chunks created:", stats.totalChunks);
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await uploader.disconnect();
  }
}

// Run the script
main().catch(console.error);
