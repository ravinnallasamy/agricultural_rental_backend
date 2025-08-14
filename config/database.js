const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    // MongoDB connection string from centralized config
    const conn = await mongoose.connect(config.mongodb.uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Log collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📁 Available Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
