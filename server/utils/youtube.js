const axios = require('axios');

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

const fetchVideosFromYoutube = async (query = 'trending', maxResults = 50) => {
  try {
    let url;
    let params;

    if (query === 'trending') {
      // Fetch trending videos
      url = `${YOUTUBE_API_BASE_URL}/videos`;
      params = {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        regionCode: 'IN',
        maxResults: maxResults,
        key: API_KEY
      };
    } else {
      // Search for videos
      url = `${YOUTUBE_API_BASE_URL}/search`;
      params = {
        part: 'snippet',
        q: query,
        type: 'video',
        regionCode: 'IN',
        maxResults: maxResults,
        order: 'relevance',
        key: API_KEY
      };
    }

    const response = await axios.get(url, { params });
    
    if (query !== 'trending') {
      // For search results, we need to fetch additional details
      const videoIds = response.data.items.map(item => item.id.videoId).join(',');
      return await getVideoDetails(videoIds);
    }
    
    return formatVideoData(response.data.items || []);
  } catch (error) {
    console.error('Error fetching videos from YouTube:', error);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    return [];
  }
};

const getVideoDetails = async (videoId) => {
  try {
    const url = `${YOUTUBE_API_BASE_URL}/videos`;
    const params = {
      part: 'snippet,statistics,contentDetails',
      id: videoId,
      key: API_KEY
    };

    const response = await axios.get(url, { params });
    return formatVideoData(response.data.items || []);
  } catch (error) {
    console.error('Error fetching video details:', error);
    return [];
  }
};

const getChannelDetails = async (channelId) => {
  try {
    const url = `${YOUTUBE_API_BASE_URL}/channels`;
    const params = {
      part: 'snippet,statistics',
      id: channelId,
      key: API_KEY
    };

    const response = await axios.get(url, { params });
    return response.data.items[0] || null;
  } catch (error) {
    console.error('Error fetching channel details:', error);
    return null;
  }
};

const searchChannels = async (query, maxResults = 10) => {
  try {
    const url = `${YOUTUBE_API_BASE_URL}/search`;
    const params = {
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: maxResults,
      key: API_KEY
    };

    const response = await axios.get(url, { params });
    return response.data.items || [];
  } catch (error) {
    console.error('Error searching channels:', error);
    return [];
  }
};

const getVideosByCategory = async (categoryId, maxResults = 20) => {
  try {
    const url = `${YOUTUBE_API_BASE_URL}/videos`;
    const params = {
      part: 'snippet,statistics,contentDetails',
      chart: 'mostPopular',
      videoCategoryId: categoryId,
      regionCode: 'IN',
      maxResults: maxResults,
      key: API_KEY
    };

    const response = await axios.get(url, { params });
    return formatVideoData(response.data.items || []);
  } catch (error) {
    console.error('Error fetching videos by category:', error);
    return [];
  }
};

const formatVideoData = (items) => {
  return items.map(item => ({
    videoId: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    duration: item.contentDetails?.duration || 'PT0S',
    viewCount: item.statistics?.viewCount || '0',
    likeCount: item.statistics?.likeCount || '0',
    commentCount: item.statistics?.commentCount || '0',
    tags: item.snippet.tags || [],
    categoryId: item.snippet.categoryId,
    channel: {
      id: item.snippet.channelId,
      title: item.snippet.channelTitle,
      thumbnail: null // Will be fetched separately if needed
    }
  }));
};

module.exports = {
  fetchVideosFromYoutube,
  getVideoDetails,
  getChannelDetails,
  searchChannels,
  getVideosByCategory
};
