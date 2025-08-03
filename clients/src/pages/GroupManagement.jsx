import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  Settings, 
  UserPlus, 
  Crown, 
  Shield, 
  MoreHorizontal,
  Copy,
  Link2,
  Calendar,
  MapPin,
  Edit2,
  Trash2
} from 'lucide-react';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import moment from 'moment';

const GroupManagement = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('members');
  const [showMemberActions, setShowMemberActions] = useState({});

  // Fetch group details
  const { data: groupData, isLoading: groupLoading } = useQuery(
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

  // Fetch group members
  const { data: membersData, isLoading: membersLoading } = useQuery(
    ['group-members', groupId],
    () => groupsAPI.getGroupMembers(groupId),
    {
      enabled: !!groupId
    }
  );

  // Fetch pending invitations (if user has permission)
  const { data: invitationsData } = useQuery(
    ['group-invitations', groupId],
    () => groupsAPI.getGroupInvitations(groupId),
    {
      enabled: !!groupId,
      retry: false
    }
  );

  const group = groupData?.data?.group;
  const members = membersData?.data?.members || [];
  const invitations = invitationsData?.data?.invitations || [];

  const isOwner = group?.owner?._id === user?.id;
  const userMember = members.find(m => m.user._id === user?.id);
  const isAdmin = userMember?.role === 'admin' || isOwner;
  const isModerator = userMember?.role === 'moderator';
  const canManage = isOwner || isAdmin || isModerator;

  // Copy invite link
  const copyInviteLink = async () => {
    const link = `${window.location.origin}/groups/${groupId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const toggleMemberActions = (memberId) => {
    setShowMemberActions(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

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

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      member: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role] || colors.member}`}>
        {role?.charAt(0).toUpperCase() + role?.slice(1)}
      </span>
    );
  };

  if (groupLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Group not found</h2>
          <button onClick={() => navigate('/groups')} className="btn-primary">
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{group.name} - Management - YouTube Clone</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
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
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {group.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {group.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{members.length} members</span>
                    <span>•</span>
                    <span>{group.category}</span>
                    <span>•</span>
                    <span>Created {moment(group.createdAt).fromNow()}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={copyInviteLink}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                {canManage && (
                  <button className="btn-primary flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'members'
                    ? 'border-youtube-red text-youtube-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Members ({members.length})
              </button>
              {canManage && (
                <button
                  onClick={() => setActiveTab('invitations')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'invitations'
                      ? 'border-youtube-red text-youtube-red'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Pending Invitations ({invitations.length})
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'members' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Group Members</h2>
                    {canManage && (
                      <button className="btn-primary flex items-center space-x-2">
                        <UserPlus className="w-4 h-4" />
                        <span>Invite Members</span>
                      </button>
                    )}
                  </div>

                  {membersLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div
                          key={member.user._id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={member.user.avatar || '/default-avatar.png'}
                              alt={member.user.username}
                              className="w-10 h-10 rounded-full"
                              onError={(e) => {
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                {member.user.channelName || member.user.username}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                @{member.user.username}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(member.role)}
                              {getRoleBadge(member.role)}
                            </div>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Joined {moment(member.joinedAt).fromNow()}
                            </div>

                            {canManage && member.user._id !== user?.id && (
                              <div className="relative">
                                <button
                                  onClick={() => toggleMemberActions(member.user._id)}
                                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {showMemberActions[member.user._id] && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                                    {member.role !== 'admin' && isOwner && (
                                      <button className="flex items-center space-x-2 w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <Crown className="w-4 h-4" />
                                        <span>Make Admin</span>
                                      </button>
                                    )}
                                    {member.role !== 'moderator' && (isOwner || isAdmin) && (
                                      <button className="flex items-center space-x-2 w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <Shield className="w-4 h-4" />
                                        <span>Make Moderator</span>
                                      </button>
                                    )}
                                    <button className="flex items-center space-x-2 w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400">
                                      <Trash2 className="w-4 h-4" />
                                      <span>Remove Member</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'invitations' && canManage && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Pending Invitations</h2>
                  </div>

                  {invitations.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        All invitations have been responded to.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation._id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={invitation.user.avatar || '/default-avatar.png'}
                              alt={invitation.user.username}
                              className="w-10 h-10 rounded-full"
                              onError={(e) => {
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                {invitation.user.username}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Invited by {invitation.invitedBy.username} • {moment(invitation.createdAt).fromNow()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                              Pending
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupManagement;
