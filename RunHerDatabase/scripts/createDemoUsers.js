const mongoose = require('mongoose');
const User = require('../models/User');
const RunnerProfile = require('../models/RunnerProfile');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const demoUsers = [
      { name: 'Melissa Chen', email: 'melissa.chen@example.com', experienceLevel: 'intermediate', preferredTime: 'morning' },
      { name: 'Jessica Williams', email: 'jessica.williams@example.com', experienceLevel: 'advanced', preferredTime: 'evening' },
      { name: 'Amanda Taylor', email: 'amanda.taylor@example.com', experienceLevel: 'beginner', preferredTime: 'afternoon' },
      { name: 'Rebecca Johnson', email: 'rebecca.johnson@example.com', experienceLevel: 'expert', preferredTime: 'early_morning' },
      { name: 'Stephanie Lee', email: 'stephanie.lee@example.com', experienceLevel: 'intermediate', preferredTime: 'night' }
    ];

    const hashedPassword = await bcrypt.hash('demoUser123!', 10);

    for (const demoUser of demoUsers) {
      // Create or update user
      let user = await User.findOne({ email: demoUser.email });
      if (!user) {
        user = new User({
          name: demoUser.name,
          email: demoUser.email,
          password: hashedPassword
        });
        await user.save();
        console.log(`Created user ${demoUser.name}`);
      }

      // Create or update profile
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
    }
    console.log('Finished creating demo users');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createDemoUsers();
