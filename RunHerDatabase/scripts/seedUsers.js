const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get command line arguments
    const [name, email, experienceLevel, preferredTime] = process.argv.slice(2);

    // Delete existing test users
    console.log('Deleting existing test users...');
    await User.deleteMany({
      email: {
        $in: ['sarah@example.com', 'mike@example.com', 'emma@example.com', email].filter(Boolean)
      }
    });

    // Create test users array
    const testUsers = [
      {
        name: 'Sarah Runner',
        email: 'sarah@example.com',
        password: await bcrypt.hash('password123', 10),
        experienceLevel: 'intermediate',
        preferredTime: 'morning',
        location: 'Portland, OR',
        pace: '8:30 min/mile'
      },
      {
        name: 'Mike Jogger',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 10),
        experienceLevel: 'beginner',
        preferredTime: 'evening',
        location: 'Portland, OR',
        pace: '10:00 min/mile'
      },
      {
        name: 'Emma Sprint',
        email: 'emma@example.com',
        password: await bcrypt.hash('password123', 10),
        experienceLevel: 'advanced',
        preferredTime: 'morning',
        location: 'Portland, OR',
        pace: '7:00 min/mile'
      }
    ];

    // Add custom user if provided
    if (name && email && experienceLevel && preferredTime) {
      testUsers.push({
        name,
        email,
        password: await bcrypt.hash('password123', 10),
        experienceLevel,
        preferredTime,
        location: 'Portland, OR',
        pace: '10:00 min/mile'
      });
    }

    // Create new test users
    // Insert new test users
    console.log('Creating new test users...');
    const createdUsers = await User.insertMany(testUsers);
    console.log('Created users:', createdUsers.map(user => ({
      name: user.name,
      email: user.email,
      experienceLevel: user.experienceLevel
    })));

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
