import mongoose, { Schema, Document, Model } from "mongoose"

export interface IStrategy extends Document {
  name: string
  description: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const strategySchema = new Schema<IStrategy>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Strategy: Model<IStrategy> =
  mongoose.models.Strategy || mongoose.model<IStrategy>("Strategy", strategySchema)
