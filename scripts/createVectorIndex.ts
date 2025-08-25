import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createVectorSearchIndex() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found');
    return;
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('chatter');
    const collection = db.collection('training_data');
    
    console.log('🔨 Creating vector search index...');
    
    // Create the vector search index
    // Note: This needs to be done through MongoDB Atlas UI or Atlas Search API
    // as it's not a regular index but an Atlas Search index
    
    const indexDefinition = {
      "mappings": {
        "dynamic": true,
        "fields": {
          "text_embedding": {
            "dimensions": 1536,
            "similarity": "cosine",
            "type": "knnVector"
          }
        }
      }
    };
    
    console.log('\n📝 Vector Search Index Definition Required:');
    console.log(JSON.stringify(indexDefinition, null, 2));
    
    console.log('\n⚠️ IMPORTANT: Vector search indexes must be created through:');
    console.log('1. MongoDB Atlas UI (Database > Search > Create Index)');
    console.log('2. Atlas Admin API');
    console.log('3. MongoDB CLI with atlas command');
    
    console.log('\n📋 Steps to create index in Atlas UI:');
    console.log('1. Go to MongoDB Atlas Dashboard');
    console.log('2. Navigate to your cluster');
    console.log('3. Click on "Search" tab');
    console.log('4. Click "Create Search Index"');
    console.log('5. Choose "JSON Editor"');
    console.log('6. Select database: chatter');
    console.log('7. Select collection: training_data');
    console.log('8. Index name: vector_index');
    console.log('9. Paste the index definition above');
    console.log('10. Click "Create Search Index"');
    
    // Check if we can at least see the existing indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('\n📊 Current regular indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}`);
    });
    
    // Try to create the index using Atlas Admin API if available
    console.log('\n🔄 Attempting to create index via Atlas Admin API...');
    
    // This would require Atlas Admin API credentials
    // For now, we'll provide instructions
    
    console.log('\n💡 Alternative: Use MongoDB CLI');
    console.log('Run this command:');
    console.log(`
atlas clusters search indexes create \\
  --clusterName Cluster0 \\
  --collection training_data \\
  --db chatter \\
  --name vector_index \\
  --type vectorSearch \\
  --file <(echo '${JSON.stringify(indexDefinition)}')
    `);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔒 Connection closed');
  }
}

createVectorSearchIndex().catch(console.error);