const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 5000
  },
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  dislikeCount: {
    type: Number,
    default: 0
  },
  channel: {
    id: String,
    title: String,
    thumbnail: String,
    subscriberCount: String
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  publishedAt: {
    type: Date,
    required: true
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  dislikes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isUserUploaded: {
    type: Boolean,
    default: false // false for YouTube API videos, true for user uploads
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.isUserUploaded; // Required only for user-uploaded videos
    }
  }
}, {
  timestamps: true
});

// Index for better search performance
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ category: 1 });
videoSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
