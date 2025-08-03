import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  Lock, 
  Globe, 
  Crown, 
  Shield, 
  UserPlus, 
  LogOut,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import InviteUserModal from '../components/Groups/InviteUserModal';
import toast from 'react-hot-toast';
import moment from 'moment';

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch group details
  const { data: groupData, isLoading } = useQuery(
    ['group', groupId],
    () => groupsAPI.getGroup(groupId),
    {
      enabled: !!groupId,
      onError: () => {
        toast.error('Failed to load group details');
        navigate('/groups');
      }
    }
  );

  // Leave group mutation
  const leaveGroupMutation = useMutation(
    () => groupsAPI.leaveGroup(groupId),
    {
      onSuccess: () => {
        toast.success('Left group successfully');
        navigate('/groups');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to leave group');
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

  const group = groupData?.data?.group;

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Group not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The group you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/groups')}
            className="btn-primary"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const isOwner = group.owner._id === user?.id;
  const isMember = group.members.some(member => member.user._id === user?.id);
  const userMember = group.members.find(member => member.user._id === user?.id);
  const canInvite = isMember && (userMember?.role === 'admin' || userMember?.role === 'moderator');

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      leaveGroupMutation.mutate();
    }
  };

  return (
    <>
      <Helmet>
        <title>{group.name} - YouTube Clone</title>
        <meta name="description" content={group.description} />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => navigate('/groups')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Group Details</h1>
          </div>

          {/* Group Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
              {/* Group Avatar */}
              <div className="flex-shrink-0 mb-6 lg:mb-0">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>

              {/* Group Details */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{group.name}</h2>
                    <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        {group.privacy === 'private' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                        <span>{group.privacy === 'private' ? 'Private' : 'Public'} Group</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{group.members.length} members</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mt-4 sm:mt-0">
                    {canInvite && (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Invite</span>
                      </button>
                    )}
                    
                    {isMember && !isOwner && (
                      <button
                        onClick={handleLeaveGroup}
                        disabled={leaveGroupMutation.isLoading}
                        className="btn-secondary text-red-600 hover:text-red-700 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Leave Group</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {group.description}
                  </p>
                )}

                {/* Category and Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {group.category}
                  </span>
                  {group.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Owner Info */}
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>Created by</span>
                  <img
                    src={group.owner.avatar || '/default-avatar.png'}
                    alt={group.owner.username}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-medium">{group.owner.channelName || group.owner.username}</span>
                  <span>•</span>
                  <span>{moment(group.createdAt).format('MMM D, YYYY')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-6">Members ({group.members.length})</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <img
                    src={member.user.avatar || '/default-avatar.png'}
                    alt={member.user.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate">
                        {member.user.channelName || member.user.username}
                      </span>
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{member.role}</span>
                      <span>•</span>
                      <span>Joined {moment(member.joinedAt).fromNow()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations (for admins/moderators) */}
          {canInvite && group.invitations?.length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-6">Pending Invitations</h3>
              
              <div className="space-y-3">
                {group.invitations
                  .filter(inv => inv.status === 'pending')
                  .map((invitation) => (
                    <div
                      key={invitation._id}
                      className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={invitation.user.avatar || '/default-avatar.png'}
                          alt={invitation.user.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <span className="font-medium">
                            {invitation.user.channelName || invitation.user.username}
                          </span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Invited by {invitation.invitedBy.username} • {moment(invitation.createdAt).fromNow()}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                        Pending
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          groupId={groupId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            queryClient.invalidateQueries(['group', groupId]);
          }}
        />
      )}
    </>
  );
};

export default GroupDetail;
