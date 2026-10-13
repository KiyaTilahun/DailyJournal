"use client"

import * as React from "react"
import { AlertCircle, Brain, CheckCircle2, Flame, HeartHandshake, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from "lucide-react"
import { Trade, MistakeAnalysis, PreTradeEmotion, PostTradeEmotion } from "@/lib/trading-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTrades } from "@/lib/trade-context"

interface MindsetAnalysisViewProps {
  trades?: Trade[]
  mistakeAnalysis?: MistakeAnalysis[]
}

export function MindsetAnalysisView(props: MindsetAnalysisViewProps = {}) {
  const context = useTrades()
  const trades = props.trades ?? context.trades
  const mistakeAnalysis = props.mistakeAnalysis ?? context.mistakeAnalysis
  // Aggregate performance by pre-trade emotion
  const emotionStats = React.useMemo(() => {
    const map = new Map<PreTradeEmotion, { count: number; wins: number; pnl: number }>()
    for (const t of trades) {
      const item = map.get(t.preTradeEmotion) || { count: 0, wins: 0, pnl: 0 }
      item.count++
      if (t.netPnL > 0) item.wins++
      item.pnl += t.netPnL
      map.set(t.preTradeEmotion, item)
    }
    return Array.from(map.entries()).map(([emotion, data]) => ({
      emotion,
      count: data.count,
      winRate: data.count > 0 ? Number(((data.wins / data.count) * 100).toFixed(1)) : 0,
      netPnL: Number(data.pnl.toFixed(2))
    }))
  }, [trades])

  // Aggregate post-trade exit execution
  const exitStats = React.useMemo(() => {
    const map = new Map<PostTradeEmotion, { count: number; pnl: number }>()
    for (const t of trades) {
      const item = map.get(t.postTradeEmotion) || { count: 0, pnl: 0 }
      item.count++
      item.pnl += t.netPnL
      map.set(t.postTradeEmotion, item)
    }
    return Array.from(map.entries()).map(([exit, data]) => ({
      exit,
      count: data.count,
      netPnL: Number(data.pnl.toFixed(2))
    }))
  }, [trades])

  const totalCostOfMistakes = mistakeAnalysis.reduce((acc, m) => acc + m.totalLoss, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Trading Psychology & Mistake Audit</span>
            <Badge variant="outline" className="font-mono text-xs">
              SRS 3.1 & 4.4
            </Badge>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Identify emotional leaks, examine exit discipline, and isolate the financial cost of avoidable errors.
          </p>
        </div>
      </div>

      {/* Top Banner: Cost of Mistakes */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" /> Total Financial Cost of Mistakes
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              -${totalCostOfMistakes.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            This represents raw capital lost directly to psychological errors (FOMO, over-leveraging, chasing price).
            Halving these mistakes would instantly protect your bottom line.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {mistakeAnalysis.map(m => (
            <div key={m.mistake} className="p-3 rounded-xl bg-card border border-border/70 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground truncate">{m.mistake.replace(/_/g, " ")}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">{m.count}x</Badge>
              </div>
              <p className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                -${m.totalLoss.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Grid: Pre-trade mental state vs Exit management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pre-trade Emotion Breakdown */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Pre-Trade Mental State vs Profitability
            </CardTitle>
            <CardDescription className="text-xs">
              How your mindset at market entry correlates with win rate and PnL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {emotionStats.map(stat => (
              <div
                key={stat.emotion}
                className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">{stat.emotion}</span>
                  <p className="text-[11px] text-muted-foreground">
                    {stat.count} trade(s) • <strong className="text-foreground">{stat.winRate}%</strong> Win Rate
                  </p>
                </div>
                <div
                  className={`font-mono text-sm font-bold ${
                    stat.netPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {stat.netPnL >= 0 ? "+" : ""}${stat.netPnL.toFixed(2)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Post-Trade Exit Discipline */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Exit Execution Discipline
            </CardTitle>
            <CardDescription className="text-xs">
              Did you follow your take-profit plan or exit out of fear/impatience?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {exitStats.map(stat => (
              <div
                key={stat.exit}
                className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">{stat.exit.replace(/_/g, " ")}</span>
                  <p className="text-[11px] text-muted-foreground">{stat.count} trade(s)</p>
                </div>
                <div
                  className={`font-mono text-sm font-bold ${
                    stat.netPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {stat.netPnL >= 0 ? "+" : ""}${stat.netPnL.toFixed(2)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Trader Lessons Learned Reflection Feed */}
      <Card className="rounded-xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Recent Trader Journal Reflections
          </CardTitle>
          <CardDescription className="text-xs">
            Deliberate practice notes recorded after trade close
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {trades.filter(t => t.lessonsLearned).map(t => (
            <div key={t.id} className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono">{t.instrument}</span>
                  <Badge variant="outline" className="text-[10px]">{t.strategy.replace(/_/g, " ")}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(t.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <span className={`font-mono font-bold ${t.netPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {t.netPnL >= 0 ? "+" : ""}${t.netPnL.toFixed(2)}
                </span>
              </div>
              <p className="text-muted-foreground italic leading-relaxed">
                &ldquo;{t.lessonsLearned}&rdquo;
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
