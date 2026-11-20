import "server-only";

import { MongoClient, type Db } from "mongodb";

const DEFAULT_DATABASE_NAME = "market_trends";

// Reused across hot reloads in development and across invocations of a warm serverless instance
const globalForMongo = globalThis as typeof globalThis & {
  marketTrendsMongoClient?: Promise<MongoClient>;
};

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be configured");
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000, appName: "market-trends-front" });
  return client.connect().catch((error: unknown) => {
    globalForMongo.marketTrendsMongoClient = undefined;
    throw error;
  });
}

export async function getDatabase(): Promise<Db> {
  globalForMongo.marketTrendsMongoClient ??= connect();
  const client = await globalForMongo.marketTrendsMongoClient;
  return client.db(process.env.MONGODB_DATABASE || DEFAULT_DATABASE_NAME);
}
