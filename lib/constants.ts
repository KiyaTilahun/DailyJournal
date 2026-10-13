/**
 * Trading Constants & Pip Value Calculator
 * Used for position sizing, risk percentage computation, and lot size suggestions.
 */

export interface PipSpec {
  pipSize: number // e.g. 0.0001 for standard FX, 0.01 for JPY & Gold
  pipValuePerLot: number // USD value per pip per standard 1.0 lot
  description: string
}

export const PIP_VALUE_LOOKUP: Record<string, PipSpec> = {
  // Forex Majors (Standard 100,000 unit lot -> $10 per pip)
  "EUR/USD": { pipSize: 0.0001, pipValuePerLot: 10.0, description: "Forex Major ($10/pip/lot)" },
  "GBP/USD": { pipSize: 0.0001, pipValuePerLot: 10.0, description: "Forex Major ($10/pip/lot)" },
  "AUD/USD": { pipSize: 0.0001, pipValuePerLot: 10.0, description: "Forex Major ($10/pip/lot)" },
  "NZD/USD": { pipSize: 0.0001, pipValuePerLot: 10.0, description: "Forex Major ($10/pip/lot)" },
  "USD/CAD": { pipSize: 0.0001, pipValuePerLot: 10.0, description: "Forex Major (~$10/pip/lot)" },
  "USD/CHF": { pipSize: 0.0001, pipValuePerLot: 10.0, description: "Forex Major (~$10/pip/lot)" },

  // JPY Pairs (100,000 units, 0.01 pip -> ¥1000/pip ≈ $6.70 at current FX rate)
  "USD/JPY": { pipSize: 0.01, pipValuePerLot: 6.7, description: "JPY Pair (~¥1000 ≈ $6.70/pip/lot)" },
  "GBP/JPY": { pipSize: 0.01, pipValuePerLot: 6.7, description: "JPY Cross (~¥1000 ≈ $6.70/pip/lot)" },
  "EUR/JPY": { pipSize: 0.01, pipValuePerLot: 6.7, description: "JPY Cross (~¥1000 ≈ $6.70/pip/lot)" },

  // Forex Crosses
  "EUR/GBP": { pipSize: 0.0001, pipValuePerLot: 12.8, description: "EUR/GBP Cross (~£10 ≈ $12.80/pip/lot)" },

  // Commodities (Gold 100 oz contract: $1.00 move = $100/lot, or 0.01 pip = $1.00)
  "XAU/USD": { pipSize: 0.01, pipValuePerLot: 1.0, description: "Gold 100oz ($1.00/pip, $100/$1 move)" },
  "XAG/USD": { pipSize: 0.001, pipValuePerLot: 5.0, description: "Silver 5000oz ($5.00/pip)" },

  // Indices & Crypto (Flat $1 move = $1 per 1.0 contract)
  "BTC/USD": { pipSize: 1.0, pipValuePerLot: 1.0, description: "Bitcoin ($1 move = $1/lot)" },
  "US30": { pipSize: 1.0, pipValuePerLot: 1.0, description: "Dow Jones 30 ($1 move = $1/lot)" },
  "NAS100": { pipSize: 1.0, pipValuePerLot: 1.0, description: "Nasdaq 100 ($1 move = $1/lot)" },
}

export const DEFAULT_PIP_SPEC: PipSpec = {
  pipSize: 0.0001,
  pipValuePerLot: 10.0,
  description: "Standard Forex Lot ($10/pip/lot)",
}

/**
 * Returns the PipSpec for a given symbol
 */
export function getPipSpec(symbol: string): PipSpec {
  const upper = symbol.toUpperCase().trim()
  if (PIP_VALUE_LOOKUP[upper]) {
    return PIP_VALUE_LOOKUP[upper]
  }

  if (upper.includes("JPY")) {
    return PIP_VALUE_LOOKUP["USD/JPY"]
  }
  if (upper.includes("XAU") || upper.includes("GOLD")) {
    return PIP_VALUE_LOOKUP["XAU/USD"]
  }
  if (upper.includes("BTC")) {
    return PIP_VALUE_LOOKUP["BTC/USD"]
  }
  if (upper.includes("US30") || upper.includes("NAS100") || upper.includes("SPX")) {
    return { pipSize: 1.0, pipValuePerLot: 1.0, description: "Index CFD ($1/pt/lot)" }
  }

  return DEFAULT_PIP_SPEC
}

/**
 * Calculates suggested lot size given account balance, risk percentage, entry price, and stop loss.
 * Formula:
 *   riskAmount = accountBalance * (riskPercent / 100)
 *   pipsAtRisk = |entry - stopLoss| / pipSize
 *   suggestedLots = riskAmount / (pipsAtRisk * pipValuePerLot)
 */
export interface LotCalculationOptions {
  accountCurrency?: string
  liveGoldPriceUsd?: number
  rates?: Record<string, number>
}

export function calculateSuggestedLotSize(
  symbol: string,
  accountBalance: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number,
  options?: LotCalculationOptions
): {
  suggestedLots: number
  riskAmount: number
  pipsAtRisk: number
  spec: PipSpec
} | null {
  if (
    accountBalance <= 0 ||
    riskPercent <= 0 ||
    entryPrice <= 0 ||
    stopLossPrice <= 0 ||
    entryPrice === stopLossPrice
  ) {
    return null
  }

  const spec = { ...getPipSpec(symbol) }
  const upper = symbol.toUpperCase().trim()
  const isMetal = upper.includes("XAU") || upper.includes("GOLD") || upper.includes("XAG")

  // Rule 2: Compute pip value dynamically for XAU/USD and metals
  if (isMetal && options?.liveGoldPriceUsd && options.liveGoldPriceUsd > 0) {
    const currency = options.accountCurrency || "USD"
    let currencyMultiplier = 1.0

    if (options.rates && currency !== "USD") {
      const fromRate = options.rates["USD"] || options.liveGoldPriceUsd
      const toRate = options.rates[currency]
      if (fromRate && toRate) {
        currencyMultiplier = toRate / fromRate
      }
    }

    // 100 oz contract: 1 pip (0.01 $/oz move) = $1.00 USD, scaled into account currency
    spec.pipValuePerLot = Number((1.0 * currencyMultiplier).toFixed(4))
    spec.description = `Dynamic Gold ($${options.liveGoldPriceUsd.toFixed(0)} XAU · 100 oz/lot · ${spec.pipValuePerLot} ${currency}/pip)`
  }

  const priceDiff = Math.abs(entryPrice - stopLossPrice)
  const pipsAtRisk = priceDiff / spec.pipSize
  if (pipsAtRisk <= 0) return null

  const riskAmount = accountBalance * (riskPercent / 100)
  const totalCostPerLot = pipsAtRisk * spec.pipValuePerLot

  if (totalCostPerLot <= 0) return null

  const rawLots = riskAmount / totalCostPerLot
  // Clamp to 2 decimal places with minimum 0.01 lot
  const suggestedLots = Math.max(0.01, Math.round(rawLots * 100) / 100)

  return {
    suggestedLots,
    riskAmount: Math.round(riskAmount * 100) / 100,
    pipsAtRisk: Math.round(pipsAtRisk * 10) / 10,
    spec,
  }
}

export const QUICK_LOT_SIZES = [0.01, 0.05, 0.1, 0.5, 1.0]
