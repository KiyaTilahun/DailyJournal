import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { tradeSchemaZod } from "@/lib/validations/trade"
import { getSessionUser } from "@/lib/auth-utils"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { id } = await context.params
    const trade = await Trade.findOne({ _id: id, user: user._id }).lean()

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    return NextResponse.json(trade)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch trade" }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { id } = await context.params
    const rawBody = await req.json()
    const parseResult = tradeSchemaZod.partial().safeParse(rawBody)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      )
    }

    const existingTrade = await Trade.findOne({ _id: id, user: user._id })
    if (!existingTrade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    // Sync account balance difference if netPnL was adjusted
    if (parseResult.data.netPnL !== undefined && parseResult.data.netPnL !== existingTrade.netPnL) {
      const delta = parseResult.data.netPnL - existingTrade.netPnL
      user.accountBalance += delta
      await user.save()
    }

    Object.assign(existingTrade, parseResult.data)
    await existingTrade.save()

    return NextResponse.json(existingTrade)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update trade" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { id } = await context.params
    const trade = await Trade.findOne({ _id: id, user: user._id })

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    // Reverse PnL from user balance
    if (typeof trade.netPnL === "number") {
      user.accountBalance -= trade.netPnL
      await user.save()
    }

    await Trade.deleteOne({ _id: id, user: user._id })

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete trade" }, { status: 500 })
  }
}
