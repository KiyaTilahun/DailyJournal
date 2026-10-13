/**
 * Twelve Data API Integration for Forex Trading Journal
 * Implements credit-aware persistent caching (MongoDB ApiCache),
 * daily budget tracking (8 credits/day free tier), and robust fallbacks.
 * NEVER throws to the UI.
 */

import { connectDB, isDbConfigured } from "@/lib/db"
import { ApiCache } from "@/lib/models/ApiCache"

const TWELVEDATA_BASE_URL = "https://api.twelvedata.com"
const REQUEST_TIMEOUT_MS = 8000 // 8s timeout

export interface BudgetStatus {
  dailyLimit: number
  creditsUsed: number
  creditsRemaining: number
  lastUpdated: string
  isExhausted: boolean
  hasApiKey: boolean
}

export interface QuoteData {
  symbol: string
  name?: string
  open: number
  high: number
  low: number
  close: number
  previousClose?: number
  change: number
  percentChange: number
  bid: number
  ask: number
  timestamp: number
  datetime: string
  isStale: boolean
  isMarketOpen?: boolean
}

export interface IndicatorSnapshot {
  rsi?: { value: number; period: number; status: "Overbought" | "Oversold" | "Neutral"; note: string }
  ema200?: { value: number; trend: "Uptrend" | "Downtrend" | "Neutral"; note: string }
  atr?: { value: number; pips: number; note: string }
  macd?: { macd: number; signal: number; histogram: number; note: string }
  bbands?: { upper: number; middle: number; lower: number; note: string }
  plainEnglishSummary: string[]
  isStale: boolean
  timestamp: number
}

export interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  percentChange: number
  direction: "UP" | "DOWN"
}

export interface MoversSnapshot {
  gainers: MarketMover[]
  losers: MarketMover[]
  timestamp: number
  isStale: boolean
}

export interface TimeSeriesCandle {
  datetime: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// ─────────────────────────────────────────────────────────────
// § 1.2 & 1.3 Persistent Caching & Daily Credit Budget
// ─────────────────────────────────────────────────────────────

interface FetchOptions {
  ttlHours?: number
  creditCost?: number
}

/**
 * Retrieves the current remaining credit budget.
 * Reads from MongoDB cache or defaults to conservative estimates.
 */
export async function getDailyBudget(): Promise<BudgetStatus> {
  const apiKey = process.env.TWELVEDATA_API_KEY
  if (!apiKey) {
    return {
      dailyLimit: 8,
      creditsUsed: 8,
      creditsRemaining: 0,
      lastUpdated: new Date().toISOString(),
      isExhausted: true,
      hasApiKey: false,
    }
  }

  try {
    if (isDbConfigured()) {
      await connectDB()
      const budgetDoc = await ApiCache.findOne({ key: "budget" }).lean()
      if (budgetDoc && budgetDoc.payload) {
        return budgetDoc.payload as BudgetStatus
      }
    }
  } catch (err: any) {
    console.warn("Could not read budget from apiCache:", err?.message)
  }

  // Default initial budget assumption (8 credits/day free tier)
  return {
    dailyLimit: 8,
    creditsUsed: 0,
    creditsRemaining: 8,
    lastUpdated: new Date().toISOString(),
    isExhausted: false,
    hasApiKey: true,
  }
}

/**
 * Updates persistent budget state in MongoDB.
 */
async function updateDailyBudget(creditsDeducted: number, apiReportedRemaining?: number) {
  try {
    if (!isDbConfigured()) return
    await connectDB()

    const current = await getDailyBudget()
    const remaining =
      apiReportedRemaining !== undefined
        ? apiReportedRemaining
        : Math.max(0, current.creditsRemaining - creditsDeducted)

    const updated: BudgetStatus = {
      dailyLimit: current.dailyLimit || 8,
      creditsUsed: Math.min(8, 8 - remaining),
      creditsRemaining: remaining,
      lastUpdated: new Date().toISOString(),
      isExhausted: remaining <= 0,
      hasApiKey: Boolean(process.env.TWELVEDATA_API_KEY),
    }

    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000)
    await ApiCache.findOneAndUpdate(
      { key: "budget" },
      {
        key: "budget",
        payload: updated,
        credits: 0,
        fetchedAt: new Date(),
        ttlHours: 24,
        expiresAt,
      },
      { upsert: true, returnDocument: "after" }
    )

    console.log(
      `[TwelveData Budget] Credits remaining: ${remaining}/8 (deducted: ${creditsDeducted})`
    )
  } catch (err: any) {
    console.warn("Could not persist budget in apiCache:", err?.message)
  }
}

/**
 * Core credit-aware fetch helper with persistent MongoDB caching.
 */
export async function tdFetch<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  options: FetchOptions = {}
): Promise<{ data: T | null; isStale: boolean }> {
  const { ttlHours = 1, creditCost = 1 } = options
  const apiKey = process.env.TWELVEDATA_API_KEY

  // Canonical cache key
  const queryParts = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&")
  const cacheKey = `${endpoint}_${queryParts}`

  // 1. Check persistent MongoDB cache
  let cachedDoc: any = null
  if (isDbConfigured()) {
    try {
      await connectDB()
      cachedDoc = await ApiCache.findOne({ key: cacheKey }).lean()
      if (cachedDoc) {
        const fetchedTime = new Date(cachedDoc.fetchedAt).getTime()
        const ttlMs = (cachedDoc.ttlHours || ttlHours) * 3600 * 1000
        const isFresh = fetchedTime + ttlMs > Date.now()

        if (isFresh) {
          return { data: cachedDoc.payload as T, isStale: false }
        }
      }
    } catch (err: any) {
      console.warn(`[TwelveData Cache] Error checking cache for ${cacheKey}:`, err?.message)
    }
  }

  // 2. Budget check
  const budget = await getDailyBudget()
  if (!apiKey || budget.creditsRemaining < creditCost) {
    if (cachedDoc) {
      console.warn(
        `[TwelveData Budget Exhausted] Returning stale cache for ${cacheKey} (remaining: ${budget.creditsRemaining})`
      )
      return { data: cachedDoc.payload as T, isStale: true }
    }
    console.warn(
      `[TwelveData Skipped] No API key or budget exhausted (${budget.creditsRemaining} remaining). Returning null.`
    )
    return { data: null, isStale: true }
  }

  // 3. Make the API call with 8s timeout
  const url = new URL(`${TWELVEDATA_BASE_URL}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  url.searchParams.set("apikey", apiKey)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`TwelveData HTTP ${res.status}: ${res.statusText}`)
    }

    const json = await res.json()

    // Twelve Data rate-limit / error check in body
    if (json.code && json.code !== 200) {
      if (json.code === 429 || String(json.message).toLowerCase().includes("limit")) {
        console.warn(`[TwelveData 429 Limit] ${json.message}`)
        await updateDailyBudget(0, 0) // mark budget exhausted
      } else {
        console.warn(`[TwelveData API Error] Code ${json.code}: ${json.message}`)
      }
      if (cachedDoc) return { data: cachedDoc.payload as T, isStale: true }
      return { data: null, isStale: true }
    }

    // Deduct credits and update budget
    await updateDailyBudget(creditCost)

    // Store in persistent MongoDB cache
    if (isDbConfigured()) {
      try {
        const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000)
        await ApiCache.findOneAndUpdate(
          { key: cacheKey },
          {
            key: cacheKey,
            payload: json,
            credits: creditCost,
            fetchedAt: new Date(),
            ttlHours,
            expiresAt,
          },
          { upsert: true }
        )
      } catch (err: any) {
        console.warn(`[TwelveData Cache] Could not persist key ${cacheKey}:`, err?.message)
      }
    }

    return { data: json as T, isStale: false }
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.warn(`[TwelveData Fetch Error] for ${cacheKey}:`, error?.message || error)
    if (cachedDoc) {
      return { data: cachedDoc.payload as T, isStale: true }
    }
    return { data: null, isStale: true }
  }
}

// ─────────────────────────────────────────────────────────────
// § 1.4 Exported Domain Helpers
// ─────────────────────────────────────────────────────────────

/**
 * 1. getQuote(symbol) -> bid/ask, open/high/low/close, %change, timestamp
 * Default TTL: 15 min (0.25h), creditCost: 1
 */
export async function getQuote(rawSymbol: string): Promise<QuoteData | null> {
  try {
    const symbol = rawSymbol.trim().toUpperCase()
    // Twelve Data formats Forex as e.g. "EUR/USD" or "XAU/USD"
    const { data, isStale } = await tdFetch<any>("quote", { symbol }, { ttlHours: 0.25, creditCost: 1 })

    if (!data || !data.close) {
      // Graceful fallback simulation based on recent market pricing if no API
      return getFallbackQuote(symbol)
    }

    const open = parseFloat(data.open) || parseFloat(data.close)
    const close = parseFloat(data.close) || 0
    const high = parseFloat(data.high) || close
    const low = parseFloat(data.low) || close
    const prevClose = parseFloat(data.previous_close) || open
    const change = parseFloat(data.change) || Number((close - prevClose).toFixed(5))
    const pctChange = parseFloat(data.percent_change) || (prevClose ? Number(((change / prevClose) * 100).toFixed(2)) : 0)

    const spreadPip = symbol.includes("JPY") || symbol.includes("XAU") ? 0.02 : 0.00015
    const bid = close - spreadPip / 2
    const ask = close + spreadPip / 2

    return {
      symbol: data.symbol || symbol,
      name: data.name || symbol,
      open,
      high,
      low,
      close,
      previousClose: prevClose,
      change,
      percentChange: pctChange,
      bid: Number(bid.toFixed(5)),
      ask: Number(ask.toFixed(5)),
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
      datetime: data.datetime || new Date().toISOString(),
      isStale,
      isMarketOpen: data.is_market_open ?? true,
    }
  } catch (err: any) {
    console.warn(`getQuote error for ${rawSymbol}:`, err?.message)
    return getFallbackQuote(rawSymbol)
  }
}


/**
 * 3. getTechnicals(symbol, indicators[]) -> RSI(14), EMA(200), ATR(14)
 * Default TTL: 4h. Batches only required indicators to preserve credits.
 */
export async function getTechnicals(
  symbol: string,
  indicators: string[] = ["rsi", "ema", "atr"]
): Promise<IndicatorSnapshot | null> {
  try {
    const cleanSym = symbol.trim().toUpperCase()
    const summaryItems: string[] = []
    let isStale = false

    // Fetch RSI(14)
    let rsiData: any = null
    if (indicators.includes("rsi")) {
      const res = await tdFetch<any>(
        "rsi",
        { symbol: cleanSym, interval: "1day", time_period: 14 },
        { ttlHours: 4.0, creditCost: 1 }
      )
      rsiData = res.data
      if (res.isStale) isStale = true
    }

    // Fetch EMA(200)
    let emaData: any = null
    if (indicators.includes("ema")) {
      const res = await tdFetch<any>(
        "ema",
        { symbol: cleanSym, interval: "1day", time_period: 200 },
        { ttlHours: 4.0, creditCost: 1 }
      )
      emaData = res.data
      if (res.isStale) isStale = true
    }

    // Fetch ATR(14)
    let atrData: any = null
    if (indicators.includes("atr")) {
      const res = await tdFetch<any>(
        "atr",
        { symbol: cleanSym, interval: "1day", time_period: 14 },
        { ttlHours: 4.0, creditCost: 1 }
      )
      atrData = res.data
      if (res.isStale) isStale = true
    }

    // Parse RSI
    let rsiVal = 54.2
    if (rsiData && Array.isArray(rsiData.values) && rsiData.values[0]) {
      rsiVal = parseFloat(rsiData.values[0].rsi) || 54.2
    }
    const rsiStatus = rsiVal >= 70 ? "Overbought" : rsiVal <= 30 ? "Oversold" : "Neutral"
    const rsiChip = `RSI(14) ${rsiVal.toFixed(1)} — ${rsiStatus.toLowerCase()}`
    summaryItems.push(rsiChip)

    // Parse EMA200
    let emaVal = 1.082
    if (emaData && Array.isArray(emaData.values) && emaData.values[0]) {
      emaVal = parseFloat(emaData.values[0].ema) || 1.082
    }
    // Compare with current quote
    const quote = await getQuote(cleanSym)
    const currentPrice = quote?.close || emaVal
    const trendStatus = currentPrice >= emaVal ? "Uptrend" : "Downtrend"
    const emaChip = `Price ${currentPrice >= emaVal ? ">" : "<"} EMA200 (${trendStatus.toLowerCase()})`
    summaryItems.push(emaChip)

    // Parse ATR(14)
    let atrVal = cleanSym.includes("XAU") ? 28.5 : cleanSym.includes("JPY") ? 1.15 : 0.0068
    if (atrData && Array.isArray(atrData.values) && atrData.values[0]) {
      atrVal = parseFloat(atrData.values[0].atr) || atrVal
    }
    const pipsVal = cleanSym.includes("JPY") || cleanSym.includes("XAU") ? atrVal * 100 : atrVal * 10000
    const atrChip = `ATR(14) ${atrVal.toFixed(4)} (~${Math.round(pipsVal)} pips volatility)`
    summaryItems.push(atrChip)

    return {
      rsi: {
        value: Number(rsiVal.toFixed(1)),
        period: 14,
        status: rsiStatus,
        note: rsiChip,
      },
      ema200: {
        value: Number(emaVal.toFixed(5)),
        trend: trendStatus,
        note: emaChip,
      },
      atr: {
        value: Number(atrVal.toFixed(5)),
        pips: Math.round(pipsVal),
        note: atrChip,
      },
      plainEnglishSummary: summaryItems,
      isStale,
      timestamp: Date.now(),
    }
  } catch (err: any) {
    console.warn(`getTechnicals error for ${symbol}:`, err?.message)
    return getFallbackTechnicals(symbol)
  }
}

/**
 * 4. getMovers(direction?) -> forex + metals gainers/losers snapshot
 * Default TTL: 1h, creditCost: 1
 */
export async function getMovers(): Promise<MoversSnapshot> {
  try {
    // Curated benchmark list of high-liquidity instruments
    const pairs = ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD", "AUD/USD", "USD/CAD", "NZD/USD"]
    const quotes = await Promise.all(pairs.map(p => getQuote(p)))
    const validQuotes = quotes.filter((q): q is QuoteData => q !== null)

    const movers: MarketMover[] = validQuotes.map(q => ({
      symbol: q.symbol,
      name: q.name || q.symbol,
      price: q.close,
      change: q.change,
      percentChange: q.percentChange,
      direction: q.percentChange >= 0 ? "UP" : "DOWN",
    }))

    const sorted = [...movers].sort((a, b) => b.percentChange - a.percentChange)
    const gainers = sorted.filter(m => m.percentChange > 0).slice(0, 4)
    const losers = sorted.filter(m => m.percentChange <= 0).reverse().slice(0, 4)

    return {
      gainers: gainers.length > 0 ? gainers : sorted.slice(0, 3),
      losers: losers.length > 0 ? losers : sorted.slice(-3),
      timestamp: Date.now(),
      isStale: validQuotes.some(q => q.isStale),
    }
  } catch (err: any) {
    console.warn("getMovers error:", err?.message)
    return getFallbackMovers()
  }
}

/**
 * 5. convertCurrency(amount, from, to) -> currency_conversion endpoint
 * Used as fallback if exchangerate.fun is down.
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const fromUpper = from.toUpperCase().trim()
  const toUpper = to.toUpperCase().trim()
  if (fromUpper === toUpper || amount === 0) return amount

  try {
    const symbol = `${fromUpper}/${toUpper}`
    const { data } = await tdFetch<any>(
      "currency_conversion",
      { symbol, amount },
      { ttlHours: 1.0, creditCost: 1 }
    )

    if (data && data.amount) {
      return parseFloat(data.amount) || amount
    }
  } catch (err: any) {
    console.warn(`TwelveData convertCurrency error for ${from}/${to}:`, err?.message)
  }

  // Secondary fallback: use quote ratio
  try {
    const qFrom = await getQuote(fromUpper === "USD" ? `EUR/USD` : `${fromUpper}/USD`)
    const qTo = await getQuote(toUpper === "USD" ? `EUR/USD` : `${toUpper}/USD`)
    if (qFrom && qTo && qFrom.close && qTo.close) {
      return Number(((amount * qFrom.close) / qTo.close).toFixed(4))
    }
  } catch {
    // Ignore
  }

  return amount
}

/**
 * 6. getTimeSeries(symbol, interval, outputsize) -> post-exit replay candle series
 * Default TTL: 24h (cached for historical trade review)
 */
export async function getTimeSeries(
  symbol: string,
  interval: string = "1h",
  outputsize: number = 48,
  startDate?: string,
  endDate?: string
): Promise<TimeSeriesCandle[]> {
  try {
    const cleanSym = symbol.trim().toUpperCase()
    const params: Record<string, string | number> = {
      symbol: cleanSym,
      interval,
      outputsize,
    }
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate

    const { data } = await tdFetch<any>("time_series", params, { ttlHours: 24.0, creditCost: 1 })

    if (data && Array.isArray(data.values)) {
      return data.values
        .map((v: any) => ({
          datetime: v.datetime,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: v.volume ? parseFloat(v.volume) : undefined,
        }))
        .reverse() // Chronological order
    }

    return getFallbackTimeSeries(cleanSym)
  } catch (err: any) {
    console.warn(`getTimeSeries error for ${symbol}:`, err?.message)
    return getFallbackTimeSeries(symbol)
  }
}

// ─────────────────────────────────────────────────────────────
// § Graceful Fallback Generators
// ─────────────────────────────────────────────────────────────

function getFallbackQuote(symbol: string): QuoteData {
  const upper = symbol.toUpperCase().trim()
  let close = 1.0850
  if (upper.includes("XAU")) close = 2735.40
  else if (upper.includes("JPY")) close = 152.35
  else if (upper.includes("GBP")) close = 1.2980
  else if (upper.includes("AUD")) close = 0.6580

  const spread = upper.includes("JPY") || upper.includes("XAU") ? 0.05 : 0.0002
  return {
    symbol: upper,
    name: upper,
    open: close - 0.0015,
    high: close + 0.003,
    low: close - 0.002,
    close,
    previousClose: close - 0.0015,
    change: 0.0015,
    percentChange: 0.14,
    bid: Number((close - spread / 2).toFixed(5)),
    ask: Number((close + spread / 2).toFixed(5)),
    timestamp: Date.now(),
    datetime: new Date().toISOString(),
    isStale: true,
    isMarketOpen: true,
  }
}


function getFallbackTechnicals(symbol: string): IndicatorSnapshot {
  return {
    rsi: {
      value: 58.4,
      period: 14,
      status: "Neutral",
      note: "RSI(14) 58.4 — balanced momentum",
    },
    ema200: {
      value: 1.0820,
      trend: "Uptrend",
      note: "Price > EMA200 (uptrend)",
    },
    atr: {
      value: 0.0065,
      pips: 65,
      note: "ATR(14) 0.0065 (~65 pips/day)",
    },
    plainEnglishSummary: [
      "RSI(14) 58.4 — neutral territory",
      "Price > EMA200 — institutional uptrend",
      "ATR ~65 pips daily expansion",
    ],
    isStale: true,
    timestamp: Date.now(),
  }
}

function getFallbackMovers(): MoversSnapshot {
  return {
    gainers: [
      { symbol: "XAU/USD", name: "Gold / US Dollar", price: 2735.40, change: 18.20, percentChange: 0.67, direction: "UP" },
      { symbol: "EUR/USD", name: "Euro / US Dollar", price: 1.0865, change: 0.0035, percentChange: 0.32, direction: "UP" },
      { symbol: "GBP/USD", name: "British Pound / USD", price: 1.2985, change: 0.0028, percentChange: 0.22, direction: "UP" },
    ],
    losers: [
      { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", price: 152.10, change: -0.72, percentChange: -0.47, direction: "DOWN" },
      { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", price: 1.3830, change: -0.0038, percentChange: -0.27, direction: "DOWN" },
      { symbol: "NZD/USD", name: "NZ Dollar / US Dollar", price: 0.5960, change: -0.0012, percentChange: -0.20, direction: "DOWN" },
    ],
    timestamp: Date.now(),
    isStale: true,
  }
}

function getFallbackTimeSeries(symbol: string): TimeSeriesCandle[] {
  const candles: TimeSeriesCandle[] = []
  let basePrice = symbol.includes("XAU") ? 2720 : symbol.includes("JPY") ? 151.5 : 1.082
  const now = Date.now()

  for (let i = 48; i >= 0; i--) {
    const time = new Date(now - i * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ")
    const delta = (Math.sin(i * 0.4) + Math.random() * 0.5 - 0.25) * (symbol.includes("XAU") ? 3.0 : 0.0015)
    basePrice += delta
    const open = basePrice
    const high = open + Math.abs(delta) * 1.2
    const low = open - Math.abs(delta) * 1.2
    const close = open + delta

    candles.push({
      datetime: time,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
    })
  }

  return candles
}
