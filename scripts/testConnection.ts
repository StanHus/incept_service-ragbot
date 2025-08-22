import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testConnection() {
  console.log('🔌 Testing MongoDB connection and data retrieval...');
  
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db('chatter');
    const dataCollection = db.collection('training_data');
    const trackingCollection = db.collection('upload_tracking');
    
    // Test basic queries
    const totalDocs = await dataCollection.countDocuments();
    console.log(`📚 Total chunks in training_data: ${totalDocs}`);
    
    const statusStats = await trackingCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log('📊 Upload status distribution:', statusStats);
    
    // Sample some documents
    const sampleDocs = await dataCollection.find({}).limit(3).toArray();
    console.log('\n📝 Sample documents:');
    sampleDocs.forEach((doc, i) => {
      console.log(`${i + 1}. Source: ${doc.source}`);
      console.log(`   Text preview: ${doc.text?.substring(0, 100)}...`);
      console.log(`   Language: ${doc.language || 'unknown'}`);
      console.log(`   Grade: ${doc.grade_level || 'unknown'}`);
    });
    
    // Check language distribution
    const langStats = await dataCollection.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\n🌍 Language distribution:', langStats);
    
    // Check recent uploads
    const recentUploads = await trackingCollection.find({
      status: { $in: ['completed', 'ocr_completed'] }
    }).sort({ uploadedAt: -1 }).limit(5).toArray();
    
    console.log('\n📅 Recent successful uploads:');
    recentUploads.forEach(upload => {
      console.log(`- ${upload.fileName} (${upload.chunks} chunks, ${upload.language})`);
    });
    
    console.log('\n✅ Database connectivity test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await client.close();
  }
}

testConnection().catch(console.error);