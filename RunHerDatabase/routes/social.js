const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Find running buddies with similar stats
router.get('/users/search', auth, async (req, res) => {
  try {
    console.log('Search request received:', {
      query: req.query,
      userId: req.userData?.userId,
      headers: req.headers
    });

    // Get the current user's stats
    const currentUser = await User.findById(req.userData.userId);
    if (!currentUser) {
      console.error('Current user not found:', req.userData.userId);
      return res.status(404).json({ error: 'Current user not found' });
    }

    // Build search query
    const searchQuery = {};

    // Add search filters from the request
    const { query, experienceLevel, preferredTime } = req.query;
    
    console.log('Search parameters:', {
      query,
      experienceLevel,
      preferredTime,
      userId: currentUser._id
    });

    // If query is provided, search by name or email
    if (query?.trim()) {
      const searchTerm = query.trim().toLowerCase();
      searchQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Add optional filters with case-insensitive matching
    if (experienceLevel?.trim() && experienceLevel.trim().toLowerCase() !== 'any') {
      searchQuery.experienceLevel = {
        $regex: new RegExp(`^${experienceLevel.trim()}$`, 'i')
      };
    }

    if (preferredTime?.trim() && preferredTime.trim().toLowerCase() !== 'any') {
      searchQuery.preferredTime = {
        $regex: new RegExp(`^${preferredTime.trim()}$`, 'i')
      };
    }

    console.log('Experience Level Filter:', experienceLevel?.trim());
    console.log('Preferred Time Filter:', preferredTime?.trim());

    console.log('MongoDB query:', JSON.stringify(searchQuery, null, 2));

    // Search for users
    const users = await User.find(searchQuery)
      .select('name email location experienceLevel preferredTime pace')
      .limit(50);

    // Filter out current user after the query
    const filteredUsers = users.filter(user => 
      user._id.toString() !== currentUser._id.toString()
    );

    console.log(`Found ${filteredUsers.length} users matching query (excluding current user)`);
    console.log('Users:', JSON.stringify(filteredUsers, null, 2));

    // Calculate compatibility scores
    const runnersWithScores = users.map(user => {
      let score = 0;
      
      // Same experience level: +40 points
      if (user.experienceLevel === currentUser.experienceLevel) {
        score += 40;
      }
      
      // Same preferred time: +30 points
      if (user.preferredTime === currentUser.preferredTime) {
        score += 30;
      }

      const result = {
        ...user.toObject(),
        compatibility: score
      };

      console.log('Processed user:', result);
      return result;
    });

    // Sort by compatibility score
    runnersWithScores.sort((a, b) => b.compatibility - a.compatibility);

    console.log('Final results:', runnersWithScores);
    return res.json(runnersWithScores);
  } catch (err) {
    console.error('Search error:', {
      error: err.message,
    });
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

// Send friend request
router.post('/friends/request/:userId', auth, async (req, res) => {
  try {
    const requesterId = req.userData.userId;
    const recipientId = req.params.userId;

    console.log('Creating friend request:', { requesterId, recipientId });

    // Check if users exist
    const [requester, recipient] = await Promise.all([
      User.findById(requesterId),
      User.findById(recipientId)
    ]);

    if (!requester || !recipient) {
      console.error('User not found:', { requester, recipient });
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friend request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingRequest) {
      console.log('Friend request already exists:', existingRequest);
      return res.status(400).json({ 
        error: 'Friend request already exists',
        status: existingRequest.status
      });
    }

    // Create friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    const savedRequest = await friendRequest.save();
    console.log('Friend request created:', savedRequest);

    // Return the populated friend request
    const populatedRequest = await Friend.findById(savedRequest._id)
      .populate({
        path: 'requester',
        model: 'User',
        select: 'name email'
      })
      .populate({
        path: 'recipient',
        model: 'User',
        select: 'name email'
      })
      .lean()
      .exec();

    console.log('Populated friend request:', JSON.stringify(populatedRequest, null, 2));
    return res.json({ message: 'Friend request sent' });
  } catch (err) {
    console.error('Friend request error:', err);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept/reject friend request
router.put('/friends/request/:requestId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.requestId;
    const userId = req.userData.userId;

    console.log('Updating friend request:', { requestId, userId, status });

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find and update friend request
    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    }).populate('requester recipient');

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    friendRequest.status = status;
    await friendRequest.save();

    // If request is accepted, create a conversation
    if (status === 'accepted') {
      // Check if a conversation already exists
      const existingConversation = await Conversation.findOne({
        participants: { $all: [friendRequest.requester._id, friendRequest.recipient._id] },
        isGroupChat: false
      });

      if (!existingConversation) {
        // Create new conversation
        const conversation = new Conversation({
          participants: [friendRequest.requester._id, friendRequest.recipient._id],
          isGroupChat: false
        });

        await conversation.save();
        console.log('Created new conversation:', conversation);

        // Create welcome message
        const message = new Message({
          conversation: conversation._id,
          sender: friendRequest.requester._id,
          content: `Hi ${friendRequest.recipient.name}! Thanks for accepting my friend request. Let's go for a run together!`,
          timestamp: new Date()
        });

        await message.save();

        // Update conversation with last message
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.timestamp;
        await conversation.save();

        console.log('Created welcome message:', message);
      }
    }

    return res.json({ 
      message: `Friend request ${status}`,
      friendRequest
    });
  } catch (err) {
    console.error('Friend request update error:', err);
    return res.status(500).json({ error: 'Failed to update friend request' });
  }
});

// Get friend requests
router.get('/friends/requests', auth, async (req, res) => {
  try {
    const userId = req.userData.userId;
    console.log('Getting friend requests for user:', userId);

    // Get both sent and received requests
    const requests = await Friend.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    })
    .populate({
      path: 'requester',
      model: 'User',
      select: 'name email'
    })
    .populate({
      path: 'recipient',
      model: 'User',
      select: 'name email'
    })
    .lean()
    .exec();

    if (!requests || requests.length === 0) {
      console.log('No friend requests found');
      return res.json({ sent: [], received: [] });
    }

    console.log('Found friend requests:', JSON.stringify(requests, null, 2));

    // Filter and validate each request
    const validRequests = requests.filter(r => {
      if (!r.requester || !r.recipient) {
        console.warn('Invalid friend request found:', r);
        return false;
      }
      return true;
    });

    const response = {
      sent: validRequests.filter(r => r.requester._id.toString() === userId),
      received: validRequests.filter(r => r.recipient._id.toString() === userId)
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    return res.json(response);
  } catch (err) {
    console.error('Get friend requests error:', err);
    return res.status(500).json({
      error: 'Failed to get friend requests',
      details: err.message
    });
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
