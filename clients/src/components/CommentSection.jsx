import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Languages, 
  MapPin,
  Trash2,
  Flag,
  MoreHorizontal 
} from 'lucide-react';

const CommentSection = ({ videoId, currentUser }) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [translatingComment, setTranslatingComment] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  const queryClient = useQueryClient();

  // Fetch comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      const response = await fetch(`/api/comments/${videoId}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    onError: (error) => {
      // Handle errors silently for comments - not critical for app functionality
      console.log('Comments fetch error (handled silently):', error.message);
    }
  });

  // Fetch supported languages
  const { data: languagesData } = useQuery({
    queryKey: ['translation-languages'],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/comments/translate/languages`);
      if (!response.ok) throw new Error('Failed to fetch languages');
      return response.json();
    },
    onError: (error) => {
      // Handle language fetch errors silently
      console.log('Languages fetch error (handled silently):', error.message);
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      const response = await fetch(`/api/comments/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to add comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', videoId]);
      setNewComment('');
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add comment');
    }
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to like comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', videoId]);
    }
  });

  // Dislike comment mutation
  const dislikeCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`/api/comments/${commentId}/dislike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to dislike comment');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['comments', videoId]);
      if (data.autoDeleted) {
        toast.success('Comment was automatically removed due to excessive dislikes');
      }
    }
  });

  // Translate comment mutation
  const translateCommentMutation = useMutation({
    mutationFn: async ({ commentId, targetLanguage }) => {
      const response = await fetch(`/api/comments/${commentId}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetLanguage })
      });
      if (!response.ok) throw new Error('Failed to translate comment');
      return response.json();
    },
    onSuccess: (data, variables) => {
      setTranslatingComment({
        commentId: variables.commentId,
        translatedText: data.translatedText,
        targetLanguage: data.targetLanguage,
        sourceLanguage: data.sourceLanguage
      });
      toast.success('Comment translated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Translation failed');
    }
  });

  // Add reply mutation
  const addReplyMutation = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await fetch(`/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to add reply');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', videoId]);
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply added successfully!');
    }
  });

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }
    addCommentMutation.mutate(newComment.trim());
  };

  const handleLikeComment = (commentId) => {
    if (!currentUser) {
      toast.error('Please login to like comments');
      return;
    }
    likeCommentMutation.mutate(commentId);
  };

  const handleDislikeComment = (commentId) => {
    if (!currentUser) {
      toast.error('Please login to dislike comments');
      return;
    }
    dislikeCommentMutation.mutate(commentId);
  };

  const handleTranslateComment = (commentId) => {
    translateCommentMutation.mutate({ commentId, targetLanguage: selectedLanguage });
  };

  const handleAddReply = (commentId) => {
    if (!replyText.trim()) return;
    if (!currentUser) {
      toast.error('Please login to reply');
      return;
    }
    addReplyMutation.mutate({ commentId, content: replyText.trim() });
  };

  const getCommentText = (comment) => {
    if (translatingComment && translatingComment.commentId === comment._id) {
      return translatingComment.translatedText;
    }
    return comment.content;
  };

  const isCommentTranslated = (comment) => {
    return translatingComment && translatingComment.commentId === comment._id;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const comments = commentsData?.comments || [];
  const totalComments = commentsData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Comment count */}
      <div className="flex items-center space-x-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {totalComments} Comments
        </h3>
        
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageOptions(!showLanguageOptions)}
            className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Languages className="w-4 h-4" />
            <span className="text-sm">Translate</span>
          </button>
          
          {showLanguageOptions && languagesData?.languages && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {languagesData.languages.slice(0, 20).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    setShowLanguageOptions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add comment form */}
      {currentUser && (
        <form onSubmit={handleAddComment} className="space-y-4">
          <div className="flex space-x-3">
            <img
              src={currentUser.avatar || '/default-avatar.png'}
              alt={currentUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewComment('')}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addCommentMutation.isPending ? 'Adding...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <img
                src={comment.user?.avatar || '/default-avatar.png'}
                alt={comment.user?.username}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                {/* Comment header */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {comment.user?.channelName || comment.user?.username}
                  </span>
                  
                  {comment.location?.city && comment.location?.city !== 'Unknown' && (
                    <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-sm">
                      <MapPin className="w-3 h-3" />
                      <span>{comment.location.city}, {comment.location.state}</span>
                    </div>
                  )}
                  
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  
                  {isCommentTranslated(comment) && (
                    <span className="text-blue-500 text-sm flex items-center space-x-1">
                      <Languages className="w-3 h-3" />
                      <span>Translated from {translatingComment.sourceLanguage}</span>
                    </span>
                  )}
                </div>

                {/* Comment content */}
                <p className="text-gray-900 dark:text-white mb-3 break-words">
                  {getCommentText(comment)}
                </p>

                {/* Comment actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLikeComment(comment._id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                      comment.isLikedByUser
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{comment.likes?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => handleDislikeComment(comment._id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                      comment.isDislikedByUser
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/20'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm">{comment.dislikes?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => handleTranslateComment(comment._id)}
                    disabled={translateCommentMutation.isPending}
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                  >
                    <Languages className="w-4 h-4" />
                    <span className="text-sm">
                      {translateCommentMutation.isPending ? 'Translating...' : 'Translate'}
                    </span>
                  </button>

                  <button
                    onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Reply</span>
                  </button>
                </div>

                {/* Reply form */}
                {replyingTo === comment._id && currentUser && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-3">
                      <img
                        src={currentUser.avatar || '/default-avatar.png'}
                        alt={currentUser.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Add a reply..."
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows="2"
                        />
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddReply(comment._id)}
                            disabled={!replyText.trim() || addReplyMutation.isPending}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {addReplyMutation.isPending ? 'Replying...' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex space-x-3">
                        <img
                          src={reply.user?.avatar || '/default-avatar.png'}
                          alt={reply.user?.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {reply.user?.channelName || reply.user?.username}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-900 dark:text-white text-sm break-words">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
