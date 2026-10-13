import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { tradeSchemaZod } from "@/lib/validations/trade"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI not configured" }, { status: 503 })
    }

    await connectDB()
    const { id } = await context.params
    const trade = await Trade.findById(id).lean()

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
      return NextResponse.json({ error: "MONGODB_URI not configured" }, { status: 503 })
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

    const updated = await Trade.findByIdAndUpdate(id, parseResult.data, {
      returnDocument: "after",
      runValidators: true,
    }).lean()

    if (!updated) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update trade" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI not configured" }, { status: 503 })
    }

    await connectDB()
    const { id } = await context.params
    const deleted = await Trade.findByIdAndDelete(id).lean()

    if (!deleted) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete trade" }, { status: 500 })
  }
}
