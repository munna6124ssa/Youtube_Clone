import React, { useState, useEffect } from 'react';
import { videosAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DebugVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log('Fetching videos...');
        const response = await videosAPI.getVideos({ page: 1, limit: 5 });
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        setVideos(response.data.videos || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching videos:', err);
        toast.error('Failed to load debug videos');
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <div className="p-4">Loading videos...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Debug: Videos ({videos.length})</h2>
      {videos.length === 0 ? (
        <p>No videos found</p>
      ) : (
        <div className="space-y-4">
          {videos.map((video, index) => (
            <div key={index} className="border p-4 rounded">
              <h3 className="font-semibold">{video.title}</h3>
              <p className="text-sm text-gray-600">Video ID: {video.videoId}</p>
              <p className="text-sm text-gray-600">Channel: {video.channel?.title}</p>
              <p className="text-sm text-gray-600">Views: {video.viewCount}</p>
              {video.thumbnail && (
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="mt-2 w-32 h-20 object-cover rounded"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebugVideos;
