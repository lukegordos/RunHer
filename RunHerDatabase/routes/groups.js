const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RunningGroup = require('../models/RunningGroup');
const GroupRun = require('../models/GroupRun');
const User = require('../models/User');

// Create a new running group
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      meetingTimes,
      paceRange,
      distanceRange,
      tags,
      isPrivate,
      maxMembers
    } = req.body;

    const group = new RunningGroup({
      name,
      description,
      creator: req.user.userId,
      location,
      meetingTimes,
      paceRange,
      distanceRange,
      tags,
      isPrivate,
      maxMembers,
      members: [{
        user: req.user.userId,
        role: 'admin'
      }]
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all public running groups
router.get('/', auth, async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 10, // miles
      pace,
      distance,
      tags
    } = req.query;

    let query = { isPrivate: false };

    // Location-based search
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1609.34 // Convert miles to meters
        }
      };
    }

    // Pace range filter
    if (pace) {
      const [min, max] = pace.split('-').map(Number);
      query['paceRange.min'] = { $lte: max };
      query['paceRange.max'] = { $gte: min };
    }

    // Distance range filter
    if (distance) {
      const [min, max] = distance.split('-').map(Number);
      query['distanceRange.min'] = { $lte: max };
      query['distanceRange.max'] = { $gte: min };
    }

    // Tags filter
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    const groups = await RunningGroup.find(query)
      .populate('creator', 'name email')
      .populate('members.user', 'name email')
      .sort('-createdAt');

    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific running group
router.get('/:groupId', auth, async (req, res) => {
  try {
    const group = await RunningGroup.findById(req.params.groupId)
      .populate('creator', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a running group
router.put('/:groupId', auth, async (req, res) => {
  try {
    const group = await RunningGroup.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is admin
    const memberRecord = group.members.find(
      m => m.user.toString() === req.user.userId && m.role === 'admin'
    );

    if (!memberRecord) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedGroup = await RunningGroup.findByIdAndUpdate(
      req.params.groupId,
      req.body,
      { new: true }
    );

    res.json(updatedGroup);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a running group
router.post('/:groupId/join', auth, async (req, res) => {
  try {
    const group = await RunningGroup.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already a member
    if (group.members.some(m => m.user.toString() === req.user.userId)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is full' });
    }

    group.members.push({
      user: req.user.userId,
      role: 'member'
    });

    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave a running group
router.post('/:groupId/leave', auth, async (req, res) => {
  try {
    const group = await RunningGroup.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Remove member
    group.members = group.members.filter(
      m => m.user.toString() !== req.user.userId
    );

    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a group run
router.post('/:groupId/runs', auth, async (req, res) => {
  try {
    const group = await RunningGroup.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.some(m => m.user.toString() === req.user.userId)) {
      return res.status(403).json({ error: 'Must be a member to create runs' });
    }

    const groupRun = new GroupRun({
      group: req.params.groupId,
      ...req.body,
      participants: [{
        user: req.user.userId,
        status: 'going'
      }]
    });

    await groupRun.save();
    res.status(201).json(groupRun);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all runs for a group
router.get('/:groupId/runs', auth, async (req, res) => {
  try {
    const runs = await GroupRun.find({ group: req.params.groupId })
      .populate('participants.user', 'name email')
      .sort('date');

    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
