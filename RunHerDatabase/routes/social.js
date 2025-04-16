const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Friend = require('../models/Friend');
const User = require('../models/User');

// Search for users
router.get('/users/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search for users by name or email, excluding the current user
    const users = await User.find({
      $and: [
        { _id: { $ne: req.userData.userId } }, // Exclude current user
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email') // Only return safe fields
    .limit(20); // Limit results for performance

    res.json(users);
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
router.get('/users/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email'); // Only return safe fields

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    console.log('Getting conversations for user:', req.userData.userId);
    const conversations = await Conversation.find({
      participants: req.userData.userId
    })
    .populate('participants', 'name email')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });
    
    console.log(`Found ${conversations.length} conversations`);
    res.json(conversations);
  } catch (err) {
    console.error('Error getting conversations:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    console.log('Getting messages for conversation:', req.params.conversationId);
    
    // First verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.userData.userId
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId
    })
    .populate('sender', 'name')
    .sort({ createdAt: 1 });
    
    console.log(`Found ${messages.length} messages`);
    res.json(messages);
  } catch (err) {
    console.error('Error getting messages:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const conversationId = req.params.conversationId;
    
    console.log('Sending message:', {
      conversation: conversationId,
      sender: req.userData.userId,
      content: content
    });

    // First verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.userData.userId
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }
    
    const message = new Message({
      conversation: conversationId,
      sender: req.userData.userId,
      content,
      readBy: [req.userData.userId]
    });
    
    await message.save();
    console.log('Message saved:', message);
    
    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt
    });
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start a new conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantIds, isGroup, groupName } = req.body;
    
    // Add current user to participants
    const allParticipants = [...new Set([...participantIds, req.user.userId])];
    
    const conversation = new Conversation({
      participants: allParticipants,
      isGroupChat: isGroup || false,
      groupName: groupName
    });
    
    await conversation.save();
    
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send friend request
router.post('/friends/request/:userId', auth, async (req, res) => {
  try {
    const friend = new Friend({
      requester: req.user.userId,
      recipient: req.params.userId
    });
    
    await friend.save();
    res.json(friend);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept/reject friend request
router.put('/friends/:friendId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const friend = await Friend.findByIdAndUpdate(
      req.params.friendId,
      { status },
      { new: true }
    );
    
    res.json(friend);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get friend requests
router.get('/friends/requests', auth, async (req, res) => {
  try {
    const requests = await Friend.find({
      recipient: req.user.userId,
      status: 'pending'
    }).populate('requester', 'name email');
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get friends list
router.get('/friends', auth, async (req, res) => {
  try {
    const friends = await Friend.find({
      $or: [
        { requester: req.user.userId },
        { recipient: req.user.userId }
      ],
      status: 'accepted'
    })
    .populate('requester recipient', 'name email');
    
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
