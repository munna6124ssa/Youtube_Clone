const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Comment = require('../models/Comment');
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const { getLocationFromIP } = require('../utils/location');
const { isCommentValid, cleanComment, shouldAutoDelete } = require('../utils/commentFilter');
const { translateText, detectLanguage, getSupportedLanguages } = require('../utils/translate');

const router = express.Router();

console.log('✅ Comments routes loaded successfully');

// Get comments for a video
router.get('/:videoId', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { videoId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      videoId, 
      isDeleted: false // Only show non-deleted comments
    })
    .populate('user', 'username avatar channelName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count for pagination
    const totalComments = await Comment.countDocuments({ 
      videoId, 
      isDeleted: false 
    });

    // Add additional metadata to comments
    const enhancedComments = comments.map(comment => ({
      ...comment.toJSON(),
      likeCount: comment.likes ? comment.likes.length : 0,
      dislikeCount: comment.dislikes ? comment.dislikes.length : 0,
      hasTranslations: comment.translations && comment.translations.size > 0,
      availableTranslations: comment.translations ? Array.from(comment.translations.keys()) : [],
      isOriginalLanguage: comment.language || 'en',
      locationDisplay: comment.location ? `${comment.location.city}, ${comment.location.state}` : 'Unknown Location'
    }));

    res.json({
      comments: enhancedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalComments,
        totalPages: Math.ceil(totalComments / limit),
        hasMore: comments.length === parseInt(limit)
      },
      stats: {
        total: totalComments,
        currentPage: enhancedComments.length
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/', auth, [
  body('videoId').notEmpty().trim(),
  body('content').isLength({ min: 1, max: 1000 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { videoId, content } = req.body;
    const userId = req.user._id;

    // Validate comment content for special characters
    if (!isCommentValid(content)) {
      return res.status(400).json({ 
        message: 'Comment contains invalid characters, excessive special characters, or spam patterns. Please use only basic punctuation and avoid repeated characters.',
        reason: 'special_chars'
      });
    }

    // Clean the comment
    const cleanedContent = cleanComment(content);
    
    if (!cleanedContent || cleanedContent.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Comment is empty after cleaning. Please provide valid content.',
        reason: 'empty_after_cleaning'
      });
    }

    // Check if video exists
    const video = await Video.findOne({ videoId });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Get user's registered location (preferred over IP location)
    const User = require('../models/User');
    const user = await User.findById(userId);
    let userLocation = {
      country: 'Unknown',
      state: 'Unknown', 
      city: 'Unknown'
    };

    if (user && user.location) {
      userLocation = {
        country: user.location.country || 'IN',
        state: user.location.state || 'Unknown',
        city: user.location.city || 'Unknown'
      };
      console.log('Using user registered location for comment:', userLocation);
    } else {
      // Fallback to IP-based location
      const clientIP = req.ip || req.connection.remoteAddress;
      const ipLocation = getLocationFromIP(clientIP);
      if (ipLocation) {
        userLocation = {
          country: ipLocation.country || 'IN',
          state: ipLocation.state || 'Unknown',
          city: ipLocation.city || 'Unknown'
        };
        console.log('Using IP-based location for comment:', userLocation);
      }
    }

    // Detect language of the comment
    let detectedLanguage = 'en';
    try {
      const detection = await detectLanguage(cleanedContent);
      detectedLanguage = detection.language || 'en';
      console.log(`Language detected for comment: ${detectedLanguage} (confidence: ${detection.confidence})`);
    } catch (error) {
      console.warn('Language detection failed:', error.message);
    }

    // Create comment
    const comment = new Comment({
      videoId,
      user: userId,
      content: cleanedContent,
      originalContent: content,
      language: detectedLanguage,
      location: userLocation
    });

    await comment.save();
    await comment.populate('user', 'username avatar channelName');

    // Add comment to video
    video.comments.push(comment._id);
    await video.save();

    console.log('Comment created successfully:', {
      id: comment._id,
      user: user.username,
      location: userLocation,
      language: detectedLanguage,
      content: cleanedContent.substring(0, 50) + '...'
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        ...comment.toJSON(),
        detectedLanguage,
        languageConfidence: detectedLanguage !== 'en' ? 'high' : 'medium'
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike comment
router.post('/:commentId/like', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existingLike = comment.likes.find(like => like.user.toString() === userId.toString());
    const existingDislike = comment.dislikes.find(dislike => dislike.user.toString() === userId.toString());

    if (existingLike) {
      // Remove like
      comment.likes = comment.likes.filter(like => like.user.toString() !== userId.toString());
    } else {
      // Add like
      comment.likes.push({ user: userId });

      // Remove dislike if exists
      if (existingDislike) {
        comment.dislikes = comment.dislikes.filter(dislike => dislike.user.toString() !== userId.toString());
      }
    }

    await comment.save();

    res.json({
      liked: !existingLike,
      likeCount: comment.likes.length,
      dislikeCount: comment.dislikes.length
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dislike comment
router.post('/:commentId/dislike', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existingDislike = comment.dislikes.find(dislike => dislike.user.toString() === userId.toString());
    const existingLike = comment.likes.find(like => like.user.toString() === userId.toString());

    let wasAlreadyDisliked = !!existingDislike;

    if (existingDislike) {
      // Remove dislike
      comment.dislikes = comment.dislikes.filter(dislike => dislike.user.toString() !== userId.toString());
    } else {
      // Add dislike
      comment.dislikes.push({ user: userId });

      // Remove like if exists
      if (existingLike) {
        comment.likes = comment.likes.filter(like => like.user.toString() !== userId.toString());
      }
    }

    // Auto-delete comment if it gets 2 or more dislikes
    let autoDeleted = false;
    if (!wasAlreadyDisliked && comment.dislikes.length >= 2 && !comment.isDeleted) {
      comment.isDeleted = true;
      comment.deletedReason = 'auto_dislike';
      autoDeleted = true;
      
      console.log(`Comment auto-deleted due to ${comment.dislikes.length} dislikes:`, {
        commentId: comment._id,
        content: comment.content.substring(0, 50) + '...',
        dislikes: comment.dislikes.length
      });
    }

    await comment.save();

    res.json({
      disliked: !wasAlreadyDisliked,
      likeCount: comment.likes.length,
      dislikeCount: comment.dislikes.length,
      autoDeleted,
      isDeleted: comment.isDeleted,
      deletedReason: comment.isDeleted ? comment.deletedReason : null,
      message: autoDeleted ? 'Comment was automatically removed due to community feedback' : undefined
    });
  } catch (error) {
    console.error('Dislike comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Translate comment
router.post('/:commentId/translate', auth, [
  body('targetLanguage').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { commentId } = req.params;
    const { targetLanguage } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if translation already exists
    if (comment.translations.has(targetLanguage)) {
      return res.json({
        translatedText: comment.translations.get(targetLanguage),
        targetLanguage
      });
    }

    // In a real implementation, you would use Google Translate API here
    // For now, we'll return a mock translation
    const mockTranslation = `[Translated to ${targetLanguage}] ${comment.content}`;
    
    // Save translation
    comment.translations.set(targetLanguage, mockTranslation);
    await comment.save();

    res.json({
      translatedText: mockTranslation,
      targetLanguage
    });
  } catch (error) {
    console.error('Translate comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reply to comment
router.post('/:commentId/reply', auth, [
  body('content').isLength({ min: 1, max: 500 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Validate reply content
    if (!isCommentValid(content)) {
      return res.status(400).json({ 
        message: 'Reply contains invalid characters or is too long' 
      });
    }

    const cleanedContent = cleanComment(content);

    comment.replies.push({
      user: userId,
      content: cleanedContent
    });

    await comment.save();
    await comment.populate('replies.user', 'username avatar channelName');

    res.status(201).json({
      message: 'Reply added successfully',
      reply: comment.replies[comment.replies.length - 1]
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Translate comment
router.post('/:commentId/translate', [
  body('targetLanguage').notEmpty().withMessage('Target language is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { commentId } = req.params;
    const { targetLanguage } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if translation already exists
    if (comment.translations && comment.translations.has(targetLanguage)) {
      return res.json({
        translatedText: comment.translations.get(targetLanguage),
        targetLanguage,
        cached: true
      });
    }

    // Detect source language if not available
    let sourceLanguage = comment.language;
    if (!sourceLanguage) {
      sourceLanguage = await detectLanguage(comment.text);
      comment.language = sourceLanguage;
    }

    // Don't translate if already in target language
    if (sourceLanguage === targetLanguage) {
      return res.json({
        translatedText: comment.text,
        targetLanguage,
        message: 'Comment is already in the target language'
      });
    }

    // Translate the comment
    const translatedText = await translateText(comment.text, targetLanguage);

    // Save translation to database
    if (!comment.translations) {
      comment.translations = new Map();
    }
    comment.translations.set(targetLanguage, translatedText);
    await comment.save();

    res.json({
      translatedText,
      targetLanguage,
      sourceLanguage,
      cached: false
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ message: 'Translation failed', error: error.message });
  }
});

// Get supported languages
router.get('/translate/languages', async (req, res) => {
  try {
    const languages = await getSupportedLanguages();
    res.json({ languages });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ message: 'Failed to get supported languages' });
  }
});

// Auto-delete comments with 2+ dislikes
router.post('/:commentId/check-auto-delete', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (shouldAutoDelete(comment)) {
      comment.isDeleted = true;
      comment.deletedAt = new Date();
      comment.deletionReason = 'Auto-deleted due to excessive dislikes';
      await comment.save();

      return res.json({ 
        message: 'Comment auto-deleted due to excessive dislikes',
        deleted: true 
      });
    }

    res.json({ deleted: false });
  } catch (error) {
    console.error('Auto-delete check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
