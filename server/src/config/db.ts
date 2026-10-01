import mongoose from 'mongoose';
import { setServers } from 'node:dns/promises';
import { env } from './env';

let connecting: Promise<void> | undefined;
export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (connecting) return connecting;
  connecting = openDatabase();
  try { await connecting; } finally { connecting = undefined; }
};
const openDatabase = async (): Promise<void> => {
  if (env.DNS_SERVERS) setServers(env.DNS_SERVERS.split(',').map((server) => server.trim()));
  try {
    const connection = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 30000 });
    console.log(`✅ MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw new Error(
      code === 'ENOTFOUND' || code === 'ECONNREFUSED'
        ? 'MongoDB is unreachable. Check MONGODB_URI and your Atlas cluster or start a local database.'
        : 'MongoDB connection failed. Check the database address, credentials, and network access.'
    );
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});
