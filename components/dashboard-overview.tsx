"use client"

import * as React from "react"
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Compass,
  DollarSign,
  Flame,
  Globe,
  Layers,
  Percent,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
  Wallet
} from "lucide-react"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

import {
  Trade,
  TradingAccountSummary,
  PairPerformance,
  SessionPerformance,
  StrategyPerformance,
  MistakeAnalysis
} from "@/lib/trading-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdjustBalanceDialog } from "@/components/adjust-balance-dialog"

interface DashboardOverviewProps {
  summary: TradingAccountSummary
  trades: Trade[]
  equityCurve: Array<{ date: string; balance: number; netPnL: number; cumulativePnL: number }>
  pairPerformance: PairPerformance[]
  sessionPerformance: SessionPerformance[]
  strategyPerformance: StrategyPerformance[]
  mistakeAnalysis: MistakeAnalysis[]
  onNewTrade: () => void
  onSelectTrade: (trade: Trade) => void
  onNavigateTab: (tab: string) => void
}

import { useRouter } from "next/navigation"
import { useTrades } from "@/lib/trade-context"
import { RoutesNavigationBanner } from "@/components/routes-navigation-banner"

const PSYCHOLOGY_PROMPTS = [
  "Did you wait for the candle to close, or did FOMO make you enter early?",
  "A loss taken according to your plan is a successful execution of your system.",
  "Your risk management protects you from the market; your psychology protects you from yourself.",
  "Never risk more than your predefined plan just to make back previous losses.",
  "The goal is not to win every trade, but to execute your edge with mechanical discipline."
]

export function DashboardOverview() {
  const router = useRouter()
  const {
    summary,
    trades,
    equityCurve,
    pairPerformance,
    sessionPerformance,
    strategyPerformance,
    mistakeAnalysis,
    openNewTradeModal,
    openEditTradeModal
  } = useTrades()

  const onNewTrade = openNewTradeModal
  const onSelectTrade = openEditTradeModal
  const onNavigateTab = (tab: string) => {
    if (tab === "journal") router.push("/journal")
    else if (tab === "analytics") router.push("/analytics")
    else if (tab === "calendar") router.push("/calendar")
    else if (tab === "psychology") router.push("/psychology")
    else if (tab === "mistakes") router.push("/mistakes")
    else router.push("/")
  }
  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d" | "all">("all")
  const [currencyOrPercent, setCurrencyOrPercent] = React.useState<"dollar" | "percent">("dollar")
  const [adjustBalanceOpen, setAdjustBalanceOpen] = React.useState(false)
  const [greeting, setGreeting] = React.useState("Good day")
  const [dailyPrompt, setDailyPrompt] = React.useState(PSYCHOLOGY_PROMPTS[0])

  React.useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    setDailyPrompt(PSYCHOLOGY_PROMPTS[dayOfYear % PSYCHOLOGY_PROMPTS.length])
  }, [])

  // Filter equity points by timeRange
  const filteredEquity = React.useMemo(() => {
    if (timeRange === "all" || equityCurve.length <= 2) return equityCurve
    const limit = timeRange === "7d" ? 7 : timeRange === "30d" ? 15 : 30
    return equityCurve.slice(-limit)
  }, [equityCurve, timeRange])

  // Enriched equity with percentage calculation from starting capital
  const enrichedEquity = React.useMemo(() => {
    const base = summary.startingBalance || 10000
    return filteredEquity.map(pt => {
      const pGrowth = Number((((pt.balance - base) / base) * 100).toFixed(2))
      return {
        ...pt,
        percentGrowth: pGrowth,
        displayValue: currencyOrPercent === "dollar" ? pt.balance : pGrowth,
      }
    })
  }, [filteredEquity, summary.startingBalance, currencyOrPercent])

  // Max drawdown in absolute dollar terms
  const maxDDDollar = React.useMemo(() => {
    const peak = Math.max(summary.startingBalance, summary.currentBalance)
    return peak * (summary.maxDrawdownPercent / 100)
  }, [summary.startingBalance, summary.currentBalance, summary.maxDrawdownPercent])

  // Today's trades
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayTrades = trades.filter(t => t.entryDate.startsWith(todayStr))
  const recentTrades = trades.slice(0, 5)

  // Total cost of mistakes
  const totalCostOfMistakes = mistakeAnalysis.reduce((acc, m) => acc + m.totalLoss, 0)
  const mostFrequentMistake = mistakeAnalysis[0]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Daily Greeting Strip (Design Prompt 5.1) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{greeting}, Trader.</span>
            <span className="text-xl">📈</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs bg-muted px-2 py-0.5 rounded-full border">
              <Globe className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              London / NY Core Active
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card/80 shadow-xs">
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Streak</span>
              <span className="text-xs font-bold font-mono">
                {summary.currentStreak.count} {summary.currentStreak.type}
              </span>
            </div>
          </div>

          <Button
            onClick={onNewTrade}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center gap-2 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Log Trade Entry</span>
          </Button>
        </div>
      </div>

      {/* 2. "Write / Review Today" Hero Card (Design Prompt 5.2) */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-accent/20 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-medium bg-background/80 gap-1 border-primary/30 text-primary">
                <Sparkles className="h-3 w-3 text-primary" /> Daily Mindset Prompt
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {todayTrades.length > 0 ? `${todayTrades.length} trade(s) logged today` : "No trades logged today"}
              </span>
            </div>
            <p className="text-sm sm:text-base font-medium italic text-foreground leading-relaxed">
              &ldquo;{dailyPrompt}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {todayTrades.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab("journal")}
                className="text-xs gap-1.5 bg-background/80"
              >
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                Review Today&apos;s Trades
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onNewTrade}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Start Today&apos;s Entry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Stats Row: Bento Grid of 5 Cards with Current Balance Top-2 Placement (Rule 4.3) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Net Profit / Loss */}
        <Card className="rounded-xl border shadow-xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Profit / Loss
            </CardTitle>
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                summary.netPnL >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {summary.netPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                summary.netPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {summary.netPnL >= 0 ? "+" : ""}${summary.netPnL.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              From {summary.totalTrades} closed trade{summary.totalTrades === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Current Balance (Top-2 placement with Adjust Balance Affordance - Rule 4.3) */}
        <Card className="rounded-xl border border-primary/40 bg-primary/[0.03] shadow-xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              Current Balance
            </CardTitle>
            <button
              onClick={() => setAdjustBalanceOpen(true)}
              className="text-[11px] font-bold text-primary hover:text-primary/80 hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20"
            >
              Adjust
            </button>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              ${summary.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>Max Drawdown:</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                -${maxDDDollar.toFixed(0)} ({summary.maxDrawdownPercent}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Win Rate */}
        <Card className="rounded-xl border shadow-xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Win Rate
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.winRate}%
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {summary.wins}W / {summary.losses}L / {summary.breakEvens}BE
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Profit Factor */}
        <Card className="rounded-xl border shadow-xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Profit Factor
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.profitFactor}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              +${summary.grossProfit.toFixed(0)} / -${summary.grossLoss.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        {/* Card 5: Expectancy & Realized R:R */}
        <Card className="rounded-xl border shadow-xs hover:shadow-md transition-all col-span-2 md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Realized R:R
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.averageRR}R
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Expectancy: ${summary.expectancy}/trade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Two-Column Insight Area: Equity Curve (8 col) + Recent Trades (4 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Equity Curve Chart with $ / % Toggle (Rule 4.2) */}
        <Card className="lg:col-span-8 rounded-xl border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold tracking-tight">
                Account Equity Curve & Capital Compounding
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time visual trajectory of balance and percentage return over trades
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Dollar / Percentage Toggle */}
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs font-mono font-medium">
                <button
                  type="button"
                  onClick={() => setCurrencyOrPercent("dollar")}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    currencyOrPercent === "dollar"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyOrPercent("percent")}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    currencyOrPercent === "percent"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  %
                </button>
              </div>

              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-24 h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 trades</SelectItem>
                  <SelectItem value="30d">15 trades</SelectItem>
                  <SelectItem value="all">All trades</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrichedEquity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(val: number) =>
                      currencyOrPercent === "dollar" ? `$${val}` : `${val > 0 ? "+" : ""}${val}%`
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-popover p-2.5 text-xs shadow-md font-sans space-y-1">
                            <p className="font-semibold text-popover-foreground">{data.date}</p>
                            <p className="font-mono text-muted-foreground">
                              Balance: <strong className="text-popover-foreground">${data.balance.toLocaleString()}</strong>
                            </p>
                            <p className="font-mono text-muted-foreground">
                              Growth: <strong className="text-primary">{data.percentGrowth > 0 ? "+" : ""}{data.percentGrowth}%</strong>
                            </p>
                            {data.netPnL !== 0 && (
                              <p className={`font-mono font-medium ${data.netPnL > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                Trade PnL: {data.netPnL > 0 ? "+" : ""}${data.netPnL.toFixed(2)}
                              </p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="displayValue"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#equityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Capital Growth: ${(summary.currentBalance - summary.startingBalance).toFixed(2)} (
                {(((summary.currentBalance - summary.startingBalance) / (summary.startingBalance || 1)) * 100).toFixed(1)}%)
              </span>
              <span>Max Drawdown: <strong className="text-rose-500 font-mono">-${maxDDDollar.toFixed(0)} ({summary.maxDrawdownPercent}%)</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Recent Trades List (Design Prompt 5.4) */}
        <Card className="lg:col-span-4 rounded-xl border shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold tracking-tight">Recent Trades</CardTitle>
              <CardDescription className="text-xs">Last executed positions</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab("journal")}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {recentTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground text-xs space-y-2">
                <Compass className="h-8 w-8 text-muted-foreground/40" />
                <p>No trades logged yet.</p>
                <Button size="sm" onClick={onNewTrade} className="text-xs">
                  Log your first trade
                </Button>
              </div>
            ) : (
              recentTrades.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTrade(t)}
                  className="group flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-card hover:bg-muted/50 hover:border-border transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold ${
                        t.direction === "LONG"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {t.direction === "LONG" ? "BUY" : "SELL"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs tracking-tight truncate">{t.instrument}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {t.strategy.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {new Date(t.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {t.session}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span
                      className={`font-mono text-xs font-bold ${
                        t.netPnL >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {t.netPnL >= 0 ? "+" : ""}${t.netPnL.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {t.realizedRR}R
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Strategy Breakdown & Mistake Analysis Grid (SRS 4.3 & 4.4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Currency Pair Performance */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center justify-between">
              <span>Pairs Profitability</span>
              <span className="text-[11px] text-muted-foreground font-normal">SRS 4.3</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pairPerformance.slice(0, 4).map(p => (
              <div key={p.pair} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-mono">{p.pair}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    {p.winRate}% WR ({p.tradesCount})
                  </Badge>
                </div>
                <span className={`font-mono font-bold ${p.netPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {p.netPnL >= 0 ? "+" : ""}${p.netPnL.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Session Profitability */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center justify-between">
              <span>Session Efficacy</span>
              <span className="text-[11px] text-muted-foreground font-normal">Time of Day</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {sessionPerformance.map(s => (
              <div key={s.session} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.session.replace(/_/g, " ")}</span>
                  <span className="text-[10px] text-muted-foreground">({s.tradesCount} trades)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">{s.winRate}%</span>
                  <span className={`font-mono font-bold ${s.netPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {s.netPnL >= 0 ? "+" : ""}${s.netPnL.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cost of Mistakes Audit (SRS 4.4) */}
        <Card className="rounded-xl border shadow-xs bg-rose-500/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Cost of Mistakes Log
              </span>
              <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                -${totalCostOfMistakes.toFixed(2)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {mistakeAnalysis.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No mistakes logged. Clean rule compliance!
              </div>
            ) : (
              mistakeAnalysis.slice(0, 3).map(m => (
                <div key={m.mistake} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{m.mistake.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-muted-foreground">({m.count}x)</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -${m.totalLoss.toFixed(2)}
                  </span>
                </div>
              ))
            )}
            <p className="text-[11px] text-muted-foreground pt-1">
              Eliminating these recurring errors directly increases bottom-line equity.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Routes Quick Navigation Banner */}
      <RoutesNavigationBanner className="pt-2" />

      {/* Adjust Account Balance Modal (Rule 4.3) */}
      <AdjustBalanceDialog open={adjustBalanceOpen} onOpenChange={setAdjustBalanceOpen} />
    </div>
  )
}
