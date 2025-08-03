import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import VideoGrid from '../components/Video/VideoGrid';
import { videosAPI } from '../services/api';
import toast from 'react-hot-toast';

const Home = () => {
  const [page, setPage] = useState(1);
  const [allVideos, setAllVideos] = useState([]);

  const { data, isLoading, error, refetch } = useQuery(
    ['videos', page],
    () => videosAPI.getVideos({ page, limit: 20 }),
    {
      staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce network calls
      refetchOnMount: true, // Always refetch on mount
      retry: 2, // Only retry 2 times
      retryDelay: 1000, // Wait 1 second between retries
      onSuccess: (response) => {
        const newVideos = response.data.videos;
        if (page === 1) {
          setAllVideos(newVideos);
        } else {
          setAllVideos(prev => [...prev, ...newVideos]);
        }
      },
      onError: (error) => {
        // Handle all video loading errors silently - not critical for app functionality
        console.log('Video loading error (handled silently):', error.message);
        // No toast notifications for video loading errors
      }
    }
  );

  // Reset page and videos when component mounts (navigation)
  useEffect(() => {
    setPage(1);
    setAllVideos([]);
    refetch();
  }, []); // Empty dependency array - runs only on mount

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const hasMore = data?.data?.pagination?.hasMore || false;

  return (
    <>
      <Helmet>
        <title>YouTube Clone - Home</title>
        <meta name="description" content="Watch trending videos and discover new content" />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <VideoGrid
          videos={allVideos}
          loading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      </div>
    </>
  );
};

export default Home;
