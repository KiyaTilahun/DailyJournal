import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { getSessionUser } from "@/lib/auth-utils"

export async function GET() {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Base match stage ensuring strict user isolation
    const userMatch = { $match: { user: user._id } }

    // 1. Overall Performance KPI aggregation (§8) scoped to user
    const perfAgg = await Trade.aggregate([
      userMatch,
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          wins: { $sum: { $cond: [{ $gt: ["$netPnL", 0] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $lt: ["$netPnL", 0] }, 1, 0] } },
          breakEvens: { $sum: { $cond: [{ $eq: ["$netPnL", 0] }, 1, 0] } },
          grossProfit: { $sum: { $max: ["$netPnL", 0] } },
          grossLoss: { $sum: { $abs: { $min: ["$netPnL", 0] } } },
          netPnL: { $sum: "$netPnL" },
          avgRR: { $avg: "$realizedRR" },
          expectancy: { $avg: "$netPnL" },
        },
      },
    ])

    const perf = perfAgg[0] || {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakEvens: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnL: 0,
      avgRR: 0,
      expectancy: 0,
    }

    const winRate =
      perf.totalTrades > 0 ? Number(((perf.wins / perf.totalTrades) * 100).toFixed(1)) : 0
    const profitFactor =
      perf.grossLoss > 0
        ? Number((perf.grossProfit / perf.grossLoss).toFixed(2))
        : perf.grossProfit > 0
        ? 99.9
        : 0

    // 2. Best/Worst Pairs (§4.3)
    const byPair = await Trade.aggregate([
      userMatch,
      {
        $group: {
          _id: "$instrument",
          pnl: { $sum: "$netPnL" },
          tradesCount: { $sum: 1 },
          winsCount: { $sum: { $cond: [{ $gt: ["$netPnL", 0] }, 1, 0] } },
        },
      },
      {
        $project: {
          pair: "$_id",
          netPnL: { $round: ["$pnl", 2] },
          tradesCount: 1,
          winRate: {
            $round: [
              {
                $multiply: [{ $divide: ["$winsCount", { $max: ["$tradesCount", 1] }] }, 100],
              },
              1,
            ],
          },
        },
      },
      { $sort: { netPnL: -1 } },
    ])

    // 3. Best/Worst Sessions (§4.3)
    const bySession = await Trade.aggregate([
      userMatch,
      {
        $group: {
          _id: "$session",
          pnl: { $sum: "$netPnL" },
          tradesCount: { $sum: 1 },
          winsCount: { $sum: { $cond: [{ $gt: ["$netPnL", 0] }, 1, 0] } },
        },
      },
      {
        $project: {
          session: "$_id",
          netPnL: { $round: ["$pnl", 2] },
          tradesCount: 1,
          winRate: {
            $round: [
              {
                $multiply: [{ $divide: ["$winsCount", { $max: ["$tradesCount", 1] }] }, 100],
              },
              1,
            ],
          },
        },
      },
      { $sort: { netPnL: -1 } },
    ])

    // 4. Mistakes Analysis (§4.4)
    const byMistake = await Trade.aggregate([
      userMatch,
      { $unwind: "$mistakes" },
      { $match: { mistakes: { $ne: "NONE" } } },
      {
        $group: {
          _id: "$mistakes",
          count: { $sum: 1 },
          totalLoss: {
            $sum: { $cond: [{ $lt: ["$netPnL", 0] }, { $abs: "$netPnL" }, 0] },
          },
        },
      },
      {
        $project: {
          mistake: "$_id",
          count: 1,
          totalLoss: { $round: ["$totalLoss", 2] },
        },
      },
      { $sort: { totalLoss: -1 } },
    ])

    return NextResponse.json({
      summary: {
        ...perf,
        winRate,
        profitFactor,
        avgRR: Number((perf.avgRR || 0).toFixed(2)),
        expectancy: Number((perf.expectancy || 0).toFixed(2)),
        currentBalance: user.accountBalance,
        accountCurrency: user.accountCurrency,
      },
      byPair,
      bySession,
      byMistake,
      balanceAdjustments: user.balanceAdjustments || [],
    })
  } catch (error: any) {
    console.error("GET /api/analytics error:", error)
    return NextResponse.json({ error: error.message || "Analytics calculation failed" }, { status: 500 })
  }
}
