import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { MessageCircle, ThumbsUp, ThumbsDown, Globe, MapPin, Reply } from 'lucide-react';
import { commentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';
import moment from 'moment';
import Cookies from 'js-cookie';

const CommentSection = ({ videoId, currentUser }) => {
  const [newComment, setNewComment] = useState('');
  const [translationRequests, setTranslationRequests] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showTranslateDropdown, setShowTranslateDropdown] = useState({});
  const [showInputTranslateDropdown, setShowInputTranslateDropdown] = useState(false);
  const [translatedInputText, setTranslatedInputText] = useState('');
  const [isTranslatingInput, setIsTranslatingInput] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowInputTranslateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use currentUser if provided, otherwise use auth user
  const activeUser = currentUser || user;

  // Fetch comments
  const { data: commentsData, isLoading, error } = useQuery(
    ['comments', videoId],
    () => commentsAPI.getComments(videoId),
    {
      enabled: !!videoId,
      retry: 1
    }
  );

  // Add comment mutation
  const addCommentMutation = useMutation(
    (content) => commentsAPI.addComment({ videoId, content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', videoId]);
        setNewComment('');
        toast.success('Comment added successfully!');
      },
      onError: (error) => {
        console.error('Comment error:', error);
        const message = error.response?.data?.message || 'Failed to add comment';
        toast.error(message);
      }
    }
  );

  // Like comment mutation
  const likeCommentMutation = useMutation(
    (commentId) => commentsAPI.likeComment(commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', videoId]);
      },
      onError: () => {
        toast.error('Failed to like comment');
      }
    }
  );

  // Dislike comment mutation
  const dislikeCommentMutation = useMutation(
    (commentId) => commentsAPI.dislikeComment(commentId),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['comments', videoId]);
        if (data?.data?.autoDeleted) {
          toast.success('Comment was removed due to community feedback');
        }
      },
      onError: () => {
        toast.error('Failed to dislike comment');
      }
    }
  );

  // Translate comment mutation
  const translateMutation = useMutation(
    ({ commentId, targetLanguage }) => commentsAPI.translateComment(commentId, targetLanguage),
    {
      onSuccess: (response, variables) => {
        setTranslationRequests(prev => ({
          ...prev,
          [variables.commentId]: {
            ...prev[variables.commentId],
            [variables.targetLanguage]: response.data.translatedText
          }
        }));
        toast.success('Comment translated!');
      },
      onError: () => {
        toast.error('Translation failed. Please try again.');
      }
    }
  );

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (newComment.length > 1000) {
      toast.error('Comment is too long (max 1000 characters)');
      return;
    }
    console.log('Submitting comment:', { 
      videoId, 
      content: newComment.trim(), 
      isAuthenticated, 
      user: activeUser 
    });
    addCommentMutation.mutate(newComment.trim());
  };

  const handleTranslate = (commentId, targetLanguage) => {
    translateMutation.mutate({ commentId, targetLanguage });
    setShowTranslateDropdown(prev => ({ ...prev, [commentId]: false }));
  };

  // Translate input text function
  const handleTranslateInput = async (targetLanguage) => {
    if (!newComment.trim()) {
      toast.error('Please enter some text to translate');
      return;
    }

    setIsTranslatingInput(true);
    setShowInputTranslateDropdown(false);
    
    try {
      // Get token from cookies
      const token = Cookies.get('token');
      
      const response = await fetch('http://localhost:5000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: newComment,
          targetLanguage: targetLanguage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTranslatedInputText(data.translatedText);
        setNewComment(data.translatedText); // Replace the input with translated text
        toast.success(`Translated to ${languages.find(l => l.code === targetLanguage)?.name || targetLanguage}!`);
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsTranslatingInput(false);
    }
  };

  const validateComment = (content) => {
    if (!content.trim()) return { valid: false, message: 'Comment cannot be empty' };
    if (content.length > 1000) return { valid: false, message: 'Comment is too long (max 1000 characters)' };
    if (content.length < 2) return { valid: false, message: 'Comment is too short (min 2 characters)' };
    
    // More lenient validation - only check for excessive repetitive special characters
    // Allow normal punctuation, emojis, and all Unicode characters (including Indian languages)
    const repetitivePattern = /(.)\1{4,}/g; // Same character repeated 5+ times
    const repetitiveMatches = content.match(repetitivePattern) || [];
    
    // Check for spam-like patterns (only very obvious ones)
    const spamPatterns = [
      /[!]{5,}/g,    // Multiple exclamation marks
      /[?]{5,}/g,    // Multiple question marks
      /[.]{5,}/g,    // Multiple dots
      /[@#$%^&*]{3,}/g // Multiple symbols in sequence
    ];
    
    const hasSpamPattern = spamPatterns.some(pattern => pattern.test(content));
    
    if (repetitiveMatches.length > 0 || hasSpamPattern) {
      return { valid: false, message: 'Please avoid excessive repetitive characters' };
    }
    
    return { valid: true };
  };

  const comments = commentsData?.data?.comments || [];
  const commentStats = commentsData?.data?.stats;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'bn', name: 'Bengali' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'mr', name: 'Marathi' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' }
  ];

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Failed to load comments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <MessageCircle className="w-6 h-6" />
        <h3 className="text-xl font-bold">
          {commentStats?.total || comments.length} Comments
        </h3>
      </div>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="flex space-x-3">
              <img
                src={activeUser?.avatar || '/default-avatar.svg'}
                alt={activeUser?.username}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment in any language..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
                
                {/* Translation Controls for Input */}
                <div className="flex items-center justify-between mt-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowInputTranslateDropdown(!showInputTranslateDropdown)}
                        disabled={!newComment.trim() || isTranslatingInput}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <Globe className="w-4 h-4" />
                        <span>{isTranslatingInput ? 'Translating...' : 'Translate'}</span>
                      </button>
                      
                      {showInputTranslateDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto min-w-48">
                          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 font-medium">
                            Translate to:
                          </div>
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => handleTranslateInput(lang.code)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100 transition-colors duration-150"
                            >
                              {lang.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {translatedInputText && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewComment('');
                          setTranslatedInputText('');
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-gray-500">
                    {newComment.length}/1000 characters
                    {!validateComment(newComment).valid && newComment.trim() && (
                      <span className="ml-2 text-red-500">
                        {validateComment(newComment).message}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewComment('')}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || addCommentMutation.isLoading || !validateComment(newComment).valid}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addCommentMutation.isLoading ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to leave a comment
          </p>
          <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Sign In
          </a>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <img
                  src={comment.user?.avatar || '/default-avatar.png'}
                  alt={comment.user?.username}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                
                <div className="flex-1 space-y-2">
                  {/* Comment Header */}
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {comment.user?.channelName || comment.user?.username}
                    </span>
                    <span className="text-sm text-gray-500">
                      {moment(comment.createdAt).fromNow()}
                    </span>
                    
                    {comment.locationDisplay && comment.locationDisplay !== 'Unknown, Unknown' && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-xs text-blue-700 dark:text-blue-300">
                        <MapPin className="w-3 h-3" />
                        <span>{comment.locationDisplay}</span>
                      </div>
                    )}
                  </div>

                  {/* Comment Content */}
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                    {comment.content}
                  </p>
                  
                  {/* Translation Results */}
                  {translationRequests[comment._id] && (
                    <div className="mt-3 space-y-2">
                      {Object.entries(translationRequests[comment._id]).map(([lang, text]) => (
                        <div key={lang} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-400">
                          <div className="flex items-center space-x-2 mb-1">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Translated to {languages.find(l => l.code === lang)?.name || lang}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-4">
                      {/* Like Button */}
                      <button
                        onClick={() => isAuthenticated && likeCommentMutation.mutate(comment._id)}
                        disabled={!isAuthenticated}
                        className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-50"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{comment.likeCount || comment.likes?.length || 0}</span>
                      </button>

                      {/* Dislike Button */}
                      <button
                        onClick={() => isAuthenticated && dislikeCommentMutation.mutate(comment._id)}
                        disabled={!isAuthenticated}
                        className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{comment.dislikeCount || comment.dislikes?.length || 0}</span>
                      </button>
                    </div>

                    {/* Translate Button */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowTranslateDropdown(prev => ({ 
                          ...prev, 
                          [comment._id]: !prev[comment._id] 
                        }))}
                        className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Translate</span>
                      </button>
                      
                      {showTranslateDropdown[comment._id] && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-48 overflow-y-auto">
                          <div className="p-2">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => handleTranslate(comment._id, lang.code)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* No Comments Message */}
          {comments.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
