import { MongoMemoryServer } from 'mongodb-memory-server';
import { resolve } from 'path';

async function run() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.PORT = '5000';
  process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_testing';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_testing';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.CLIENT_URL = 'http://localhost:5173';
  
  console.log(`Test DB running at ${uri}`);
  
  // Dynamic import to ensure process.env is set before the server code runs
  require('./src/index');
}

run().catch(console.error);
