const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const { fetchVideosFromYoutube, getVideoDetails, getChannelDetails } = require('../utils/youtube');

const router = express.Router();

// Get videos (trending, search, category)
router.get('/', [
  query('search').optional().trim(),
  query('category').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { search = 'trending', category, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let videos = [];
    
    // First, get user-uploaded videos from database
    let dbQuery = { isActive: true, isUserUploaded: true }; // Only user-uploaded videos
    if (category) {
      dbQuery.category = category;
    }
    if (search && search !== 'trending') {
      dbQuery.$text = { $search: search };
    }

    const dbVideos = await Video.find(dbQuery)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Always fetch from YouTube API for trending/search content
    // But DON'T save these to database
    const youtubeVideos = await fetchVideosFromYoutube(search, Math.max(limit - dbVideos.length, 10));
    
    // Format YouTube videos without saving to database
    const formattedYouTubeVideos = youtubeVideos.map(videoData => ({
      _id: `yt_${videoData.videoId}`, // Temporary ID for frontend
      title: videoData.title,
      description: videoData.description,
      videoId: videoData.videoId,
      thumbnail: videoData.thumbnail,
      duration: videoData.duration,
      viewCount: parseInt(videoData.viewCount || 0),
      likeCount: parseInt(videoData.likeCount || 0),
      channel: {
        id: videoData.channelId,
        title: videoData.channelTitle,
        thumbnail: videoData.channelThumbnail || '',
        subscriberCount: videoData.subscriberCount || '0'
      },
      category: category || 'Entertainment',
      tags: videoData.tags || [],
      publishedAt: new Date(videoData.publishedAt),
      isYouTubeVideo: true, // Flag to identify YouTube API videos
      isUserUploaded: false
    }));

    // Combine user videos and YouTube videos
    videos = [...dbVideos, ...formattedYouTubeVideos];

    res.json({
      videos: videos.slice(0, parseInt(limit)), // Ensure we don't exceed limit
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: videos.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get videos error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload user video (for actual user uploads)
router.post('/upload', auth, [
  body('title').isLength({ min: 1, max: 100 }).trim(),
  body('description').optional().isLength({ max: 5000 }).trim(),
  body('videoId').isLength({ min: 1 }).trim(),
  body('thumbnail').isURL(),
  body('duration').isLength({ min: 1 }).trim(),
  body('category').isLength({ min: 1 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, videoId, thumbnail, duration, category, tags } = req.body;
    const userId = req.user._id;

    // Check if video already exists
    const existingVideo = await Video.findOne({ videoId });
    if (existingVideo) {
      return res.status(400).json({ message: 'Video with this ID already exists' });
    }

    // Create user-uploaded video
    const video = new Video({
      title,
      description: description || '',
      videoId,
      thumbnail,
      duration,
      category,
      tags: tags || [],
      publishedAt: new Date(),
      isUserUploaded: true, // Mark as user-uploaded
      uploader: userId,
      channel: {
        id: req.user._id,
        title: req.user.channelName || req.user.username,
        thumbnail: req.user.avatar || '',
        subscriberCount: '0'
      }
    });

    await video.save();
    await video.populate('uploader', 'username channelName avatar');

    res.status(201).json({
      message: 'Video uploaded successfully',
      video
    });
  } catch (error) {
    console.error('Upload video error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single video
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // First check if it's a user-uploaded video in database
    let video = await Video.findOne({ videoId, isActive: true, isUserUploaded: true })
      .populate('comments')
      .populate('uploader', 'username channelName avatar');

    if (video) {
      // Increment view count for user-uploaded videos
      video.viewCount += 1;
      await video.save();
      return res.json({ video });
    }

    // If not found in database, fetch from YouTube API (don't save)
    const videoDetails = await getVideoDetails(videoId);
    if (videoDetails && videoDetails.length > 0) {
      const videoData = videoDetails[0];
      
      // Return YouTube video data without saving to database
      const youtubeVideo = {
        _id: `yt_${videoId}`,
        title: videoData.title,
        description: videoData.description,
        videoId: videoId,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration,
        viewCount: parseInt(videoData.viewCount || 0),
        likeCount: parseInt(videoData.likeCount || 0),
        dislikeCount: parseInt(videoData.dislikeCount || 0),
        channel: {
          id: videoData.channelId,
          title: videoData.channelTitle,
          thumbnail: videoData.channelThumbnail || '',
          subscriberCount: videoData.subscriberCount || '0'
        },
        category: 'Entertainment',
        tags: videoData.tags || [],
        publishedAt: new Date(videoData.publishedAt),
        isYouTubeVideo: true,
        isUserUploaded: false,
        comments: [], // YouTube videos don't have our comment system
        likes: [],
        dislikes: []
      };

      return res.json({ video: youtubeVideo });
    }

    res.status(404).json({ message: 'Video not found' });
  } catch (error) {
    console.error('Get video error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike video
router.post('/:videoId/like', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    const video = await Video.findOne({ videoId, isActive: true });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if user already liked
    const existingLike = video.likes.find(like => like.user.toString() === userId.toString());
    const existingDislike = video.dislikes.find(dislike => dislike.user.toString() === userId.toString());

    if (existingLike) {
      // Remove like
      video.likes = video.likes.filter(like => like.user.toString() !== userId.toString());
      video.likeCount = Math.max(0, video.likeCount - 1);
    } else {
      // Add like
      video.likes.push({ user: userId });
      video.likeCount += 1;

      // Remove dislike if exists
      if (existingDislike) {
        video.dislikes = video.dislikes.filter(dislike => dislike.user.toString() !== userId.toString());
        video.dislikeCount = Math.max(0, video.dislikeCount - 1);
      }
    }

    await video.save();

    res.json({
      liked: !existingLike,
      likeCount: video.likeCount,
      dislikeCount: video.dislikeCount
    });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dislike video
router.post('/:videoId/dislike', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    const video = await Video.findOne({ videoId, isActive: true });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const existingDislike = video.dislikes.find(dislike => dislike.user.toString() === userId.toString());
    const existingLike = video.likes.find(like => like.user.toString() === userId.toString());

    if (existingDislike) {
      // Remove dislike
      video.dislikes = video.dislikes.filter(dislike => dislike.user.toString() !== userId.toString());
      video.dislikeCount = Math.max(0, video.dislikeCount - 1);
    } else {
      // Add dislike
      video.dislikes.push({ user: userId });
      video.dislikeCount += 1;

      // Remove like if exists
      if (existingLike) {
        video.likes = video.likes.filter(like => like.user.toString() !== userId.toString());
        video.likeCount = Math.max(0, video.likeCount - 1);
      }
    }

    await video.save();

    res.json({
      disliked: !existingDislike,
      likeCount: video.likeCount,
      dislikeCount: video.dislikeCount
    });
  } catch (error) {
    console.error('Dislike video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
