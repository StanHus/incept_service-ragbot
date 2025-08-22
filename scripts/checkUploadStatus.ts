import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkStatus() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db('chatter');
    const trackingCollection = db.collection('upload_tracking');
    
    // Get overall statistics
    const stats = await trackingCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          files: { $push: '$fileName' }
        }
      }
    ]).toArray();
    
    console.log('\n📊 Upload Status Summary:');
    console.log('========================');
    
    let totalFiles = 0;
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} files`);
      totalFiles += stat.count;
    });
    console.log(`Total: ${totalFiles} files`);
    
    // Show failed files if any
    const failedStat = stats.find(s => s._id === 'failed');
    if (failedStat && failedStat.count > 0) {
      console.log('\n❌ Failed uploads:');
      const failed = await trackingCollection.find({ status: 'failed' }).toArray();
      failed.forEach(f => {
        console.log(`  - ${f.fileName}: ${f.error}`);
      });
    }
    
    // Show processing files if any
    const processingStat = stats.find(s => s._id === 'processing');
    if (processingStat && processingStat.count > 0) {
      console.log('\n⏳ Currently processing:');
      processingStat.files.forEach((f: string) => {
        console.log(`  - ${f}`);
      });
    }
    
    // Get total chunks
    const totalChunks = await trackingCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$chunks' } } }
    ]).toArray();
    
    console.log(`\n📚 Total chunks in database: ${totalChunks[0]?.total || 0}`);
    
    // Show recent uploads
    const recent = await trackingCollection
      .find({ status: 'completed' })
      .sort({ uploadedAt: -1 })
      .limit(5)
      .toArray();
    
    if (recent.length > 0) {
      console.log('\n🕐 Recent uploads:');
      recent.forEach(r => {
        console.log(`  - ${r.fileName} (${r.chunks} chunks) at ${r.uploadedAt?.toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking status:', error);
  } finally {
    await client.close();
  }
}

checkStatus().catch(console.error);