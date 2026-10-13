import { NextResponse } from "next/server"
import { getNews } from "@/lib/marketaux"
import { auth } from "@/auth"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"

export const revalidate = 3600 // 1 hour

/**
 * GET /api/market/news?symbols=XAU/USD,EUR/USD
 * Optional comma-separated symbol filter; default = user's open-trade instruments.
 * Cached 1h in MongoDB ApiCache.
 * On failure -> returns [] with 200 status for graceful UI degradation.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawSymbols = searchParams.get("symbols") || searchParams.get("symbol")
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    let symbols: string[] | undefined

    if (rawSymbols) {
      symbols = rawSymbols
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
    } else {
      // Default to user's open-trade instruments
      try {
        const session = await auth()
        if (session?.user?.id && isDbConfigured()) {
          await connectDB()
          const openTrades = await Trade.find({
            user: session.user.id,
            $or: [{ exitTime: { $exists: false } }, { exitTime: null }],
          }).distinct("instrument")

          if (openTrades && openTrades.length > 0) {
            symbols = openTrades
          }
        }
      } catch (err: any) {
        console.warn("Could not determine user open instruments for news default:", err?.message)
      }
    }

    const news = await getNews({ symbols, limit, ttlHours: 1.0 })
    return NextResponse.json(news || [], { status: 200 })
  } catch (error: any) {
    console.warn("GET /api/market/news error:", error?.message)
    return NextResponse.json([], { status: 200 })
  }
}
