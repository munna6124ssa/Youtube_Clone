import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Lock, Globe, MapPin, Crown, Shield, Tag, Calendar, TrendingUp } from 'lucide-react';
import moment from 'moment';

const GroupCard = ({ group, onJoin, showJoinButton, isJoining, isUserGroup, viewMode = 'grid', userRole }) => {
  const memberCount = group.memberCount || group.members?.length || 0;
  const isPrivate = group.privacy === 'private';

  // List view layout
  if (viewMode === 'list') {
    return (
      <div className="group-card-list bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all p-6">
        <div className="flex items-start space-x-6">
          {/* Group Avatar */}
          <div className="flex-shrink-0">
            {group.avatar ? (
              <img
                src={group.avatar}
                alt={group.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-bold text-xl leading-tight truncate text-gray-900 dark:text-gray-100">
                    {group.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {isPrivate ? (
                      <Lock className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-500" />
                    )}
                    {userRole && (
                      <span className="ml-2">
                        {userRole === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                        {userRole === 'moderator' && <Shield className="w-4 h-4 text-blue-500" />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {group.description}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created {moment(group.createdAt).fromNow()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span>{group.category}</span>
                  </div>
                </div>

                {/* Owner */}
                <div className="flex items-center space-x-2 mb-3">
                  <img
                    src={group.owner?.avatar || '/default-avatar.png'}
                    alt={group.owner?.username}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    by {group.owner?.channelName || group.owner?.username}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 ml-4">
                <Link
                  to={`/groups/${group._id}`}
                  className="btn-secondary px-4 py-2 text-sm whitespace-nowrap"
                >
                  View Details
                </Link>
                
                {showJoinButton && !isUserGroup && (
                  <button
                    onClick={() => onJoin(group._id)}
                    disabled={isJoining}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {isJoining ? 'Joining...' : 'Join Group'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view layout (default)
  return (
    <div className="group-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-youtube-red/20 transition-all duration-300 transform hover:-translate-y-1 p-6 h-full flex flex-col">
      {/* Group Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {group.avatar ? (
            <img
              src={group.avatar}
              alt={group.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate text-gray-900 dark:text-gray-100">
              {group.name}
            </h3>
            <div className="flex items-center space-x-1 mt-1">
              {isPrivate ? (
                <Lock className="w-3 h-3 text-gray-500" />
              ) : (
                <Globe className="w-3 h-3 text-green-500" />
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isPrivate ? 'Private' : 'Public'}
              </span>
              {userRole && (
                <span className="ml-1">
                  {userRole === 'admin' && <Crown className="w-3 h-3 text-yellow-500" title="Admin" />}
                  {userRole === 'moderator' && <Shield className="w-3 h-3 text-blue-500" title="Moderator" />}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex-1 mb-4">
        {group.description ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
            {group.description}
          </p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm italic">
            No description available
          </p>
        )}
      </div>

      {/* Category Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-800 dark:text-blue-200 rounded-full">
          <Tag className="w-3 h-3 mr-1" />
          {group.category}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span className="font-medium">{memberCount}</span>
          <span>{memberCount === 1 ? 'member' : 'members'}</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-500">
          <Calendar className="w-3 h-3" />
          <span className="text-xs">{moment(group.createdAt).fromNow()}</span>
        </div>
      </div>

      {/* Owner */}
      <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <img
          src={group.owner?.avatar || '/default-avatar.png'}
          alt={group.owner?.username}
          className="w-6 h-6 rounded-full"
          onError={(e) => {
            e.target.src = '/default-avatar.png';
          }}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
          by <span className="font-medium">{group.owner?.channelName || group.owner?.username}</span>
        </span>
      </div>

      {/* Tags */}
      {group.tags && group.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {group.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
            >
              #{tag}
            </span>
          ))}
          {group.tags.length > 2 && (
            <span className="text-xs text-gray-500 dark:text-gray-500 px-1 py-1">
              +{group.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2 mt-auto">
        <Link
          to={`/groups/${group._id}`}
          className="flex-1 btn-secondary text-center text-sm py-2.5 font-medium"
        >
          View Details
        </Link>
        
        {showJoinButton && !isUserGroup && (
          <button
            onClick={() => onJoin(group._id)}
            disabled={isJoining}
            className="flex-1 btn-primary text-sm py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform hover:scale-105"
          >
            {isJoining ? (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Joining...</span>
              </div>
            ) : (
              'Join Group'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
