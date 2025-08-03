import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, Users, Filter, Grid, List, Star, TrendingUp } from 'lucide-react';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import CreateGroupModal from '../components/Groups/CreateGroupModal';
import GroupCard from '../components/Groups/GroupCard';
import toast from 'react-hot-toast';

const Groups = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('newest'); // newest, members, activity
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch groups with debounced search
  const { data: groupsData, isLoading } = useQuery(
    ['groups', debouncedSearch, category, sortBy],
    () => groupsAPI.getGroups({ search: debouncedSearch, category, sortBy }),
    {
      onError: () => toast.error('Failed to load groups')
    }
  );

  // Fetch user's groups
  const { data: userGroupsData } = useQuery(
    ['user-groups'],
    () => groupsAPI.getUserGroups(),
    {
      onError: () => toast.error('Failed to load your groups')
    }
  );

  // Join group mutation
  const joinGroupMutation = useMutation(
    (groupId) => groupsAPI.joinGroup(groupId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups']);
        queryClient.invalidateQueries(['user-groups']);
        toast.success('Joined group successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to join group');
      }
    }
  );

  const groups = groupsData?.data?.groups || [];
  const userGroups = userGroupsData?.data?.groups || [];
  const pagination = groupsData?.data?.pagination;

  const categories = [
    'Technology',
    'Music',
    'Gaming',
    'Education',
    'Entertainment',
    'Sports',
    'Science',
    'Art & Design',
    'Lifestyle',
    'Business',
    'Health & Fitness',
    'Travel',
    'Food & Cooking',
    'Fashion',
    'News & Politics',
    'Comedy',
    'Movies & TV',
    'Anime & Manga',
    'Books & Literature',
    'Photography',
    'Nature',
    'Other'
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest', icon: TrendingUp },
    { value: 'members', label: 'Most Members', icon: Users },
    { value: 'popular', label: 'Most Popular', icon: Star }
  ];

  const handleJoinGroup = (groupId) => {
    joinGroupMutation.mutate(groupId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setSortBy('newest');
  };

  return (
    <>
      <Helmet>
        <title>Groups - YouTube Clone</title>
        <meta name="description" content="Join communities and connect with like-minded creators and viewers" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-youtube-red to-red-600 bg-clip-text text-transparent">
                  Discover Groups
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Connect with communities that share your passions
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{groups.length} groups available</span>
                  {userGroups.length > 0 && <span>•</span>}
                  {userGroups.length > 0 && <span>Member of {userGroups.length}</span>}
                </div>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center space-x-2 px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Create Group</span>
              </button>
            </div>
          </div>

          {/* Advanced Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="space-y-4">
              {/* Main Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search groups by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-youtube-red focus:border-transparent bg-white dark:bg-gray-700 transition-all"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Category Filter */}
                <div className="flex-1">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full input-field"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div className="flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full input-field"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle & Clear Filters */}
                <div className="flex items-center space-x-2">
                  <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-youtube-red text-white'
                          : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                      title="Grid view"
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-youtube-red text-white'
                          : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                      title="List view"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {(searchQuery || category) && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Your Groups Section */}
          {userGroups.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                <h2 className="text-2xl font-bold mb-4 flex items-center text-blue-900 dark:text-blue-100">
                  <Users className="w-6 h-6 mr-2" />
                  Your Groups ({userGroups.length})
                </h2>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" 
                  : "space-y-4"
                }>
                  {userGroups.map((group) => (
                    <GroupCard
                      key={group._id}
                      group={group}
                      showJoinButton={false}
                      isUserGroup={true}
                      viewMode={viewMode}
                      userRole={group.userRole}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Groups Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                {searchQuery || category ? (
                  <>
                    <Filter className="w-6 h-6 mr-2" />
                    Search Results ({pagination?.total || groups.length})
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-6 h-6 mr-2" />
                    All Groups ({pagination?.total || groups.length})
                  </>
                )}
              </h2>

              {/* Results Info */}
              {pagination && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.pages}
                </span>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="large" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">No groups found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {searchQuery || category
                    ? 'Try adjusting your search terms or explore different categories.'
                    : 'Be the pioneer and create the first group in this category!'
                  }
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary px-8 py-3 text-lg font-medium"
                >
                  Create First Group
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" 
                : "space-y-4"
              }>
                {groups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    onJoin={handleJoinGroup}
                    showJoinButton={true}
                    isJoining={joinGroupMutation.isLoading}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['groups']);
            queryClient.invalidateQueries(['user-groups']);
          }}
        />
      )}
    </>
  );
};

export default Groups;
