import { NextResponse } from "next/server"
import { getTimeSeries } from "@/lib/twelvedata"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get("symbol") || "EUR/USD"
    const interval = searchParams.get("interval") || "1h"
    const outputsize = parseInt(searchParams.get("outputsize") || "48", 10)
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined

    const candles = await getTimeSeries(symbol, interval, outputsize, startDate, endDate)
    return NextResponse.json({ candles }, { status: 200 })
  } catch (error: any) {
    console.warn("GET /api/market/timeseries error:", error?.message)
    return NextResponse.json({ candles: [] }, { status: 200 })
  }
}
