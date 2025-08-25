import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  console.log('🔗 Testing MongoDB connection...');
  console.log('URI:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas');
    
    // Test database access
    const db = client.db('chatter');
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check training_data collection
    const trainingData = db.collection('training_data');
    const count = await trainingData.countDocuments();
    console.log(`\n📊 Training data documents: ${count}`);
    
    // Check upload_tracking collection
    const uploadTracking = db.collection('upload_tracking');
    const stats = await uploadTracking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n📈 Upload status:');
    stats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} files`);
    });
    
    // Test vector search capability
    console.log('\n🔍 Testing vector search index...');
    const indexes = await trainingData.listIndexes().toArray();
    const vectorIndex = indexes.find(idx => idx.name === 'vector_index');
    
    if (vectorIndex) {
      console.log('✅ Vector index found');
      console.log('Index definition:', JSON.stringify(vectorIndex, null, 2));
    } else {
      console.log('⚠️ Vector index not found - may need to create it');
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await client.close();
    console.log('\n🔒 Connection closed');
  }
}

testConnection().catch(console.error);