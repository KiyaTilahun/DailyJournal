import { NextResponse } from "next/server"
import { getQuote } from "@/lib/twelvedata"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get("symbol") || "EUR/USD"

    const quote = await getQuote(symbol)
    if (!quote) {
      return NextResponse.json({ quote: null, error: "Quote unavailable" }, { status: 200 })
    }

    return NextResponse.json({ quote }, { status: 200 })
  } catch (error: any) {
    console.warn("GET /api/market/quote error:", error?.message)
    return NextResponse.json({ quote: null, error: "Failed to fetch quote" }, { status: 200 })
  }
}
