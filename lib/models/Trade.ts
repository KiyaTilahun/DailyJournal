import mongoose, { Schema, Document, Model } from "mongoose"

export interface ITradeScreenshot {
  label: "ENTRY_TF" | "HTF_CONTEXT" | string
  url: string
}

export interface ITrade extends Document {
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
    riskPercent: { type: Number },
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

// Indexes defined in Section 6.2 of MongoDB Plan
tradeSchema.index({ exitTime: -1 })
tradeSchema.index({ instrument: 1, exitTime: -1 })
tradeSchema.index({ strategy: 1 })
tradeSchema.index({ session: 1 })
tradeSchema.index({ mistakes: 1 })
tradeSchema.index({ createdAt: -1 })

export const Trade: Model<ITrade> =
  mongoose.models.Trade || mongoose.model<ITrade>("Trade", tradeSchema)
