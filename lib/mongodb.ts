import mongoose from "mongoose";

let cachedConnection: typeof mongoose | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mini-tools";
  
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  mongoose.set("strictQuery", false);

  cachedConnection = await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || undefined,
  });

  return cachedConnection;
}

