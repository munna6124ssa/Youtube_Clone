const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all groups
router.get('/', [
  query('search').optional().trim(),
  query('category').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { search, category, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true, privacy: 'public' };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const groups = await Group.find(query)
      .populate('owner', 'username avatar channelName')
      .populate('members.user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add member count and user membership status for each group
    const enhancedGroups = groups.map(group => ({
      ...group.toObject(),
      memberCount: group.members.length,
      isPublic: group.privacy === 'public'
    }));

    const totalGroups = await Group.countDocuments(query);

    res.json({
      groups: enhancedGroups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalGroups,
        pages: Math.ceil(totalGroups / limit),
        hasMore: (page * limit) < totalGroups
      }
    });
  } catch (error) {
    console.error('Get groups error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create group
router.post('/', auth, [
  body('name').isLength({ min: 1, max: 50 }).trim(),
  body('description').optional().isLength({ max: 500 }).trim(),
  body('category').notEmpty().trim(),
  body('privacy').isIn(['public', 'private'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, privacy, tags } = req.body;
    const userId = req.user._id;

    // Check if group name already exists
    const existingGroup = await Group.findOne({ name, isActive: true });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group name already exists' });
    }

    // Create group
    const group = new Group({
      name,
      description: description || '',
      category,
      privacy,
      tags: tags || [],
      owner: userId,
      members: [{
        user: userId,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    await group.save();
    await group.populate('owner', 'username avatar channelName');
    await group.populate('members.user', 'username avatar');

    // Add group to user's groups
    await User.findByIdAndUpdate(userId, {
      $push: { groups: group._id }
    });

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single group
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({ _id: groupId, isActive: true })
      .populate('owner', 'username avatar channelName')
      .populate('members.user', 'username avatar channelName')
      .populate('invitations.user', 'username avatar')
      .populate('invitations.invitedBy', 'username avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join group
router.post('/:groupId/join', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, isActive: true });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    const isMember = group.members.some(member => member.user.toString() === userId.toString());
    if (isMember) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    // For private groups, check if user has an invitation
    if (group.privacy === 'private') {
      const invitation = group.invitations.find(
        inv => inv.user.toString() === userId.toString() && inv.status === 'pending'
      );
      
      if (!invitation) {
        return res.status(403).json({ message: 'This is a private group. You need an invitation to join.' });
      }

      // Accept the invitation
      invitation.status = 'accepted';
    }

    // Add user to group
    group.members.push({
      user: userId,
      role: 'member',
      joinedAt: new Date()
    });

    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(userId, {
      $push: { groups: group._id }
    });

    res.json({
      message: 'Joined group successfully',
      group: {
        _id: group._id,
        name: group.name,
        memberCount: group.members.length
      }
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave group
router.post('/:groupId/leave', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, isActive: true });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the owner
    if (group.owner.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Owner cannot leave the group. Transfer ownership or delete the group.' });
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(member => member.user.toString() === userId.toString());
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'Not a member of this group' });
    }

    // Remove user from group
    group.members.splice(memberIndex, 1);
    await group.save();

    // Remove group from user's groups
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: group._id }
    });

    res.json({
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite user to group
router.post('/:groupId/invite', auth, [
  body('username').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId } = req.params;
    const { username } = req.body;
    const inviterId = req.user._id;

    const group = await Group.findOne({ _id: groupId, isActive: true });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if inviter is a member with appropriate permissions
    const inviterMember = group.members.find(member => member.user.toString() === inviterId.toString());
    if (!inviterMember || (inviterMember.role !== 'admin' && inviterMember.role !== 'moderator')) {
      return res.status(403).json({ message: 'You do not have permission to invite users' });
    }

    // Find user to invite
    const userToInvite = await User.findOne({ username });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const isMember = group.members.some(member => member.user.toString() === userToInvite._id.toString());
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Check if invitation already exists
    const existingInvitation = group.invitations.find(
      inv => inv.user.toString() === userToInvite._id.toString() && inv.status === 'pending'
    );
    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent' });
    }

    // Create invitation
    group.invitations.push({
      user: userToInvite._id,
      invitedBy: inviterId,
      status: 'pending'
    });

    await group.save();

    res.json({
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's groups
router.get('/user/my-groups', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    })
    .populate('owner', 'username avatar channelName')
    .populate('members.user', 'username avatar')
    .sort({ createdAt: -1 });

    // Add role and member count for each group
    const enhancedGroups = groups.map(group => {
      const userMember = group.members.find(m => m.user._id.toString() === userId.toString());
      return {
        ...group.toObject(),
        userRole: userMember?.role,
        memberCount: group.members.length,
        isPublic: group.privacy === 'public'
      };
    });

    res.json({ groups: enhancedGroups });
  } catch (error) {
    console.error('Get user groups error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group members
router.get('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({ _id: groupId, isActive: true })
      .populate('members.user', 'username avatar channelName')
      .populate('owner', 'username avatar channelName');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ 
      members: group.members,
      owner: group.owner,
      totalMembers: group.members.length
    });
  } catch (error) {
    console.error('Get group members error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending invitations for a group (admin/moderator only)
router.get('/:groupId/invitations', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, isActive: true })
      .populate('invitations.user', 'username avatar')
      .populate('invitations.invitedBy', 'username avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user has permission to view invitations
    const userMember = group.members.find(member => member.user.toString() === userId.toString());
    if (!userMember || (userMember.role !== 'admin' && userMember.role !== 'moderator')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pendingInvitations = group.invitations.filter(inv => inv.status === 'pending');

    res.json({ invitations: pendingInvitations });
  } catch (error) {
    console.error('Get group invitations error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
