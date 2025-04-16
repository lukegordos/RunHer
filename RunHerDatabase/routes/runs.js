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

    console.log('Calculated stats:', stats);
    res.json(stats);
  } catch (err) {
    console.error('Error getting stats:', err);
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
