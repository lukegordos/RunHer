const mongoose = require('mongoose');
const User = require('../models/User');
const RunnerProfile = require('../models/RunnerProfile');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find().select('name email');
    console.log('\nAll users:');
    for (const user of users) {
      console.log(`- ${user.name} (${user.email})`);
    }

    // Find users with "luke" in their name (case insensitive)
    const lukeUsers = await User.find({
      name: { $regex: 'luke', $options: 'i' }
    }).select('name email');
    
    console.log('\nUsers with "luke" in their name:');
    for (const user of lukeUsers) {
      console.log(`- ${user.name} (${user.email})`);
    }

    // Get their profiles
    const userIds = lukeUsers.map(u => u._id);
    const profiles = await RunnerProfile.find({
      user: { $in: userIds }
    });

    console.log('\nProfiles for users with "luke":');
    for (const profile of profiles) {
      console.log(`- User ID: ${profile.user}`);
      console.log(`  Experience: ${profile.experienceLevel}`);
      console.log(`  Preferred Time: ${profile.preferredRunningTime}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
