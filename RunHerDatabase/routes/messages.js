const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Get all conversations for a user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userData.userId
    })
    .populate('lastMessage')
    .populate('participants', 'name avatar')
    .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Error getting conversations' });
  }
});

// Get a single conversation
router.get('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.userData.userId
    })
    .populate('participants', 'name avatar')
    .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ message: 'Error getting conversation' });
  }
});

// Test route to create a conversation with test messages
router.post('/test-conversation', auth, async (req, res) => {
  try {
    // Create a test user if it doesn't exist
    let testUser = await User.findOne({ email: 'testuser@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      });
    }

    // Create or find conversation between current user and test user
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userData.userId, testUser._id] },
      isGroupChat: false
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userData.userId, testUser._id],
        isGroupChat: false,
        lastMessageAt: new Date()
      });
    }

    // Create some test messages
    const messages = [
      { sender: testUser._id, content: 'Hey! Would you like to go for a run?' },
      { sender: req.userData.userId, content: 'Sure! When and where?' },
      { sender: testUser._id, content: 'How about tomorrow morning at 7am?' },
      { sender: testUser._id, content: 'We could meet at Central Park' },
      { sender: req.userData.userId, content: 'Sounds good! See you there!' }
    ];

    for (const msg of messages) {
      await Message.create({
        conversation: conversation._id,
        sender: msg.sender,
        content: msg.content,
        readBy: [msg.sender],
        createdAt: new Date()
      });
    }

    // Update conversation with last message
    const lastMessage = await Message.findOne({ conversation: conversation._id })
      .sort({ createdAt: -1 });
    
    conversation.lastMessage = lastMessage._id;
    conversation.lastMessageAt = lastMessage.createdAt;
    await conversation.save();

    res.json({ message: 'Test conversation created successfully', conversationId: conversation._id });
  } catch (error) {
    console.error('Error creating test conversation:', error);
    res.status(500).json({ message: 'Error creating test conversation' });
    return;
  }
});

// Create a new conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participants, isGroupChat, groupName } = req.body;

    // Ensure current user is included in participants
    if (!participants.includes(req.userData.userId)) {
      participants.push(req.userData.userId);
    }

    // Check if all participants exist
    const users = await User.find({ _id: { $in: participants } });
    if (users.length !== participants.length) {
      return res.status(400).json({ message: 'One or more users not found' });
    }

    // For non-group chats, check if conversation already exists
    if (!isGroupChat && participants.length === 2) {
      const existingConversation = await Conversation.findOne({
        participants: { $all: participants },
        isGroupChat: false
      });

      if (existingConversation) {
        return res.json(existingConversation);
      }
    }

    const conversation = new Conversation({
      participants,
      isGroupChat,
      groupName: isGroupChat ? groupName : undefined
    });

    await conversation.save();
    
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar');

    res.status(201).json(populatedConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    
    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.userData.userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const query = { conversation: req.params.conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'name avatar');

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Error getting messages' });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.userData.userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = new Message({
      conversation: req.params.conversationId,
      sender: req.userData.userId,
      content,
      readBy: [req.userData.userId]
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Mark message as read
router.post('/conversations/:conversationId/messages/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      {
        _id: req.params.messageId,
        conversation: req.params.conversationId,
        readBy: { $ne: req.userData.userId }
      },
      {
        $addToSet: { readBy: req.userData.userId }
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found or already read' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Error marking message as read' });
  }
});

// Add participant to group
router.post('/conversations/:conversationId/participants', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.userData.userId,
      isGroupChat: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is already in the group' });
    }

    conversation.participants.push(userId);
    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar')
      .populate('lastMessage');

    res.json(populatedConversation);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Error adding participant' });
  }
});

// Remove participant from group
router.delete('/conversations/:conversationId/participants/:userId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.userData.userId,
      isGroupChat: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    const index = conversation.participants.indexOf(req.params.userId);
    if (index === -1) {
      return res.status(400).json({ message: 'User is not in the group' });
    }

    conversation.participants.splice(index, 1);
    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar')
      .populate('lastMessage');

    res.json(populatedConversation);
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Error removing participant' });
  }
});

// Update group name
router.put('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const { groupName } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.conversationId,
        participants: req.userData.userId,
        isGroupChat: true
      },
      { groupName },
      { new: true }
    )
    .populate('participants', 'name avatar')
    .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error updating group name:', error);
    res.status(500).json({ message: 'Error updating group name' });
  }
});

module.exports = router;
