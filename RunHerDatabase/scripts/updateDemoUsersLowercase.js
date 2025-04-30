const mongoose = require('mongoose');
const User = require('../models/User');
const RunnerProfile = require('../models/RunnerProfile');
require('dotenv').config();

async function updateDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const demoUsers = [
      { name: 'Melissa Chen', experienceLevel: 'intermediate', preferredTime: 'morning' },
      { name: 'Jessica Williams', experienceLevel: 'advanced', preferredTime: 'evening' },
      { name: 'Amanda Taylor', experienceLevel: 'beginner', preferredTime: 'afternoon' },
      { name: 'Rebecca Johnson', experienceLevel: 'expert', preferredTime: 'early_morning' },
      { name: 'Stephanie Lee', experienceLevel: 'intermediate', preferredTime: 'night' }
    ];

    for (const demoUser of demoUsers) {
      const user = await User.findOne({ name: demoUser.name });
      if (user) {
        let profile = await RunnerProfile.findOne({ user: user._id });
        if (profile) {
          profile.experienceLevel = demoUser.experienceLevel.toLowerCase();
          profile.preferredRunningTime = demoUser.preferredTime.toLowerCase();
          await profile.save();
          console.log(`Updated profile for ${demoUser.name} to lowercase values`);
          console.log('New values:', {
            experienceLevel: profile.experienceLevel,
            preferredTime: profile.preferredRunningTime
          });
        }
      }
    }
    
    console.log('\nAll profiles after update:');
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

updateDemoUsers();
