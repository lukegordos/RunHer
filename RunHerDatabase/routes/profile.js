const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RunnerProfile = require('../models/RunnerProfile');

// Get current user's profile
router.get('/me', auth, async (req, res) => {
  console.log('Getting profile for user:', req.userData.userId);
  try {
    const userId = req.userData.userId;
    console.log('Looking up profile with userId:', userId);
    
    // First check if the profile exists
    let profile = await RunnerProfile.findOne({ user: userId });
    console.log('Initial profile lookup result:', profile);
    
    if (!profile) {
      console.log('No profile found, creating default profile');
      try {
        // Create a default profile if none exists
        profile = new RunnerProfile({
          user: userId,
          experienceLevel: 'beginner',
          averagePace: 0,
          weeklyMileage: 0,
          personalBests: {
            mile: null,
            fiveK: null,
            tenK: null,
            halfMarathon: null,
            marathon: null
          },
          totalMilesRun: 0,
          preferredRunningTime: 'morning',
          location: {
            type: 'Point',
            coordinates: [0, 0]
          }
        });
        console.log('Created new profile object:', profile);
        profile = await profile.save();
        console.log('Default profile saved successfully:', profile);
        
        // Verify the save
        const verifiedProfile = await RunnerProfile.findById(profile._id);
        console.log('Verified newly created profile:', verifiedProfile);
        profile = verifiedProfile;
      } catch (err) {
        console.error('Error creating default profile:', err);
        throw err;
      }
    }
    
    res.json(profile);
  } catch (err) {
    console.error('Error in GET /me:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  console.log('\n--- Profile Update Request ---');
  const userId = req.userData.userId;
  console.log('User ID:', userId);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // First check if the profile exists
    let profile = await RunnerProfile.findOne({ user: userId });
    
    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = new RunnerProfile({
        user: userId,
        experienceLevel: 'beginner',
        averagePace: 0,
        weeklyMileage: 0,
        preferredRunningTime: 'morning',
        location: {
          type: 'Point',
          coordinates: [0, 0]
        }
      });
    }

    // Update fields that are provided
    if (req.body.experienceLevel) profile.experienceLevel = req.body.experienceLevel;
    if (typeof req.body.averagePace === 'number') profile.averagePace = req.body.averagePace;
    if (typeof req.body.weeklyMileage === 'number') profile.weeklyMileage = req.body.weeklyMileage;
    if (req.body.preferredRunningTime) profile.preferredRunningTime = req.body.preferredRunningTime;
    if (req.body.personalBests) profile.personalBests = req.body.personalBests;
    if (req.body.location) {
      profile.location = {
        type: 'Point',
        coordinates: req.body.location.coordinates
      };
    }

    console.log('Saving profile:', JSON.stringify(profile.toObject(), null, 2));
    
    // Save the profile
    const savedProfile = await profile.save();
    console.log('Profile saved:', JSON.stringify(savedProfile.toObject(), null, 2));
    
    res.json(savedProfile);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

module.exports = router;
