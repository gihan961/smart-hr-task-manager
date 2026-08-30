const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smarthr';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // 3 sec timeout to fail gracefully if MongoDB server is offline
    });
    isConnected = true;
    console.log(`[MongoDB] Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Connection Notice (${mongoURI}): ${error.message}. Running in Clean Data Mode.`);
    return false;
  }
};

const getDBStatus = () => {
  return {
    database: 'MongoDB',
    status: isConnected || mongoose.connection.readyState === 1 ? 'CONNECTED' : 'STANDBY / CLEAN_MODE',
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smarthr',
    readyState: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    host: mongoose.connection.host || '127.0.0.1',
    port: mongoose.connection.port || 27017,
    name: mongoose.connection.name || 'smarthr'
  };
};

module.exports = { connectDB, getDBStatus, mongoose };
