export type TradeDirection = "LONG" | "SHORT"

export type TradeSession = "ASIAN" | "LONDON" | "NEW_YORK" | "OVERLAP_LONDON_NY"

export type TradeStatus = "WIN" | "LOSS" | "BE" // Break-Even

export type PreTradeEmotion = "CONFIDENT" | "CALM" | "FOMO" | "ANXIOUS" | "REVENGE" | "IMPATIENT" | "NEUTRAL"

export type PostTradeEmotion = 
  | "HELD_TO_TP" 
  | "CLOSED_EARLY_FEAR" 
  | "MOVED_SL_TO_BE" 
  | "WIDENED_SL" 
  | "DISCIPLINED_EXIT" 
  | "PANIC_EXIT"

export type MistakeTag = 
  | "NONE"
  | "OVER_LEVERAGED" 
  | "IGNORED_NEWS" 
  | "CHASED_PRICE" 
  | "EARLY_EXIT" 
  | "REVENGE_TRADING" 
  | "NO_STOP_LOSS" 
  | "TRADED_OUTSIDE_PLAN"

export type StrategyType = 
  | "BREAKOUT" 
  | "SUPPLY_DEMAND" 
  | "SMC_ORDER_BLOCK" 
  | "LIQUIDITY_SWEEP" 
  | "TREND_PULLBACK" 
  | "FAIR_VALUE_GAP"

export interface Trade {
  id: string
  // 2.1 Execution Data (Quantitative)
  instrument: string // e.g. "EUR/USD", "GBP/JPY", "XAU/USD", "USD/JPY", "AUD/USD"
  direction: TradeDirection
  entryDate: string // ISO string
  exitDate: string // ISO string
  entryPrice: number
  stopLossPrice: number
  takeProfitPrice: number
  exitPrice: number
  lotSize: number
  commissions: number
  swaps: number
  spreadCost: number
  grossPnL: number
  netPnL: number
  plannedRR: number
  realizedRR: number
  status: TradeStatus

  // 2.2 Setup & Strategy (Qualitative)
  strategy: StrategyType
  executionTimeframe: "1m" | "5m" | "15m" | "30m" | "1h"
  trendTimeframe: "1h" | "4h" | "Daily" | "Weekly"
  session: TradeSession
  confluences: string[] // e.g. ["4H HTF Bias", "Order Block Retest", "London Open Volume", "RSI Divergence"]

  // 3.1 Psychology & Media
  preTradeEmotion: PreTradeEmotion
  preTradeConfidence: number // 1 to 5
  postTradeEmotion: PostTradeEmotion
  mistakeTag: MistakeTag
  lessonsLearned: string
  entryScreenshotUrl?: string
  htfScreenshotUrl?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface TradingAccountSummary {
  startingBalance: number
  currentBalance: number
  totalTrades: number
  wins: number
  losses: number
  breakEvens: number
  winRate: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  netPnL: number
  expectancy: number
  averageRR: number
  maxDrawdownPercent: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  currentStreak: {
    type: "WIN" | "LOSS" | "NONE"
    count: number
  }
}

export interface PairPerformance {
  pair: string
  tradesCount: number
  winRate: number
  netPnL: number
}

export interface SessionPerformance {
  session: TradeSession
  tradesCount: number
  winRate: number
  netPnL: number
}

export interface StrategyPerformance {
  strategy: StrategyType
  tradesCount: number
  winRate: number
  netPnL: number
  avgRR: number
}

export interface MistakeAnalysis {
  mistake: MistakeTag
  count: number
  totalLoss: number
}
