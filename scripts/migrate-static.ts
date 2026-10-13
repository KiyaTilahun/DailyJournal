import fs from "fs"
import path from "path"

// Automatically load .env.local or .env if not loaded by the runner
const envFiles = [".env.local", ".env"]
for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file)
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

import { connectDB } from "../lib/db"
import { Trade } from "../lib/models/Trade"
import { Strategy } from "../lib/models/Strategy"
import { SAMPLE_TRADES } from "../lib/seed-data"

async function main() {
  console.log("Checking MONGODB_URI:", process.env.MONGODB_URI ? "Found" : "Missing")
  console.log("Connecting to MongoDB...")
  await connectDB()
  console.log("Connected successfully to MongoDB.")

  // 1. Seed Default Strategies
  const defaultStrategies = [
    { name: "SMC_ORDER_BLOCK", description: "Smart Money Concepts Order Blocks & Liquidity" },
    { name: "LIQUIDITY_SWEEP", description: "Asian/London Liquidity Sweep & Shift" },
    { name: "SUPPLY_DEMAND", description: "Institutional Supply & Demand Zones" },
    { name: "BREAKOUT", description: "Range Breakout & Momentum Expansion" },
    { name: "TREND_PULLBACK", description: "Higher Timeframe Trend Retracement" },
    { name: "FAIR_VALUE_GAP", description: "Imbalance & Fair Value Gap fill" },
  ]

  for (const s of defaultStrategies) {
    await Strategy.findOneAndUpdate({ name: s.name }, s, { upsert: true, returnDocument: "after" })
  }
  console.log(`Ensured ${defaultStrategies.length} default strategies.`)

  // 2. Map and Seed Sample Trades
  const existingCount = await Trade.countDocuments()
  console.log(`Current trade documents in collection: ${existingCount}`)

  const mappedTrades = SAMPLE_TRADES.map(t => ({
    instrument: t.instrument,
    direction: t.direction,
    entryTime: new Date(t.entryDate),
    exitTime: t.exitDate ? new Date(t.exitDate) : undefined,
    entryPrice: t.entryPrice,
    stopLoss: t.stopLossPrice,
    takeProfit: t.takeProfitPrice,
    exitPrice: t.exitPrice,
    lotSize: t.lotSize,
    commission: t.commissions,
    swap: t.swaps,
    spread: t.spreadCost,
    grossPnL: t.grossPnL,
    netPnL: t.netPnL,
    plannedRR: t.plannedRR,
    realizedRR: t.realizedRR,
    strategy: t.strategy,
    executionTF: t.executionTimeframe,
    trendTF: t.trendTimeframe,
    session: t.session === "OVERLAP_LONDON_NY" ? "OVERLAP_LONDON_NY" : t.session,
    confluences: t.confluences,
    preTradeEmotion: t.preTradeEmotion,
    emotionScore: t.preTradeConfidence,
    postTradeEmotion: t.postTradeEmotion,
    mistakes: t.mistakeTag !== "NONE" ? [t.mistakeTag] : [],
    lessons: t.lessonsLearned,
    tags: t.tags,
  }))

  const result = await Trade.insertMany(mappedTrades, { ordered: false })
  console.log(`Successfully seeded ${result.length} trades into MongoDB!`)
  process.exit(0)
}

main().catch(err => {
  console.error("Migration/Seed failed:", err)
  process.exit(1)
})
