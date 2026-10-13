import mongoose, { Schema, Document, Model } from "mongoose"

export interface IApiCache extends Document {
  key: string
  payload: any
  credits: number
  fetchedAt: Date
  ttlHours: number
  expiresAt: Date
}

const apiCacheSchema = new Schema<IApiCache>(
  {
    key: { type: String, required: true, unique: true, index: true, trim: true },
    payload: { type: Schema.Types.Mixed, required: true },
    credits: { type: Number, default: 0 },
    fetchedAt: { type: Date, default: Date.now, index: true },
    ttlHours: { type: Number, default: 1 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
)

// Ensure model reloads cleanly in Next.js development
if (process.env.NODE_ENV !== "production" && mongoose.models.ApiCache) {
  delete (mongoose.models as any).ApiCache
}

export const ApiCache: Model<IApiCache> =
  mongoose.models.ApiCache || mongoose.model<IApiCache>("ApiCache", apiCacheSchema)
