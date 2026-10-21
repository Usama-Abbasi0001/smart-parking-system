import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  try {
    // If connection already open (cached in serverless container), reuse it
    if (mongoose.connection.readyState === 1) {
      return;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      console.log('Connecting to MongoDB via MONGODB_URI...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });
      console.log(`MongoDB Connected successfully to: ${mongoose.connection.host}`);
      return;
    }

    // In serverless environments (Vercel), in-memory binary cannot be downloaded
    if (process.env.VERCEL) {
      throw new Error(
        'MONGODB_URI environment variable is missing on Vercel. Please add MONGODB_URI to your Vercel Project Environment Variables.'
      );
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
    if (!memoryServer && process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
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
    if (!process.env.VERCEL) {
      process.exit(1);
    } else {
      throw error;
    }
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
