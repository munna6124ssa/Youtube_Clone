import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { X, Search, UserPlus } from 'lucide-react';
import { groupsAPI, usersAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const InviteUserModal = ({ groupId, onClose, onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Search users
  const { data: usersData, isLoading: searchLoading } = useQuery(
    ['search-users', searchQuery],
    () => usersAPI.searchUsers(searchQuery),
    {
      enabled: searchQuery.length >= 2,
      onError: () => toast.error('Failed to search users')
    }
  );

  // Invite user mutation
  const inviteUserMutation = useMutation(
    (username) => groupsAPI.inviteUser(groupId, username),
    {
      onSuccess: () => {
        toast.success('Invitation sent successfully!');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send invitation');
      }
    }
  );

  const users = usersData?.data?.users || [];

  const handleInvite = (username) => {
    if (window.confirm(`Send invitation to ${username}?`)) {
      inviteUserMutation.mutate(username);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Invite User to Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Search Results */}
          <div className="space-y-3">
            {searchQuery.length < 2 ? (
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Start typing to search for users</p>
              </div>
            ) : searchLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                <p>No users found for "{searchQuery}"</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{user.channelName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        @{user.username} • {user.subscriberCount} subscribers
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInvite(user.username)}
                    disabled={inviteUserMutation.isLoading}
                    className="btn-primary text-sm py-2 px-3 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {inviteUserMutation.isLoading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Invite</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;
