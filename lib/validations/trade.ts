import { z } from "zod"

export const tradeSchemaZod = z.object({
  instrument: z.string().min(1, "Instrument pair is required").toUpperCase(),
  direction: z.enum(["LONG", "SHORT"]),
  entryTime: z.string().or(z.date()).transform(val => new Date(val)),
  exitTime: z.string().or(z.date()).optional().transform(val => (val ? new Date(val) : undefined)),
  entryPrice: z.number().positive("Entry price must be positive"),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  exitPrice: z.number().optional(),
  lotSize: z.number().positive().default(1.0),
  riskPercent: z.number().optional(),
  commission: z.number().default(0),
  swap: z.number().default(0),
  spread: z.number().default(0),
  grossPnL: z.number().default(0),
  netPnL: z.number(),

  strategy: z.string().min(1, "Strategy is required"),
  executionTF: z.string().optional().default("15m"),
  trendTF: z.string().optional().default("4h"),
  confluences: z.array(z.string()).default([]),
  plannedRR: z.number().default(0),
  realizedRR: z.number().default(0),
  session: z.enum(["ASIAN", "LONDON", "NEW_YORK", "OVERLAP", "OVERLAP_LONDON_NY"]).default("LONDON"),

  preTradeEmotion: z
    .enum(["CONFIDENT", "CALM", "NEUTRAL", "ANXIOUS", "FOMO", "REVENGE", "IMPATIENT"])
    .default("CONFIDENT"),
  emotionScore: z.number().min(1).max(5).default(4),
  postTradeEmotion: z.string().optional().default("HELD_TO_TP"),
  mistakes: z.array(z.string()).default([]),
  lessons: z.string().default(""),

  screenshots: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      })
    )
    .default([]),
  tags: z.array(z.string()).default([]),
})

export type TradeInput = z.infer<typeof tradeSchemaZod>
