const mongoose = require('mongoose');
const User = require('../models/User');
const RunnerProfile = require('../models/RunnerProfile');
require('dotenv').config();

async function fixStephanieProfile() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ name: 'Stephanie Lee' });
    if (user) {
      let profile = await RunnerProfile.findOne({ user: user._id });
      if (profile) {
        profile.experienceLevel = 'advanced';
        profile.preferredRunningTime = 'evening'; // Update this too based on the DOM
        await profile.save();
        console.log('Updated Stephanie Lee\'s profile:');
        console.log('Experience Level:', profile.experienceLevel);
        console.log('Preferred Time:', profile.preferredRunningTime);
      }
    }

    // Verify all profiles
    console.log('\nAll current profiles:');
    const allProfiles = await RunnerProfile.find().populate('user', 'name');
    for (const profile of allProfiles) {
      if (profile.user) {
        console.log(`\nUser: ${profile.user.name}`);
        console.log('Experience Level:', profile.experienceLevel);
        console.log('Preferred Time:', profile.preferredRunningTime);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixStephanieProfile();
