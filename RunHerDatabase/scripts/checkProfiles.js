const mongoose = require('mongoose');
const User = require('../models/User');
const RunnerProfile = require('../models/RunnerProfile');
require('dotenv').config();

async function checkProfiles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({
      name: { $in: ['Stephanie Lee', 'Rebecca Johnson'] }
    });

    for (const user of users) {
      console.log(`\nChecking profile for ${user.name}:`);
      const profile = await RunnerProfile.findOne({ user: user._id });
      if (profile) {
        console.log('Experience Level:', profile.experienceLevel);
        console.log('Preferred Time:', profile.preferredRunningTime);
      } else {
        console.log('No profile found');
      }
    }

    console.log('\nAll RunnerProfiles:');
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

checkProfiles();
