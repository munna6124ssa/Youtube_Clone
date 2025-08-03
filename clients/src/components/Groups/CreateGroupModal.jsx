import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X, Users, Lock, Globe } from 'lucide-react';
import { groupsAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public',
    tags: ''
  });

  const createGroupMutation = useMutation(
    (data) => groupsAPI.createGroup(data),
    {
      onSuccess: () => {
        toast.success('Group created successfully!');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create group');
      }
    }
  );

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    createGroupMutation.mutate({
      ...formData,
      tags
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Create New Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Group Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter group name"
              className="input-field"
              required
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this group is about..."
              className="input-field"
              rows={3}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.description.length}/500
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Privacy
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  checked={formData.privacy === 'public'}
                  onChange={handleChange}
                  className="text-youtube-red focus:ring-youtube-red"
                />
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Anyone can find and join this group
                    </div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={formData.privacy === 'private'}
                  onChange={handleChange}
                  className="text-youtube-red focus:ring-youtube-red"
                />
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Only invited members can join
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Enter tags separated by commas (e.g., react, javascript, web)"
              className="input-field"
            />
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add relevant tags to help people discover your group
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createGroupMutation.isLoading || !formData.name || !formData.category}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {createGroupMutation.isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="small" />
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
