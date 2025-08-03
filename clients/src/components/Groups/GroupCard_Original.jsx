import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Lock, Globe, MapPin } from 'lucide-react';
import moment from 'moment';

const GroupCard = ({ group, onJoin, showJoinButton, isJoining, isUserGroup }) => {
  const memberCount = group.members?.length || 0;
  const isPrivate = group.privacy === 'private';

  return (
    <div className="group-card">
      {/* Group Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {group.avatar ? (
            <img
              src={group.avatar}
              alt={group.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate">
              {group.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              {isPrivate ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              <span>{isPrivate ? 'Private' : 'Public'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {group.description}
        </p>
      )}

      {/* Category */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {group.category}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
        </div>
        <span>Created {moment(group.createdAt).fromNow()}</span>
      </div>

      {/* Owner */}
      <div className="flex items-center space-x-2 mb-4">
        <img
          src={group.owner?.avatar || '/default-avatar.png'}
          alt={group.owner?.username}
          className="w-6 h-6 rounded-full"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          by {group.owner?.channelName || group.owner?.username}
        </span>
      </div>

      {/* Tags */}
      {group.tags && group.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {group.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
            >
              #{tag}
            </span>
          ))}
          {group.tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              +{group.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <Link
          to={`/groups/${group._id}`}
          className="flex-1 btn-secondary text-center text-sm py-2"
        >
          View Details
        </Link>
        
        {showJoinButton && !isUserGroup && (
          <button
            onClick={() => onJoin(group._id)}
            disabled={isJoining}
            className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
          >
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
