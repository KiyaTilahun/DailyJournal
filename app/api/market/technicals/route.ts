import { NextResponse } from "next/server"
import { getTechnicals } from "@/lib/twelvedata"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get("symbol") || "EUR/USD"
    const rawIndicators = searchParams.get("indicators")

    const indicators = rawIndicators
      ? rawIndicators.split(",").map(i => i.trim().toLowerCase())
      : ["rsi", "ema", "atr"]

    const technicals = await getTechnicals(symbol, indicators)
    return NextResponse.json({ technicals }, { status: 200 })
  } catch (error: any) {
    console.warn("GET /api/market/technicals error:", error?.message)
    return NextResponse.json({ technicals: null }, { status: 200 })
  }
}
