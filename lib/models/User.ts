import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface IBalanceAdjustment {
  amount: number
  type: "DEPOSIT" | "WITHDRAWAL" | "RESET"
  note: string
  date: Date
}

export interface IUser extends Document {
  _id: Types.ObjectId
  name: string
  email: string
  passwordHash: string
  accountBalance: number
  accountCurrency: string
  preferredStrategies: Types.ObjectId[]
  balanceAdjustments: IBalanceAdjustment[]
  createdAt: Date
  updatedAt: Date
}

const balanceAdjustmentSchema = new Schema<IBalanceAdjustment>(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ["DEPOSIT", "WITHDRAWAL", "RESET"], required: true },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: true }
)

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    accountBalance: { type: Number, default: 0 },
    accountCurrency: { type: String, default: "USD" },
    preferredStrategies: [{ type: Schema.Types.ObjectId, ref: "Strategy" }],
    balanceAdjustments: [balanceAdjustmentSchema],
  },
  { timestamps: true }
)

if (process.env.NODE_ENV !== "production" && mongoose.models.User) {
  delete (mongoose.models as any).User
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema)

