import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { tradeSchemaZod } from "@/lib/validations/trade"
import { getSessionUser } from "@/lib/auth-utils"

export async function GET(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = new URL(req.url)

    // Strictly user-scoped filter
    const filter: Record<string, any> = {
      user: user._id,
    }

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

    const trades = await Trade.find(filter).sort({ entryTime: -1 }).limit(1000).lean()
    return NextResponse.json(trades)
  } catch (error: any) {
    console.error("GET /api/trades error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch trades" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const tradeData = {
      ...parseResult.data,
      user: user._id,
      balanceAtEntry: user.accountBalance, // Stamp snapshot of account balance at trade entry
    }

    const trade = await Trade.create(tradeData)

    // If trade is closed (has netPnL), update user's account balance
    if (typeof trade.netPnL === "number") {
      user.accountBalance += trade.netPnL
      await user.save()
    }

    return NextResponse.json(trade, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/trades error:", error)
    return NextResponse.json({ error: error.message || "Failed to create trade" }, { status: 500 })
  }
}
