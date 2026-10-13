import mongoose from "mongoose"

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null }
if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Please set it in your environment variables or .env.local file."
    )
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10, // keep low for serverless
      serverSelectionTimeoutMS: 5000,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}

export function isDbConfigured(): boolean {
  const uri = process.env.MONGODB_URI
  return Boolean(uri && uri.trim().length > 0)
}
