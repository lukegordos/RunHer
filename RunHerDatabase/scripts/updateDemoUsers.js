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
        if (!profile) {
          profile = new RunnerProfile({
            user: user._id,
            experienceLevel: demoUser.experienceLevel,
            preferredRunningTime: demoUser.preferredTime,
            averagePace: Math.floor(Math.random() * 5) + 7,
            weeklyMileage: Math.floor(Math.random() * 30) + 10,
            location: {
              type: 'Point',
              coordinates: [-73.935242 + (Math.random() - 0.5), 40.730610 + (Math.random() - 0.5)]
            }
          });
          await profile.save();
          console.log(`Created profile for ${demoUser.name}`);
        } else {
          profile.experienceLevel = demoUser.experienceLevel;
          profile.preferredRunningTime = demoUser.preferredTime;
          await profile.save();
          console.log(`Updated profile for ${demoUser.name}`);
        }
      } else {
        console.log(`User ${demoUser.name} not found`);
      }
    }
    console.log('Finished updating demo users');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateDemoUsers();
