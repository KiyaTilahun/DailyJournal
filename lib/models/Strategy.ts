import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface IStrategy extends Document {
  _id: Types.ObjectId
  owner: Types.ObjectId
  name: string
  description: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const strategySchema = new Schema<IStrategy>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Compound unique index: unique per owner
strategySchema.index({ owner: 1, name: 1 }, { unique: true })

if (process.env.NODE_ENV !== "production" && mongoose.models.Strategy) {
  delete (mongoose.models as any).Strategy
}

export const Strategy: Model<IStrategy> =
  mongoose.models.Strategy || mongoose.model<IStrategy>("Strategy", strategySchema)

