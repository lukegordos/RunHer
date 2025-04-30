const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Run = require('../models/Run');
const RunnerProfile = require('../models/RunnerProfile');

// Get runner profile
router.get('/profile', auth, async (req, res) => {
  try {
    let profile = await RunnerProfile.findOne({ user: req.userData.userId });
    if (!profile) {
      profile = new RunnerProfile({ user: req.userData.userId });
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Update runner profile
router.put('/profile', auth, async (req, res) => {
  try {
    const profile = await RunnerProfile.findOneAndUpdate(
      { user: req.userData.userId },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    console.log('Updated profile:', profile);
    res.json(profile);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Log a new run
router.post('/log', auth, async (req, res) => {
  try {
    console.log('Logging new run for user:', req.userData.userId);
    console.log('Run data:', req.body);

    const run = new Run({
      user: req.userData.userId,
      ...req.body
    });
    await run.save();
    console.log('Run saved:', run);

    // Update runner profile stats
    const profile = await RunnerProfile.findOne({ user: req.userData.userId });
    if (profile) {
      profile.totalMilesRun = (profile.totalMilesRun || 0) + run.distance.value;
      
      // Update personal bests if applicable
      if (run.distance.value === 1 && (!profile.personalBests.mile || run.duration < profile.personalBests.mile)) {
        profile.personalBests.mile = run.duration;
      }
      // Add similar checks for other distances (5K, 10K, etc.)
      
      await profile.save();
      console.log('Profile updated with new run stats:', profile);
    }

    res.json(run);
  } catch (err) {
    console.error('Error logging run:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get all runs for a user
router.get('/history', auth, async (req, res) => {
  try {
    const runs = await Run.find({ user: req.userData.userId })
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 10)
      .skip(parseInt(req.query.skip) || 0);
    console.log(`Found ${runs.length} runs for user:`, req.userData.userId);
    res.json(runs);
  } catch (err) {
    console.error('Error getting run history:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get stats summary
router.get('/stats', auth, async (req, res) => {
  try {
    const runs = await Run.find({ user: req.userData.userId });
    console.log(`Calculating stats from ${runs.length} runs`);

    const stats = {
      totalRuns: runs.length,
      totalDistance: runs.reduce((sum, run) => sum + run.distance.value, 0),
      averagePace: runs.length > 0 ? runs.reduce((sum, run) => sum + run.pace, 0) / runs.length : 0,
      totalDuration: runs.reduce((sum, run) => sum + run.duration, 0),
      // Add more stats as needed
    };

    res.json(stats);
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Calendar routes

// Get calendar runs for a date range
router.get('/calendar', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('Getting calendar runs between:', startDate, 'and', endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // Find all runs for this user in the date range that are either:
    // 1. Created by this user (regardless of type)
    // 2. Group runs where this user is a participant
    const runs = await Run.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      $or: [
        { user: req.userData.userId },
        { 
          type: 'group',
          participants: req.userData.userId 
        }
      ],
      status: 'scheduled'
    }).populate('participants', 'name');

    console.log(`Found ${runs.length} calendar runs`);
    res.json(runs);
  } catch (err) {
    console.error('Error getting calendar runs:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Schedule a new run
router.post('/calendar', auth, async (req, res) => {
  try {
    console.log('Scheduling new run:', req.body);

    const run = new Run({
      user: req.userData.userId,
      status: 'scheduled',
      ...req.body
    });

    await run.save();
    console.log('Run scheduled:', run);
    res.json(run);
  } catch (err) {
    console.error('Error scheduling run:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Update a scheduled run
router.put('/calendar/:runId', auth, async (req, res) => {
  try {
    const run = await Run.findOneAndUpdate(
      { _id: req.params.runId, user: req.userData.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    console.log('Run updated:', run);
    res.json(run);
  } catch (err) {
    console.error('Error updating run:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Delete a scheduled run
router.delete('/calendar/:runId', auth, async (req, res) => {
  try {
    const run = await Run.findOneAndDelete({
      _id: req.params.runId,
      user: req.userData.userId
    });

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    console.log('Run deleted:', run);
    res.json({ message: 'Run deleted successfully' });
  } catch (err) {
    console.error('Error deleting run:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Invite a user to a run
router.post('/calendar/:runId/invite', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const run = await Run.findOne({
      _id: req.params.runId,
      user: req.userData.userId
    });

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    if (!run.participants.includes(userId)) {
      run.participants.push(userId);
      await run.save();
    }

    console.log('User invited to run:', { runId: run._id, userId });
    res.json(run);
  } catch (err) {
    console.error('Error inviting user to run:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Respond to a run invitation
router.post('/calendar/:runId/respond', auth, async (req, res) => {
  try {
    const { response } = req.body;
    const run = await Run.findById(req.params.runId);

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    if (response === 'accept') {
      // Add user to participants if not already there
      if (!run.participants.includes(req.userData.userId)) {
        run.participants.push(req.userData.userId);
      }
    } else if (response === 'decline') {
      // Remove user from participants
      run.participants = run.participants.filter(
        (p) => p.toString() !== req.userData.userId
      );
    }

    await run.save();
    console.log('Run invitation response processed:', run);
    res.json(run);
  } catch (err) {
    console.error('Error responding to run invitation:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Schedule a run
router.post('/calendar', auth, async (req, res) => {
  try {
    console.log('Received run data:', req.body);
    
    // Validate required fields
    const requiredFields = ['title', 'date', 'meetingPoint', 'distance', 'duration', 'type'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: missingFields
      });
    }

    const runData = {
      ...req.body,
      user: req.userData.userId,
      date: new Date(req.body.date),
      status: 'scheduled',
      confirmed: false
    };

    console.log('Creating run with data:', runData);
    const run = new Run(runData);
    await run.save();
    
    console.log('Run saved successfully:', run);
    res.json(run);
  } catch (err) {
    console.error('Error scheduling run:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});

// Get calendar runs
router.get('/calendar', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('Getting calendar runs between:', { startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Set the time to the start and end of the day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const query = {
      user: req.userData.userId,
      status: 'scheduled',
      date: {
        $gte: start,
        $lte: end
      }
    };

    console.log('Finding runs with query:', JSON.stringify(query, null, 2));
    const runs = await Run.find(query)
      .sort({ date: 1 })
      .lean()
      .exec();
    
    console.log(`Found ${runs.length} scheduled runs:`, JSON.stringify(runs, null, 2));
    res.json(runs);
  } catch (err) {
    console.error('Error getting calendar runs:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Find nearby runners
router.get('/nearby', auth, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query; // maxDistance in meters
    
    const nearbyRunners = await RunnerProfile.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('user', 'name');
    
    res.json(nearbyRunners);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
