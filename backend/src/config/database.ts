import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    });

    isConnected = true;
    logger.info(
      { host: mongoose.connection.host, name: mongoose.connection.name },
      'MongoDB connected successfully'
    );

    mongoose.connection.on('error', (err) => {
      logger.error({ error: err.message }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
}

export function getConnection() {
  return mongoose.connection;
}

export { mongoose };
