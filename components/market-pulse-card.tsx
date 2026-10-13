"use client"

import * as React from "react"
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Coins,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MarketQuote {
  symbol: string
  name?: string
  close: number
  change: number
  percentChange: number
  bid: number
  ask: number
  isStale: boolean
  timestamp: number
}

interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  percentChange: number
  direction: "UP" | "DOWN"
}

interface MarketPulseCardProps {
  userSymbols?: string[]
}

export function MarketPulseCard({ userSymbols = [] }: MarketPulseCardProps) {
  const [quotes, setQuotes] = React.useState<MarketQuote[]>([])
  const [movers, setMovers] = React.useState<{ gainers: MarketMover[]; losers: MarketMover[] }>({
    gainers: [],
    losers: [],
  })
  const [budget, setBudget] = React.useState<{ creditsRemaining: number; isExhausted: boolean } | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)

        // Select symbols to track: user's symbols + fallback majors
        const defaultSymbols = ["XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY"]
        const targetSymbols = Array.from(new Set([...userSymbols.slice(0, 3), ...defaultSymbols])).slice(0, 4)

        // Fetch quotes in parallel
        const quotePromises = targetSymbols.map(sym =>
          fetch(`/api/market/quote?symbol=${encodeURIComponent(sym)}`)
            .then(res => res.json())
            .then(data => data.quote as MarketQuote | null)
            .catch(() => null)
        )

        const [quotesData, moversRes, budgetRes] = await Promise.all([
          Promise.all(quotePromises),
          fetch("/api/market/movers").then(r => r.json()).catch(() => ({ movers: { gainers: [], losers: [] } })),
          fetch("/api/market/budget").then(r => r.json()).catch(() => ({ budget: null })),
        ])

        if (!isMounted) return

        setQuotes(quotesData.filter((q): q is MarketQuote => q !== null))
        if (moversRes?.movers) {
          setMovers({
            gainers: moversRes.movers.gainers || [],
            losers: moversRes.movers.losers || [],
          })
        }
        if (budgetRes?.budget) {
          setBudget({
            creditsRemaining: budgetRes.budget.creditsRemaining,
            isExhausted: budgetRes.budget.isExhausted,
          })
        }
      } catch (err) {
        console.warn("MarketPulseCard fetch error:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [userSymbols.join(",")])

  return (
    <Card className="border-border/80 shadow-xs flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span>Market Pulse</span>
              {budget?.isExhausted && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground border-border/80">
                  Daily quota paused
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Live quotes & top Forex / Metals movers
            </CardDescription>
          </div>
        </div>

        {budget && (
          <div
            title={`Credits remaining: ${budget.creditsRemaining}/8 (persistent MongoDB cache)`}
            className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/50"
          >
            <Coins className="h-3 w-3 text-amber-500" />
            <span>{budget.creditsRemaining} credits</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Tracked Symbols Quotes */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            <span>Instrument</span>
            <span>Price / 24h</span>
          </div>

          <div className="space-y-1.5">
            {quotes.map(q => {
              const isUp = q.percentChange >= 0
              return (
                <div
                  key={q.symbol}
                  className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-xs font-mono">{q.symbol}</span>
                    {q.isStale && (
                      <span
                        title="Cached data (> 15m)"
                        className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5"
                      >
                        <Clock className="h-2.5 w-2.5" />
                        cached
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-medium">
                      {q.close.toLocaleString(undefined, {
                        minimumFractionDigits: q.symbol.includes("JPY") || q.symbol.includes("XAU") ? 2 : 4,
                        maximumFractionDigits: q.symbol.includes("JPY") || q.symbol.includes("XAU") ? 2 : 5,
                      })}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        isUp
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {isUp ? "+" : ""}
                      {q.percentChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Movers Snapshot */}
        <div className="pt-2 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              Session Movers
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Top Gainer */}
            {movers.gainers[0] && (
              <div className="p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Top Gainer</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono truncate">{movers.gainers[0].symbol}</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{movers.gainers[0].percentChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {/* Top Loser */}
            {movers.losers[0] && (
              <div className="p-2 rounded-lg border border-rose-500/20 bg-rose-500/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Top Loser</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono truncate">{movers.losers[0].symbol}</span>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    {movers.losers[0].percentChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
