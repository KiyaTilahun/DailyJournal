import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { ApiCache } from "@/lib/models/ApiCache"
import { getNews } from "@/lib/marketaux"

export const maxDuration = 30 // Allow up to 30s on Vercel Pro/Hobby
export const dynamic = "force-dynamic"

/**
 * Nightly News-Mistake Detector (Vercel Cron, 1x/day)
 * For each trade closed in the last 24h:
 * 1. Queries Marketaux with symbol = trade.instrument, date range = entryTime ± 3h, limit 5
 * 2. If any article has publishedAt within ±90min of entryTime -> stamps:
 *    newsAtEntry: true
 *    newsHeadline: "<title>"
 *    newsHeadlineAtEntry: "<title>"
 * 3. Keeps the job under ~10 Marketaux calls/day by batching symbols per user/run.
 * 4. Stores the cron result count in a log doc in apiCache for debugging.
 */
export async function GET(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    await connectDB()

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000)

    // Find trades closed in the last 24 hours (or entered recently with an exit)
    const closedTrades = await Trade.find({
      $or: [
        { exitTime: { $gte: twentyFourHoursAgo } },
        { exitPrice: { $ne: null }, updatedAt: { $gte: twentyFourHoursAgo } },
        { createdAt: { $gte: twentyFourHoursAgo } },
      ],
    }).limit(50)

    if (closedTrades.length === 0) {
      const emptyLog = {
        key: "cron_news_detector_log",
        payload: {
          runAt: new Date().toISOString(),
          message: "No trades closed in the last 24h",
          tradesScanned: 0,
          stampedTradesCount: 0,
          callsMade: 0,
        },
        credits: 0,
        fetchedAt: new Date(),
        ttlHours: 72,
        expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
      }
      await ApiCache.findOneAndUpdate({ key: "cron_news_detector_log" }, emptyLog, { upsert: true })
      return NextResponse.json({ message: "No recent closed trades in the last 24h", matches: 0 })
    }

    // Group trades by instrument to batch Marketaux calls and stay strictly under 10 calls/day
    const tradesByInstrument = new Map<string, typeof closedTrades>()
    for (const trade of closedTrades) {
      const inst = (trade.instrument || "").trim().toUpperCase()
      if (!inst) continue
      const list = tradesByInstrument.get(inst) || []
      list.push(trade)
      tradesByInstrument.set(inst, list)
    }

    // Cap at 10 distinct instruments max to respect 10 calls/day budget
    const instruments = Array.from(tradesByInstrument.keys()).slice(0, 10)
    let callsMade = 0
    let stampedTradesCount = 0
    const matchedLogDetails: Array<{ tradeId: string; instrument: string; headline: string }> = []

    for (const instrument of instruments) {
      const instTrades = tradesByInstrument.get(instrument) || []
      if (instTrades.length === 0) continue

      // Compute date window: earliest entry - 3h to latest entry + 3h
      const entryTimestamps = instTrades
        .map(t => (t.entryTime ? new Date(t.entryTime).getTime() : 0))
        .filter(ts => ts > 0)

      if (entryTimestamps.length === 0) continue

      const minEntry = Math.min(...entryTimestamps)
      const maxEntry = Math.max(...entryTimestamps)
      const publishedAfter = new Date(minEntry - 3 * 3600 * 1000).toISOString()
      const publishedBefore = new Date(maxEntry + 3 * 3600 * 1000).toISOString()

      // Query Marketaux (cached 24h as per PART 4 rules)
      callsMade++
      const articles = await getNews({
        symbols: [instrument],
        publishedAfter,
        publishedBefore,
        limit: 5,
        ttlHours: 24.0,
      })

      // Corroborate each trade: publishedAt within ±90min of entryTime
      for (const trade of instTrades) {
        const entryTimeMs = trade.entryTime ? new Date(trade.entryTime).getTime() : 0
        if (!entryTimeMs) continue

        const matchingArticle = articles.find(art => {
          const artTimeMs = new Date(art.publishedAt).getTime()
          const diffMinutes = Math.abs(artTimeMs - entryTimeMs) / (60 * 1000)
          return diffMinutes <= 90 // Within ±90min
        })

        if (matchingArticle) {
          trade.newsAtEntry = true
          trade.newsHeadline = matchingArticle.title
          trade.newsHeadlineAtEntry = matchingArticle.title
          await trade.save()

          stampedTradesCount++
          matchedLogDetails.push({
            tradeId: String(trade._id),
            instrument: trade.instrument,
            headline: matchingArticle.title,
          })
        }
      }
    }

    // Store the cron result count in a log doc in MongoDB for debugging
    const logDoc = {
      key: "cron_news_detector_log",
      payload: {
        runAt: new Date().toISOString(),
        tradesScanned: closedTrades.length,
        instrumentsBatched: instruments.length,
        callsMade,
        stampedTradesCount,
        matchedDetails: matchedLogDetails,
      },
      credits: callsMade,
      fetchedAt: new Date(),
      ttlHours: 72,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
    }
    await ApiCache.findOneAndUpdate({ key: "cron_news_detector_log" }, logDoc, { upsert: true })

    return NextResponse.json({
      success: true,
      tradesScanned: closedTrades.length,
      callsMade,
      stampedTradesCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.warn("Cron /api/cron/news-detector error:", error?.message)
    return NextResponse.json({ error: error?.message || "Cron job failed" }, { status: 500 })
  }
}
