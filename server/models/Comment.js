const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  originalContent: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  translations: {
    type: Map,
    of: String,
    default: new Map()
  },
  location: {
    country: String,
    state: String,
    city: String
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
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedReason: {
    type: String,
    enum: ['auto_dislike', 'special_chars', 'manual'],
    default: null
  }
}, {
  timestamps: true
});

// Index for better performance
commentSchema.index({ videoId: 1, createdAt: -1 });
commentSchema.index({ user: 1 });

module.exports = mongoose.model('Comment', commentSchema);
