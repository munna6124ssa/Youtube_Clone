import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { User, Users, Calendar, MapPin } from 'lucide-react';
import { usersAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import moment from 'moment';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userId } = useParams();

  const { data: userData, isLoading } = useQuery(
    ['user-profile', userId],
    () => usersAPI.getUser(userId),
    {
      enabled: !!userId,
      onError: (error) => {
        toast.error('Failed to load user profile. Please try again.');
        console.error('Profile loading error:', error);
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const user = userData?.data?.user;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-gray-600 dark:text-gray-400">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{user.channelName} - YouTube Clone</title>
        <meta name="description" content={`${user.channelName}'s channel on YouTube Clone`} />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
              {/* Avatar */}
              <div className="flex-shrink-0 mb-6 lg:mb-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.channelName}
                    className="w-32 h-32 rounded-full object-cover mx-auto lg:mx-0"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-400 rounded-full flex items-center justify-center mx-auto lg:mx-0">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl font-bold mb-2">{user.channelName}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">@{user.username}</p>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{user.subscriberCount} subscribers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {moment(user.createdAt).format('MMM YYYY')}</span>
                  </div>
                </div>
              </div>

              {/* Subscribe Button */}
              <div className="mt-6 lg:mt-0">
                <button className="btn-primary w-full lg:w-auto">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-youtube-red mb-2">
                {user.subscriberCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Subscribers</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {user.subscriptionCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Subscriptions</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                0
              </div>
              <div className="text-gray-600 dark:text-gray-400">Videos</div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button className="py-4 px-1 border-b-2 border-youtube-red font-medium text-sm text-youtube-red">
                  Videos
                </button>
                <button className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  Playlists
                </button>
                <button className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  About
                </button>
              </nav>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No videos yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This channel hasn't uploaded any videos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
