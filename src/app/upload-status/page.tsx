'use client';

import { useEffect, useState } from 'react';
import NavBar from '../component/navbar';

interface UploadStats {
  statusCounts: { _id: string; count: number }[];
  totalChunks: number;
  recentUploads: {
    fileName: string;
    chunks: number;
    uploadedAt: string;
  }[];
  failedUploads: {
    fileName: string;
    error: string;
  }[];
}

export default function UploadStatus() {
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/upload-status');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      case 'pending': return '⏸️';
      default: return '❓';
    }
  };

  return (
    <main>
      <NavBar />
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Upload Status Dashboard</h1>
        
        {loading ? (
          <div className="text-lg">Loading...</div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Status Summary */}
            <div className="bg-gray-100 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Status Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.statusCounts.map(status => (
                  <div key={status._id} className="bg-white p-4 rounded">
                    <div className="text-2xl mb-2">{getStatusEmoji(status._id)}</div>
                    <div className="text-lg font-medium">{status._id}</div>
                    <div className="text-2xl">{status.count}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-lg">
                <strong>Total Chunks Created:</strong> {stats.totalChunks}
              </div>
            </div>

            {/* Failed Uploads */}
            {stats.failedUploads.length > 0 && (
              <div className="bg-red-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-red-700">Failed Uploads</h2>
                <div className="space-y-2">
                  {stats.failedUploads.map((file, idx) => (
                    <div key={idx} className="text-sm">
                      <strong>{file.fileName}:</strong> {file.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Uploads */}
            {stats.recentUploads.length > 0 && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-green-700">Recent Uploads</h2>
                <div className="space-y-2">
                  {stats.recentUploads.map((file, idx) => (
                    <div key={idx} className="text-sm">
                      <strong>{file.fileName}</strong> ({file.chunks} chunks) - {new Date(file.uploadedAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-lg text-red-600">Failed to load statistics</div>
        )}
      </div>
    </main>
  );
}