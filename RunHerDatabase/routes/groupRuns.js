const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GroupRun = require('../models/GroupRun');
const RunningGroup = require('../models/RunningGroup');

// Get all upcoming group runs
router.get('/upcoming', auth, async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 10, // miles
      startDate = new Date(),
      endDate,
      distance,
      pace
    } = req.query;

    let query = {
      date: { $gte: startDate },
      status: 'scheduled'
    };

    if (endDate) {
      query.date.$lte = endDate;
    }

    // Location-based search
    if (lat && lng) {
      query.meetingPoint = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1609.34 // Convert miles to meters
        }
      };
    }

    // Distance filter
    if (distance) {
      const [min, max] = distance.split('-').map(Number);
      query['distance.value'] = { $gte: min, $lte: max };
    }

    // Pace filter
    if (pace) {
      const [min, max] = pace.split('-').map(Number);
      query['pace.min'] = { $gte: min };
      query['pace.max'] = { $lte: max };
    }

    const runs = await GroupRun.find(query)
      .populate('group', 'name description')
      .populate('participants.user', 'name email')
      .sort('date startTime');

    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific group run
router.get('/:runId', auth, async (req, res) => {
  try {
    const run = await GroupRun.findById(req.params.runId)
      .populate('group', 'name description')
      .populate('participants.user', 'name email');

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    res.json(run);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a group run
router.put('/:runId', auth, async (req, res) => {
  try {
    const run = await GroupRun.findById(req.params.runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Check if user is group admin
    const group = await RunningGroup.findById(run.group);
    const isAdmin = group.members.some(
      m => m.user.toString() === req.user.userId && m.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedRun = await GroupRun.findByIdAndUpdate(
      req.params.runId,
      req.body,
      { new: true }
    );

    res.json(updatedRun);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Join/update status for a group run
router.post('/:runId/join', auth, async (req, res) => {
  try {
    const { status = 'going' } = req.body;
    const run = await GroupRun.findById(req.params.runId);

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Check if already a participant
    const participantIndex = run.participants.findIndex(
      p => p.user.toString() === req.user.userId
    );

    if (participantIndex > -1) {
      // Update existing status
      run.participants[participantIndex].status = status;
    } else {
      // Check if run is full
      if (run.maxParticipants && run.participants.length >= run.maxParticipants) {
        return res.status(400).json({ error: 'Run is full' });
      }

      // Add new participant
      run.participants.push({
        user: req.user.userId,
        status
      });
    }

    await run.save();
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave a group run
router.post('/:runId/leave', auth, async (req, res) => {
  try {
    const run = await GroupRun.findById(req.params.runId);

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Remove participant
    run.participants = run.participants.filter(
      p => p.user.toString() !== req.user.userId
    );

    await run.save();
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update run status (e.g., start, complete, cancel)
router.post('/:runId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const run = await GroupRun.findById(req.params.runId);

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Check if user is group admin
    const group = await RunningGroup.findById(run.group);
    const isAdmin = group.members.some(
      m => m.user.toString() === req.user.userId && m.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    run.status = status;
    await run.save();
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update safety features for a run
router.put('/:runId/safety', auth, async (req, res) => {
  try {
    const run = await GroupRun.findById(req.params.runId);

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Check if user is participant
    const isParticipant = run.participants.some(
      p => p.user.toString() === req.user.userId
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Must be a participant to update safety features' });
    }

    run.safetyFeatures = {
      ...run.safetyFeatures,
      ...req.body
    };

    await run.save();
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
