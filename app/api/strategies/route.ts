import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Strategy } from "@/lib/models/Strategy"

export async function GET() {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        [
          { name: "SMC_ORDER_BLOCK", description: "Smart Money Concepts Order Blocks", active: true },
          { name: "LIQUIDITY_SWEEP", description: "Asian/London Liquidity Sweep & Reversal", active: true },
          { name: "SUPPLY_DEMAND", description: "Institutional Supply & Demand Zones", active: true },
          { name: "BREAKOUT", description: "Range Breakout & Momentum Expansion", active: true },
          { name: "TREND_PULLBACK", description: "Higher Timeframe Trend Retracement", active: true },
          { name: "FAIR_VALUE_GAP", description: "Imbalance & Fair Value Gap fill", active: true },
        ]
      )
    }

    await connectDB()
    const strategies = await Strategy.find({ active: true }).sort({ name: 1 }).lean()
    return NextResponse.json(strategies)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch strategies" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI not configured" }, { status: 503 })
    }

    await connectDB()
    const { name, description } = await req.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Strategy name is required" }, { status: 400 })
    }

    const created = await Strategy.create({ name: name.trim(), description: description || "" })
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create strategy" }, { status: 500 })
  }
}
