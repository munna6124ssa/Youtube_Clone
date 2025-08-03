import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import VideoGrid from '../components/Video/VideoGrid';
import { videosAPI } from '../services/api';
import toast from 'react-hot-toast';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [page, setPage] = useState(1);
  const [allVideos, setAllVideos] = useState([]);

  const { data, isLoading, error } = useQuery(
    ['search', query, page],
    () => videosAPI.getVideos({ search: query, page, limit: 20 }),
    {
      enabled: !!query,
      onSuccess: (response) => {
        const newVideos = response.data.videos;
        if (page === 1) {
          setAllVideos(newVideos);
        } else {
          setAllVideos(prev => [...prev, ...newVideos]);
        }
      },
      onError: (error) => {
        toast.error('Failed to search videos. Please try again.');
        console.error('Search error:', error);
      }
    }
  );

  // Reset when search query changes
  useEffect(() => {
    setPage(1);
    setAllVideos([]);
  }, [query]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const hasMore = data?.data?.pagination?.hasMore || false;

  if (!query) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Search for videos</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Use the search bar above to find videos
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{query} - Search - YouTube Clone</title>
        <meta name="description" content={`Search results for "${query}"`} />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              Search results for "{query}"
            </h1>
            {data && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {allVideos.length} results
              </p>
            )}
          </div>

          <VideoGrid
            videos={allVideos}
            loading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </div>
      </div>
    </>
  );
};

export default Search;
