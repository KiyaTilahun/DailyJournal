"use client"

import {
  Trade,
  TradingAccountSummary,
  PairPerformance,
  SessionPerformance,
  StrategyPerformance,
  MistakeAnalysis,
  TradeSession,
  StrategyType,
  MistakeTag
} from "./trading-types"
import { INITIAL_ACCOUNT_BALANCE, SAMPLE_TRADES } from "./seed-data"

const STORAGE_KEY = "forex_trading_journal_trades_v1"
const BALANCE_KEY = "forex_trading_journal_starting_balance_v1"

export function getInitialStartingBalance(): number {
  if (typeof window === "undefined") return INITIAL_ACCOUNT_BALANCE
  const saved = localStorage.getItem(BALANCE_KEY)
  if (!saved) return INITIAL_ACCOUNT_BALANCE
  const parsed = parseFloat(saved)
  return isNaN(parsed) ? INITIAL_ACCOUNT_BALANCE : parsed
}

export function saveStartingBalance(balance: number): void {
  if (typeof window === "undefined") return
  localStorage.setItem(BALANCE_KEY, balance.toString())
}

export function getStoredTrades(): Trade[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTrades(trades: Trade[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades))
}

export function addTrade(newTrade: Omit<Trade, "id" | "createdAt" | "updatedAt">): Trade {
  const current = getStoredTrades()
  const trade: Trade = {
    ...newTrade,
    id: `TRD-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  const updated = [trade, ...current]
  saveTrades(updated)
  return trade
}

export function updateTrade(id: string, updates: Partial<Trade>): Trade | null {
  const current = getStoredTrades()
  const index = current.findIndex(t => t.id === id)
  if (index === -1) return null
  const updatedTrade: Trade = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  current[index] = updatedTrade
  saveTrades([...current])
  return updatedTrade
}

export function deleteTrade(id: string): boolean {
  const current = getStoredTrades()
  const filtered = current.filter(t => t.id !== id)
  if (filtered.length === current.length) return false
  saveTrades(filtered)
  return true
}

export function resetToSeedData(): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  localStorage.setItem(BALANCE_KEY, INITIAL_ACCOUNT_BALANCE.toString())
}

// 4. Analytics Calculations Engine
export function computeAccountSummary(trades: Trade[], startingBalance: number = INITIAL_ACCOUNT_BALANCE): TradingAccountSummary {
  const totalTrades = trades.length
  if (totalTrades === 0) {
    return {
      startingBalance,
      currentBalance: startingBalance,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakEvens: 0,
      winRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: 0,
      netPnL: 0,
      expectancy: 0,
      averageRR: 0,
      maxDrawdownPercent: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      currentStreak: { type: "NONE", count: 0 }
    }
  }

  let wins = 0
  let losses = 0
  let breakEvens = 0
  let grossProfit = 0
  let grossLoss = 0
  let netPnL = 0
  let sumRealizedRR = 0

  // Chronological sort for equity curve & streaks
  const sorted = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())

  let runningBalance = startingBalance
  let peakBalance = startingBalance
  let maxDrawdown = 0

  let currentStreakType: "WIN" | "LOSS" | "NONE" = "NONE"
  let currentStreakCount = 0
  let maxWins = 0
  let maxLosses = 0
  let tempWins = 0
  let tempLosses = 0

  for (const t of sorted) {
    netPnL += t.netPnL
    sumRealizedRR += t.realizedRR

    if (t.netPnL > 0) {
      wins++
      grossProfit += t.grossPnL
      tempWins++
      tempLosses = 0
      if (tempWins > maxWins) maxWins = tempWins
    } else if (t.netPnL < 0) {
      losses++
      grossLoss += Math.abs(t.grossPnL)
      tempLosses++
      tempWins = 0
      if (tempLosses > maxLosses) maxLosses = tempLosses
    } else {
      breakEvens++
      tempWins = 0
      tempLosses = 0
    }

    runningBalance += t.netPnL
    if (runningBalance > peakBalance) {
      peakBalance = runningBalance
    } else {
      const drawdown = peakBalance > 0 ? ((peakBalance - runningBalance) / peakBalance) * 100 : 0
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }
  }

  // Calculate current streak from the latest trade backward
  const descSorted = [...trades].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
  if (descSorted.length > 0) {
    const firstTrade = descSorted[0]
    if (firstTrade.netPnL > 0) currentStreakType = "WIN"
    else if (firstTrade.netPnL < 0) currentStreakType = "LOSS"
    else currentStreakType = "NONE"

    for (const t of descSorted) {
      if (currentStreakType === "WIN" && t.netPnL > 0) currentStreakCount++
      else if (currentStreakType === "LOSS" && t.netPnL < 0) currentStreakCount++
      else break
    }
  }

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0
  const expectancy = totalTrades > 0 ? netPnL / totalTrades : 0
  const averageRR = totalTrades > 0 ? sumRealizedRR / totalTrades : 0

  return {
    startingBalance,
    currentBalance: runningBalance,
    totalTrades,
    wins,
    losses,
    breakEvens,
    winRate: Number(winRate.toFixed(1)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    netPnL: Number(netPnL.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    averageRR: Number(averageRR.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdown.toFixed(2)),
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
    currentStreak: {
      type: currentStreakType,
      count: currentStreakCount
    }
  }
}

export function computeEquityCurve(trades: Trade[], startingBalance: number = INITIAL_ACCOUNT_BALANCE) {
  const sorted = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
  let currentBalance = startingBalance
  let cumulativePnL = 0

  const points = [
    {
      date: "Start",
      balance: startingBalance,
      netPnL: 0,
      cumulativePnL: 0,
      tradeId: "INITIAL"
    }
  ]

  for (const trade of sorted) {
    currentBalance += trade.netPnL
    cumulativePnL += trade.netPnL
    const d = new Date(trade.exitDate || trade.entryDate)
    const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    points.push({
      date: `${formattedDate} (${trade.instrument})`,
      balance: Number(currentBalance.toFixed(2)),
      netPnL: trade.netPnL,
      cumulativePnL: Number(cumulativePnL.toFixed(2)),
      tradeId: trade.id
    })
  }

  return points
}

export function computePairPerformance(trades: Trade[]): PairPerformance[] {
  const map = new Map<string, { count: number; wins: number; pnl: number }>()

  for (const t of trades) {
    const item = map.get(t.instrument) || { count: 0, wins: 0, pnl: 0 }
    item.count++
    if (t.netPnL > 0) item.wins++
    item.pnl += t.netPnL
    map.set(t.instrument, item)
  }

  return Array.from(map.entries())
    .map(([pair, data]) => ({
      pair,
      tradesCount: data.count,
      winRate: Number(((data.wins / data.count) * 100).toFixed(1)),
      netPnL: Number(data.pnl.toFixed(2))
    }))
    .sort((a, b) => b.netPnL - a.netPnL)
}

export function computeSessionPerformance(trades: Trade[]): SessionPerformance[] {
  const sessions: TradeSession[] = ["LONDON", "NEW_YORK", "ASIAN", "OVERLAP_LONDON_NY"]
  return sessions.map(session => {
    const matching = trades.filter(t => t.session === session)
    const count = matching.length
    const wins = matching.filter(t => t.netPnL > 0).length
    const pnl = matching.reduce((acc, t) => acc + t.netPnL, 0)
    return {
      session,
      tradesCount: count,
      winRate: count > 0 ? Number(((wins / count) * 100).toFixed(1)) : 0,
      netPnL: Number(pnl.toFixed(2))
    }
  })
}

export function computeStrategyPerformance(trades: Trade[]): StrategyPerformance[] {
  const map = new Map<string, { count: number; wins: number; pnl: number; sumRR: number }>()

  for (const t of trades) {
    const item = map.get(t.strategy) || { count: 0, wins: 0, pnl: 0, sumRR: 0 }
    item.count++
    if (t.netPnL > 0) item.wins++
    item.pnl += t.netPnL
    item.sumRR += t.realizedRR
    map.set(t.strategy, item)
  }

  return Array.from(map.entries())
    .map(([strategy, data]) => ({
      strategy,
      tradesCount: data.count,
      winRate: Number(((data.wins / data.count) * 100).toFixed(1)),
      netPnL: Number(data.pnl.toFixed(2)),
      avgRR: Number((data.sumRR / data.count).toFixed(2))
    }))
    .sort((a, b) => b.netPnL - a.netPnL)
}

export function computeMistakeAnalysis(trades: Trade[]): MistakeAnalysis[] {
  const map = new Map<MistakeTag, { count: number; totalLoss: number }>()

  for (const t of trades) {
    if (t.mistakeTag && t.mistakeTag !== "NONE") {
      const item = map.get(t.mistakeTag) || { count: 0, totalLoss: 0 }
      item.count++
      if (t.netPnL < 0) {
        item.totalLoss += Math.abs(t.netPnL)
      }
      map.set(t.mistakeTag, item)
    }
  }

  return Array.from(map.entries())
    .map(([mistake, data]) => ({
      mistake,
      count: data.count,
      totalLoss: Number(data.totalLoss.toFixed(2))
    }))
    .sort((a, b) => b.totalLoss - a.totalLoss)
}

// 5.1 Exportability (CSV Export)
export function exportTradesToCSV(trades: Trade[]): string {
  const headers = [
    "Trade ID",
    "Instrument",
    "Direction",
    "Entry Date",
    "Exit Date",
    "Entry Price",
    "Stop Loss",
    "Take Profit",
    "Exit Price",
    "Lot Size",
    "Commissions",
    "Swaps",
    "Spread Cost",
    "Gross PnL",
    "Net PnL",
    "Planned R:R",
    "Realized R:R",
    "Status",
    "Strategy",
    "Execution TF",
    "Trend TF",
    "Session",
    "Pre-Trade Emotion",
    "Pre-Trade Confidence",
    "Post-Trade Emotion",
    "Mistake Tag",
    "Lessons Learned"
  ]

  const rows = trades.map(t => [
    t.id,
    t.instrument,
    t.direction,
    t.entryDate,
    t.exitDate,
    t.entryPrice,
    t.stopLossPrice,
    t.takeProfitPrice,
    t.exitPrice,
    t.lotSize,
    t.commissions,
    t.swaps,
    t.spreadCost,
    t.grossPnL,
    t.netPnL,
    t.plannedRR,
    t.realizedRR,
    t.status,
    t.strategy,
    t.executionTimeframe,
    t.trendTimeframe,
    t.session,
    t.preTradeEmotion,
    t.preTradeConfidence,
    t.postTradeEmotion,
    t.mistakeTag,
    `"${(t.lessonsLearned || "").replace(/"/g, '""')}"`
  ])

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
}

export function downloadCSV(trades: Trade[], filename: string = "forex_trades_export.csv") {
  const csvContent = exportTradesToCSV(trades)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
