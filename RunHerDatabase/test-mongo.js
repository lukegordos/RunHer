const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB!');
    console.log('Database name:', conn.connection.db.databaseName);
    
    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Try to insert a document directly using the native driver
    const result = await conn.connection.db.collection('test').insertOne({
      test: true,
      timestamp: new Date()
    });
    console.log('Test document inserted:', result.insertedId);
    
    // Clean up test document
    await conn.connection.db.collection('test').deleteOne({ _id: result.insertedId });
    console.log('Test document cleaned up');
    
    await mongoose.disconnect();
    console.log('Disconnected successfully');
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();
