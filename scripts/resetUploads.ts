import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function resetUploads() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db('chatter');
    const trackingCollection = db.collection('upload_tracking');
    
    console.log('Resetting upload tracking...');
    
    // Delete all tracking records
    const deleteResult = await trackingCollection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} tracking records`);
    
    // Optional: Clear the training_data collection
    console.log('\nDo you want to clear the training_data collection as well?');
    console.log('This will remove all previously uploaded documents.');
    console.log('Skipping for safety - uncomment the lines below if needed');
    
    // const trainingCollection = db.collection('training_data');
    // const trainingDeleteResult = await trainingCollection.deleteMany({});
    // console.log(`Deleted ${trainingDeleteResult.deletedCount} training documents`);
    
    console.log('\nReset complete. You can now run the upload process fresh.');
    
  } catch (error) {
    console.error('Error resetting uploads:', error);
  } finally {
    await client.close();
  }
}

resetUploads().catch(console.error);