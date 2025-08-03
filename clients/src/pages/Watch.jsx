import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import ReactPlayer from 'react-player/youtube';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  MoreHorizontal, 
  User,
  MessageCircle,
  Send,
  Globe,
  MapPin
} from 'lucide-react';
import { videosAPI, commentsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import VideoCard from '../components/Video/VideoCard';
import CommentSection from '../components/Comments/CommentSection';
import toast from 'react-hot-toast';
import moment from 'moment';

const Watch = () => {
  const { videoId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [relatedVideos, setRelatedVideos] = useState([]);

  // Fetch video details
  const { data: videoData, isLoading: videoLoading } = useQuery(
    ['video', videoId],
    () => videosAPI.getVideo(videoId),
    {
      enabled: !!videoId,
      onError: () => toast.error('Failed to load video')
    }
  );

  // Fetch related videos
  const { data: relatedData } = useQuery(
    ['related-videos'],
    () => videosAPI.getVideos({ limit: 10 }),
    {
      onSuccess: (response) => {
        setRelatedVideos(response.data.videos.filter(v => v.videoId !== videoId));
      }
    }
  );

  // Like video mutation
  const likeMutation = useMutation(
    () => videosAPI.likeVideo(videoId),
    {
      onSuccess: (response) => {
        queryClient.setQueryData(['video', videoId], (oldData) => ({
          ...oldData,
          data: {
            ...oldData.data,
            video: {
              ...oldData.data.video,
              likeCount: response.data.likeCount,
              dislikeCount: response.data.dislikeCount
            }
          }
        }));
        toast.success(response.data.liked ? 'Liked!' : 'Like removed');
      },
      onError: () => toast.error('Failed to like video')
    }
  );

  // Dislike video mutation
  const dislikeMutation = useMutation(
    () => videosAPI.dislikeVideo(videoId),
    {
      onSuccess: (response) => {
        queryClient.setQueryData(['video', videoId], (oldData) => ({
          ...oldData,
          data: {
            ...oldData.data,
            video: {
              ...oldData.data.video,
              likeCount: response.data.likeCount,
              dislikeCount: response.data.dislikeCount
            }
          }
        }));
        toast.success(response.data.disliked ? 'Disliked!' : 'Dislike removed');
      },
      onError: () => toast.error('Failed to dislike video')
    }
  );

  // Subscribe mutation
  const subscribeMutation = useMutation(
    () => usersAPI.subscribe(video?.channel?.id),
    {
      onSuccess: (response) => {
        toast.success(response.data.subscribed ? 'Subscribed!' : 'Unsubscribed!');
      },
      onError: () => toast.error('Failed to subscribe')
    }
  );

  if (videoLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const video = videoData?.data?.video;

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-2">Video not found</h2>
        <p className="text-gray-600 dark:text-gray-400">The video you're looking for doesn't exist.</p>
        <Link to="/" className="mt-4 btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  const formatCount = (count) => {
    if (!count) return '0';
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <>
      <Helmet>
        <title>{video.title} - YouTube Clone</title>
        <meta name="description" content={video.description?.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Video Section */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              <div className="video-player-wrapper mb-4">
                <ReactPlayer
                  url={videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  playing={false}
                  config={{
                    youtube: {
                      playerVars: {
                        showinfo: 1,
                        origin: window.location.origin
                      }
                    }
                  }}
                />
              </div>

              {/* Video Info */}
              <div className="space-y-4">
                <h1 className="text-xl lg:text-2xl font-bold leading-tight">
                  {video.title}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                    <span>{formatCount(video.viewCount)} views</span>
                    <span>•</span>
                    <span>{moment(video.publishedAt).format('MMM D, YYYY')}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Like/Dislike */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full">
                      <button
                        onClick={() => isAuthenticated && likeMutation.mutate()}
                        disabled={!isAuthenticated || likeMutation.isLoading}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-full transition-colors"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <span>{formatCount(video.likeCount)}</span>
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                      <button
                        onClick={() => isAuthenticated && dislikeMutation.mutate()}
                        disabled={!isAuthenticated || dislikeMutation.isLoading}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-full transition-colors"
                      >
                        <ThumbsDown className="w-5 h-5" />
                        <span>{formatCount(video.dislikeCount)}</span>
                      </button>
                    </div>

                    {/* Share */}
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>

                    {/* More */}
                    <button className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Channel Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {video.channel?.thumbnail ? (
                      <img
                        src={video.channel.thumbnail}
                        alt={video.channel.title}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{video.channel?.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCount(video.channel?.subscriberCount)} subscribers
                      </p>
                    </div>
                  </div>

                  {isAuthenticated && (
                    <button
                      onClick={() => subscribeMutation.mutate()}
                      disabled={subscribeMutation.isLoading}
                      className="btn-primary disabled:opacity-50"
                    >
                      Subscribe
                    </button>
                  )}
                </div>

                {/* Description */}
                {video.description && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                )}

                {/* Comments Section */}
                <CommentSection videoId={videoId} currentUser={user} />
              </div>
            </div>

            {/* Related Videos Sidebar */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Related Videos</h3>
              <div className="space-y-3">
                {relatedVideos.map((relatedVideo) => (
                  <div key={relatedVideo.videoId} className="flex space-x-3">
                    <Link 
                      to={`/watch/${relatedVideo.videoId}`}
                      className="flex-shrink-0"
                    >
                      <img
                        src={relatedVideo.thumbnail}
                        alt={relatedVideo.title}
                        className="w-40 aspect-video object-cover rounded-lg"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/watch/${relatedVideo.videoId}`}>
                        <h4 className="font-medium text-sm leading-5 mb-1 line-clamp-2 hover:text-youtube-red">
                          {relatedVideo.title}
                        </h4>
                      </Link>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                        {relatedVideo.channel?.title}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        {formatCount(relatedVideo.viewCount)} views • {moment(relatedVideo.publishedAt).fromNow()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Watch;
