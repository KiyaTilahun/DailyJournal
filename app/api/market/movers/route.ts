import { NextResponse } from "next/server"
import { getMovers } from "@/lib/twelvedata"

export async function GET() {
  try {
    const movers = await getMovers()
    return NextResponse.json({ movers }, { status: 200 })
  } catch (error: any) {
    console.warn("GET /api/market/movers error:", error?.message)
    return NextResponse.json({ movers: { gainers: [], losers: [], timestamp: Date.now(), isStale: true } }, { status: 200 })
  }
}
