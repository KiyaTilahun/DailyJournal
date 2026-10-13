"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react"
import { Trade } from "@/lib/trading-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTrades } from "@/lib/trade-context"

interface CalendarViewProps {
  trades?: Trade[]
  onSelectTrade?: (trade: Trade) => void
}

export function CalendarView(props: CalendarViewProps = {}) {
  const context = useTrades()
  const trades = props.trades ?? context.trades
  const onSelectTrade = props.onSelectTrade ?? context.openEditTradeModal
  // Group trades by day: "YYYY-MM-DD"
  const grouped = React.useMemo(() => {
    const map = new Map<string, Trade[]>()
    for (const trade of trades) {
      const dateKey = (trade.exitDate || trade.entryDate).slice(0, 10)
      const list = map.get(dateKey) || []
      list.push(trade)
      map.set(dateKey, list)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [trades])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Trading Calendar & Daily PnL Heatmap</span>
            <Badge variant="outline" className="font-mono text-xs">
              {grouped.length} Active Days
            </Badge>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Evaluate daily consistency, net profit/loss per trading day, and emotional discipline.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grouped.map(([dateStr, dayTrades]) => {
          const totalNet = dayTrades.reduce((acc, t) => acc + t.netPnL, 0)
          const wins = dayTrades.filter(t => t.netPnL > 0).length
          const losses = dayTrades.filter(t => t.netPnL < 0).length
          const dateObj = new Date(dateStr)

          return (
            <Card
              key={dateStr}
              className="rounded-xl border border-border/80 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">
                    {dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </CardTitle>
                  <CardDescription className="text-[11px] font-mono">
                    {dayTrades.length} trade(s) • {wins}W / {losses}L
                  </CardDescription>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${
                    totalNet >= 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {totalNet >= 0 ? "+" : ""}${totalNet.toFixed(2)}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2 flex-1">
                {dayTrades.map(t => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTrade(t)}
                    className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/50 hover:bg-muted/40 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold font-mono text-[11px] ${
                          t.direction === "LONG" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {t.direction === "LONG" ? "BUY" : "SELL"}
                      </span>
                      <span className="font-bold text-foreground">{t.instrument}</span>
                      <span className="text-[10px] text-muted-foreground">{t.session}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-muted-foreground">{t.realizedRR}R</span>
                      <span className={`font-bold ${t.netPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.netPnL >= 0 ? "+" : ""}${t.netPnL.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
