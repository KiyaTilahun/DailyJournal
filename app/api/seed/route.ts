import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { Strategy } from "@/lib/models/Strategy"
import { SAMPLE_TRADES } from "@/lib/seed-data"

export async function POST() {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "MONGODB_URI is not defined in .env or .env.local" },
        { status: 503 }
      )
    }

    await connectDB()

    // 1. Ensure Strategies
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

    // 2. Clear & Seed Trades
    await Trade.deleteMany({})

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

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.length} trades and ${defaultStrategies.length} strategies into MongoDB.`,
      count: result.length,
    })
  } catch (error: any) {
    console.error("POST /api/seed error:", error)
    return NextResponse.json({ error: error.message || "Seeding failed" }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
