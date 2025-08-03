import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, Users, Lock, Globe } from 'lucide-react';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch groups
  const { data: groupsData, isLoading } = useQuery(
    ['groups', searchQuery, category],
    () => groupsAPI.getGroups({ search: searchQuery, category }),
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

  const categories = [
    'Technology',
    'Music',
    'Gaming',
    'Education',
    'Entertainment',
    'Sports',
    'News',
    'Science',
    'Art',
    'Business'
  ];

  const handleJoinGroup = (groupId) => {
    joinGroupMutation.mutate(groupId);
  };

  return (
    <>
      <Helmet>
        <title>Groups - YouTube Clone</title>
        <meta name="description" content="Discover and join groups based on your interests" />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Groups</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover and join communities based on your interests
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 sm:mt-0 btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Group</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Your Groups */}
          {userGroups.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Your Groups</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userGroups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    showJoinButton={false}
                    isUserGroup={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Groups */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Discover Groups'}
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="large" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No groups found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search terms or browse all groups.'
                    : 'Be the first to create a group in this category!'
                  }
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Create First Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    onJoin={handleJoinGroup}
                    showJoinButton={true}
                    isJoining={joinGroupMutation.isLoading}
                  />
                ))}
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
