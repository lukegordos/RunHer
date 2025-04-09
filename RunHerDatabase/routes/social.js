const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Friend = require('../models/Friend');
const User = require('../models/User');

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.userId
    })
    .populate('participants', 'name email')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });
    
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversation: req.params.conversationId
    })
    .populate('sender', 'name')
    .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const conversationId = req.params.conversationId;
    
    const message = new Message({
      conversation: conversationId,
      sender: req.user.userId,
      content,
      readBy: [req.user.userId]
    });
    
    await message.save();
    
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
