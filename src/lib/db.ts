// Check if we're on the server side before importing mongoose
import mongoose from "mongoose";

// This should only run on the server
const isServerSide = typeof window === "undefined";

// Only access environment variables on the server side
const NEXT_PUBLIC_MONGODB_URI = isServerSide
  ? process.env.NEXT_PUBLIC_MONGODB_URI
  : null;

// Only check for the environment variable on the server side
if (isServerSide && !NEXT_PUBLIC_MONGODB_URI) {
  throw new Error(
    "Please define the NEXT_PUBLIC_MONGODB_URI environment variable inside .env.local"
  );
}

// Define a type for the cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache connection on server side only
let cached: MongooseCache | null = isServerSide
  ? (global as { mongoose?: MongooseCache }).mongoose ?? null
  : null;

if (isServerSide && !cached) {
  cached = (global as { mongoose?: MongooseCache }).mongoose = {
    conn: null,
    promise: null,
  };
}

async function dbConnect() {
  // Return early if on client side
  if (!isServerSide) {
    console.warn("Database connection is only available on the server side");
    return null;
  }

  if (cached && cached.conn) return cached.conn;
  if (cached && !cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose
      .connect(NEXT_PUBLIC_MONGODB_URI!, opts)
      .then((mongoose) => mongoose);
  }
  try {
    if (cached) {
      cached.conn = await cached.promise;
    }
  } catch (e) {
    if (cached) {
      cached.promise = null;
    }
    throw e;
  }
  return cached ? cached.conn : null;
}

export default dbConnect;
