import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      console.log('Connecting to MongoDB via MONGODB_URI...');
      await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected successfully to: ${mongoose.connection.host}`);
      return;
    }

    // Fallback in development when no remote URI is configured
    console.log('No MONGODB_URI provided. Initializing local in-memory MongoDB fallback...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    
    await mongoose.connect(memoryUri);
    console.log(`Connected to in-memory MongoDB instance at: ${memoryUri}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // If remote connection failed and we are not using memory server, attempt in-memory fallback
    if (!memoryServer && process.env.NODE_ENV !== 'production') {
      try {
        console.log('Attempting in-memory MongoDB fallback after remote connection failure...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri();
        await mongoose.connect(memoryUri);
        console.log(`Connected to fallback in-memory MongoDB at: ${memoryUri}`);
        return;
      } catch (fallbackErr) {
        console.error('Fallback MongoDB also failed:', fallbackErr.message);
      }
    }
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error.message);
  }
};
