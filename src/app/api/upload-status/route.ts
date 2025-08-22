import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(req: NextRequest) {
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db('chatter');
    const trackingCollection = db.collection('upload_tracking');
    
    // Get overall statistics
    const statusCounts = await trackingCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Get total chunks
    const totalChunksResult = await trackingCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$chunks' } } }
    ]).toArray();
    
    const totalChunks = totalChunksResult[0]?.total || 0;
    
    // Get recent uploads
    const recentUploads = await trackingCollection
      .find({ status: 'completed' })
      .sort({ uploadedAt: -1 })
      .limit(10)
      .toArray();
    
    // Get failed uploads
    const failedUploads = await trackingCollection
      .find({ status: 'failed' })
      .limit(20)
      .toArray();
    
    return NextResponse.json({
      statusCounts,
      totalChunks,
      recentUploads: recentUploads.map(u => ({
        fileName: u.fileName,
        chunks: u.chunks,
        uploadedAt: u.uploadedAt,
        language: u.language,
        textLength: u.textLength
      })),
      failedUploads: failedUploads.map(f => ({
        fileName: f.fileName,
        error: f.error
      }))
    });
    
  } catch (error) {
    console.error('Error fetching upload status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  } finally {
    await client.close();
  }
}