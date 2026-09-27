import mongoose from 'mongoose';
import { config } from './index';

let mongoMemoryServer: any = null;

export async function connectDatabase(): Promise<void> {
  let uri = config.mongodbUri;

  if (!uri) {
    console.log('No MONGODB_URI detected in environment. Starting mongodb-memory-server...');
    try {
      // Dynamic import to avoid loading memory server in environments where it's not needed/installed
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      console.log(`mongodb-memory-server started at URI: ${uri}`);
    } catch (err) {
      console.error('Failed to start mongodb-memory-server:', err);
      process.exit(1);
    }
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB successfully connected!');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      console.log('In-memory MongoDB server stopped.');
    }
  } catch (err) {
    console.error('Error disconnecting database:', err);
  }
}
