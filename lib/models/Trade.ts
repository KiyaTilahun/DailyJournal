import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface ITradeScreenshot {
  label: "ENTRY_TF" | "HTF_CONTEXT" | string
  url: string
}

export interface ITrade extends Document {
  _id: Types.ObjectId
  user: Types.ObjectId
  balanceAtEntry?: number
  instrument: string
  direction: "LONG" | "SHORT"
  entryTime: Date
  exitTime?: Date
  entryPrice: number
  stopLoss?: number
  takeProfit?: number
  exitPrice?: number
  lotSize?: number
  riskPercent?: number
  commission: number
  swap: number
  spread: number
  grossPnL: number
  netPnL: number

  strategy: string
  executionTF?: string
  trendTF?: string
  confluences: string[]
  plannedRR?: number
  realizedRR?: number
  session?: "ASIAN" | "LONDON" | "NEW_YORK" | "OVERLAP" | "OVERLAP_LONDON_NY"

  preTradeEmotion?: "CONFIDENT" | "CALM" | "NEUTRAL" | "ANXIOUS" | "FOMO" | "REVENGE" | "IMPATIENT"
  emotionScore?: number
  postTradeEmotion?: string
  mistakes: string[]
  lessons?: string

  screenshots: ITradeScreenshot[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const tradeSchema = new Schema<ITrade>(
  {
    // ── Owner & Balance Snapshot ──────────────────────────────
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    balanceAtEntry: { type: Number },

    // ── §2.1 Execution (quantitative) ─────────────────────────
    instrument: { type: String, required: true, uppercase: true, trim: true },
    direction: { type: String, enum: ["LONG", "SHORT"], required: true },
    entryTime: { type: Date, required: true, default: Date.now },
    exitTime: { type: Date },
    entryPrice: { type: Number, required: true },
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    exitPrice: { type: Number },
    lotSize: { type: Number, default: 1.0 },
    riskPercent: { type: Number, min: 0, max: 10 },
    commission: { type: Number, default: 0 },
    swap: { type: Number, default: 0 },
    spread: { type: Number, default: 0 },
    grossPnL: { type: Number, default: 0 },
    netPnL: { type: Number, required: true },

    // ── §2.2 Setup & Strategy (qualitative) ───────────────────
    strategy: { type: String, required: true, trim: true },
    executionTF: { type: String, default: "15m" },
    trendTF: { type: String, default: "4h" },
    confluences: [{ type: String }],
    plannedRR: { type: Number, default: 0 },
    realizedRR: { type: Number, default: 0 },
    session: {
      type: String,
      enum: ["ASIAN", "LONDON", "NEW_YORK", "OVERLAP", "OVERLAP_LONDON_NY"],
      default: "LONDON",
    },

    // ── §3 Psychology & Media ─────────────────────────────────
    preTradeEmotion: {
      type: String,
      enum: ["CONFIDENT", "CALM", "NEUTRAL", "ANXIOUS", "FOMO", "REVENGE", "IMPATIENT"],
      default: "CONFIDENT",
    },
    emotionScore: { type: Number, min: 1, max: 5, default: 4 },
    postTradeEmotion: { type: String, default: "HELD_TO_TP" },
    mistakes: [{ type: String }],
    lessons: { type: String, default: "" },

    screenshots: [
      {
        label: { type: String },
        url: { type: String },
      },
    ],

    // ── Meta ──────────────────────────────────────────────────
    tags: [{ type: String }],
  },
  { timestamps: true }
)

// Compound user-scoped indexes for fast query performance
tradeSchema.index({ user: 1, exitTime: -1 })
tradeSchema.index({ user: 1, entryTime: -1 })
tradeSchema.index({ user: 1, instrument: 1, exitTime: -1 })
tradeSchema.index({ user: 1, strategy: 1 })
tradeSchema.index({ user: 1, session: 1 })
tradeSchema.index({ user: 1, mistakes: 1 })

if (process.env.NODE_ENV !== "production" && mongoose.models.Trade) {
  delete (mongoose.models as any).Trade
}

export const Trade: Model<ITrade> =
  mongoose.models.Trade || mongoose.model<ITrade>("Trade", tradeSchema)

