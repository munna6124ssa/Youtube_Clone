const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -email -phone')
      .populate('subscribers', 'username channelName avatar')
      .populate('subscriptions', 'username channelName avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        channelName: user.channelName,
        avatar: user.avatar,
        subscriberCount: user.subscribers.length,
        subscriptionCount: user.subscriptions.length,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Subscribe/Unsubscribe to channel
router.post('/:userId/subscribe', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    }

    const userToSubscribe = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToSubscribe) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSubscribed = currentUser.subscriptions.includes(userId);

    if (isSubscribed) {
      // Unsubscribe
      currentUser.subscriptions = currentUser.subscriptions.filter(
        sub => sub.toString() !== userId
      );
      userToSubscribe.subscribers = userToSubscribe.subscribers.filter(
        sub => sub.toString() !== currentUserId.toString()
      );
    } else {
      // Subscribe
      currentUser.subscriptions.push(userId);
      userToSubscribe.subscribers.push(currentUserId);
    }

    await currentUser.save();
    await userToSubscribe.save();

    res.json({
      subscribed: !isSubscribed,
      subscriberCount: userToSubscribe.subscribers.length
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { channelName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username channelName avatar subscribers')
    .limit(20);

    const results = users.map(user => ({
      id: user._id,
      username: user.username,
      channelName: user.channelName,
      avatar: user.avatar,
      subscriberCount: user.subscribers.length
    }));

    res.json({ users: results });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
