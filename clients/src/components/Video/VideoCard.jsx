import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, User } from 'lucide-react';
import moment from 'moment';

const VideoCard = ({ video, className = '' }) => {
  const formatDuration = (duration) => {
    // Handle YouTube duration format (PT4M13S)
    if (duration?.startsWith('PT')) {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return duration || '0:00';
  };

  const formatViewCount = (count) => {
    if (!count) return '0 views';
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  };

  const timeAgo = moment(video.publishedAt).fromNow();

  return (
    <div className={`video-card ${className}`}>
      <Link to={`/watch/${video.videoId}`}>
        {/* Thumbnail */}
        <div className="relative">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>

        {/* Video Info */}
        <div className="p-3">
          <div className="flex space-x-3">
            {/* Channel Avatar */}
            <div className="flex-shrink-0">
              {video.channel?.thumbnail ? (
                <img
                  src={video.channel.thumbnail}
                  alt={video.channel.title}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Video Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-5 mb-1 line-clamp-2">
                {video.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                {video.channel?.title || 'Unknown Channel'}
              </p>
              
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatViewCount(video.viewCount)}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoCard;
