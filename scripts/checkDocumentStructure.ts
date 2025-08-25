import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkDocumentStructure() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found');
    return;
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = client.db('chatter');
    const collection = db.collection('training_data');
    
    // Get a sample document to see its structure
    const sampleDoc = await collection.findOne({});
    
    if (sampleDoc) {
      console.log('📄 Sample Document Structure:');
      console.log('================================');
      
      // Get all field names
      const fields = Object.keys(sampleDoc);
      console.log('\n🔑 Top-level fields:');
      fields.forEach(field => {
        const value = sampleDoc[field];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`  - ${field}: ${type}`);
        
        // Show sample value for important fields
        if (field === 'text') {
          console.log(`    Sample: "${value.substring(0, 100)}..."`);
        } else if (field === 'text_embedding' && Array.isArray(value)) {
          console.log(`    Dimensions: ${value.length}`);
          console.log(`    Sample values: [${value.slice(0, 3).join(', ')}...]`);
        } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          console.log(`    Sub-fields: ${Object.keys(value).join(', ')}`);
        }
      });
      
      // Get multiple documents to check consistency
      console.log('\n📊 Checking field consistency across documents:');
      const docs = await collection.find({}).limit(10).toArray();
      
      const fieldOccurrence: Record<string, number> = {};
      docs.forEach(doc => {
        Object.keys(doc).forEach(field => {
          fieldOccurrence[field] = (fieldOccurrence[field] || 0) + 1;
        });
      });
      
      console.log('\nField occurrence in 10 documents:');
      Object.entries(fieldOccurrence).forEach(([field, count]) => {
        console.log(`  - ${field}: ${count}/10 documents`);
      });
      
      // Check for metadata fields specifically
      console.log('\n🏷️ Metadata Analysis:');
      const docWithMetadata = await collection.findOne({ metadata: { $exists: true } });
      
      if (docWithMetadata && docWithMetadata.metadata) {
        console.log('Metadata fields found:');
        Object.keys(docWithMetadata.metadata).forEach(field => {
          const value = docWithMetadata.metadata[field];
          console.log(`  - metadata.${field}: ${typeof value}`);
          if (typeof value !== 'object') {
            console.log(`    Value: ${value}`);
          }
        });
      } else {
        // Check if metadata is stored at root level
        const metadataFields = ['source', 'type', 'language', 'extractionMethod', 'chunkIndex', 'totalChunks'];
        console.log('Checking for metadata at root level:');
        
        for (const field of metadataFields) {
          const docWithField = await collection.findOne({ [field]: { $exists: true } });
          if (docWithField) {
            console.log(`  ✓ ${field}: found (value: ${docWithField[field]})`);
          } else {
            console.log(`  ✗ ${field}: not found`);
          }
        }
      }
      
      // Create the correct index definition based on actual structure
      console.log('\n🔧 Recommended Vector Index Definition:');
      console.log('=====================================');
      
      const indexDef = {
        "name": "vector_index",
        "type": "vectorSearch",
        "definition": {
          "fields": [
            {
              "type": "vector",
              "path": "text_embedding",
              "numDimensions": 1536,
              "similarity": "cosine"
            }
          ]
        }
      };
      
      // Add filter fields based on what exists
      const filterFields = [];
      if (docWithMetadata?.metadata) {
        // Metadata is nested
        const metadataKeys = Object.keys(docWithMetadata.metadata);
        metadataKeys.forEach(key => {
          filterFields.push({
            "type": "filter",
            "path": `metadata.${key}`
          });
        });
      } else {
        // Check root level fields
        const rootFields = ['source', 'type', 'language', 'extractionMethod'];
        for (const field of rootFields) {
          const exists = await collection.findOne({ [field]: { $exists: true } });
          if (exists) {
            filterFields.push({
              "type": "filter",
              "path": field
            });
          }
        }
      }
      
      if (filterFields.length > 0) {
        indexDef.definition.fields.push(...filterFields);
      }
      
      console.log(JSON.stringify(indexDef, null, 2));
      
    } else {
      console.log('❌ No documents found in collection');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔒 Connection closed');
  }
}

checkDocumentStructure().catch(console.error);