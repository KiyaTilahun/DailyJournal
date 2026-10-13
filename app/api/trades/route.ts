import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { tradeSchemaZod } from "@/lib/validations/trade"

export async function GET(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "MONGODB_URI not configured. Using client fallback." },
        { status: 503 }
      )
    }

    await connectDB()
    const { searchParams } = new URL(req.url)
    const filter: Record<string, any> = {}

    if (searchParams.get("instrument")) {
      filter.instrument = searchParams.get("instrument")!.toUpperCase()
    }
    if (searchParams.get("strategy")) {
      filter.strategy = searchParams.get("strategy")
    }
    if (searchParams.get("session")) {
      filter.session = searchParams.get("session")
    }
    if (searchParams.get("from")) {
      filter.entryTime = { $gte: new Date(searchParams.get("from")!) }
    }
    if (searchParams.get("to")) {
      filter.entryTime = { ...filter.entryTime, $lte: new Date(searchParams.get("to")!) }
    }

    const trades = await Trade.find(filter).sort({ entryTime: -1 }).limit(500).lean()
    return NextResponse.json(trades)
  } catch (error: any) {
    console.error("GET /api/trades error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch trades" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "MONGODB_URI not configured. Please set MONGODB_URI in .env.local" },
        { status: 503 }
      )
    }

    await connectDB()
    const rawBody = await req.json()
    const parseResult = tradeSchemaZod.safeParse(rawBody)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      )
    }

    const trade = await Trade.create(parseResult.data)
    return NextResponse.json(trade, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/trades error:", error)
    return NextResponse.json({ error: error.message || "Failed to create trade" }, { status: 500 })
  }
}
