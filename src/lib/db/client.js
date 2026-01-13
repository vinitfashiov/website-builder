import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error('MONGO_URL environment variable is not set');
}

if (!dbName) {
  throw new Error('DB_NAME environment variable is not set');
}

let client = null;
let clientPromise = null;

const globalForMongo = globalThis;

if (!globalForMongo._mongoClientPromise) {
  client = new MongoClient(uri);
  globalForMongo._mongoClientPromise = client.connect();
}

clientPromise = globalForMongo._mongoClientPromise;

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

