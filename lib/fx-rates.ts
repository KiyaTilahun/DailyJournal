/**
 * Live FX & Gold Rates via exchangerate.fun
 * Provides server-side cached rates with 6h TTL (21600s), cross-rate conversions,
 * and graceful fallback.
 */

export interface GoldRatesResponse {
  timestamp: number
  base: string // "XAU"
  rates: Record<string, number>
}

// Fallback rates if exchangerate.fun is unreachable
export const FALLBACK_XAU_RATES: Record<string, number> = {
  USD: 2750.00,
  EUR: 2530.00,
  GBP: 2110.00,
  JPY: 418000.00,
  AUD: 4120.00,
  CAD: 3800.00,
  CHF: 2420.00,
  NZD: 4550.00,
}

export const FALLBACK_GOLD_USD_PRICE = 2750.00

interface MemoryCacheEntry {
  data: GoldRatesResponse
  cachedAt: number
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours (21600 seconds)
let inMemoryCache: MemoryCacheEntry | null = null

/**
 * Fetches latest gold rates with in-memory 6h cache and Vercel fetch revalidate of 21600s.
 * Gracefully falls back to hardcoded rates if the API fails, logging a console.warn.
 */
export async function getGoldRates(): Promise<GoldRatesResponse> {
  const now = Date.now()

  // 1. Check in-memory cache
  if (inMemoryCache && now - inMemoryCache.cachedAt < CACHE_TTL_MS) {
    return inMemoryCache.data
  }

  // 2. Fetch from exchangerate.fun
  try {
    const res = await fetch("https://api.exchangerate.fun/latest?base=XAU", {
      next: { revalidate: 21600 },
      headers: {
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const json = await res.json()

    if (!json || !json.rates || typeof json.rates !== "object" || !json.rates.USD) {
      throw new Error("Invalid payload: missing rates.USD")
    }

    const payload: GoldRatesResponse = {
      timestamp: json.timestamp || now,
      base: json.base || "XAU",
      rates: json.rates,
    }

    // Update in-memory cache
    inMemoryCache = {
      data: payload,
      cachedAt: now,
    }

    return payload
  } catch (error: any) {
    console.warn(
      "exchangerate.fun API fetch failed, using fallback XAU rates:",
      error?.message || error
    )

    // Return stale cache if available, otherwise fallback
    if (inMemoryCache) {
      return inMemoryCache.data
    }

    return {
      timestamp: now,
      base: "XAU",
      rates: FALLBACK_XAU_RATES,
    }
  }
}

/**
 * Returns current XAU/USD price.
 */
export async function getGoldUsdPrice(): Promise<number> {
  try {
    const ratesData = await getGoldRates()
    return ratesData.rates["USD"] || FALLBACK_GOLD_USD_PRICE
  } catch {
    return FALLBACK_GOLD_USD_PRICE
  }
}

/**
 * Cross-rate currency conversion:
 * Since base is XAU:
 *   1 XAU = rates[from] (in from-currency)
 *   1 XAU = rates[to]   (in to-currency)
 *   => 1 unit of from = (toRate / fromRate) units of to
 */
export function convertCurrencyWithRates(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (amount === 0) return 0

  const fromUpper = from.toUpperCase().trim()
  const toUpper = to.toUpperCase().trim()

  if (fromUpper === toUpper) return amount

  const fromRate = fromUpper === "XAU" ? 1 : rates[fromUpper]
  const toRate = toUpper === "XAU" ? 1 : rates[toUpper]

  if (!fromRate || !toRate) {
    console.warn(`Missing exchange rate for conversion: ${fromUpper} -> ${toUpper}`)
    return amount
  }

  const crossRate = toRate / fromRate
  return Number((amount * crossRate).toFixed(4))
}

/**
 * Async currency converter using live or cached rates.
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (amount === 0 || from.toUpperCase().trim() === to.toUpperCase().trim()) {
    return amount
  }

  const { rates } = await getGoldRates()
  return convertCurrencyWithRates(amount, from, to, rates)
}
