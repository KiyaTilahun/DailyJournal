"use client"

import * as React from "react"
import {
  Award,
  BarChart3,
  Globe,
  Layers,
  Percent,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp
} from "lucide-react"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"

import { useTrades } from "@/lib/trade-context"
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
import { RoutesNavigationBanner } from "@/components/routes-navigation-banner"

export function AnalyticsPageView() {
  const {
    summary,
    trades,
    equityCurve,
    pairPerformance,
    sessionPerformance,
    strategyPerformance,
    openNewTradeModal
  } = useTrades()

  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "all">("all")
  const [currencyOrPercent, setCurrencyOrPercent] = React.useState<"dollar" | "percent">("dollar")

  const filteredEquity = React.useMemo(() => {
    if (timeRange === "all" || equityCurve.length <= 2) return equityCurve
    const limit = timeRange === "7d" ? 7 : 15
    return equityCurve.slice(-limit)
  }, [equityCurve, timeRange])

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Equity Curve & Performance KPIs</span>
            <Badge variant="outline" className="font-mono text-xs">
              SRS 4.1 & 4.2
            </Badge>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Statistical edge validation, compounding growth, drawdown metrics, and strategy efficacy.
          </p>
        </div>

        <Button
          onClick={openNewTradeModal}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Log Trade</span>
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Profit / Loss
            </CardTitle>
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                summary.netPnL >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
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
              Return: {(((summary.currentBalance - summary.startingBalance) / summary.startingBalance) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs">
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

        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Profit Factor
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.profitFactor}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Gross: +${summary.grossProfit.toFixed(0)} / -${summary.grossLoss.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average R-Multiple
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.averageRR}R
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Max DD: <strong className="text-rose-500">{summary.maxDrawdownPercent}%</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Equity Curve Card */}
      <Card className="rounded-xl border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Account Equity Curve & Cumulative Growth
            </CardTitle>
            <CardDescription className="text-xs">
              Chronological equity compounding across all executed closed positions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Dollar / Percent Toggle Button */}
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
              <SelectTrigger className="w-28 h-8 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 trades</SelectItem>
                <SelectItem value="30d">Last 15 trades</SelectItem>
                <SelectItem value="all">All trades</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrichedEquity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
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
                            Return: <strong className="text-primary">{data.percentGrowth > 0 ? "+" : ""}{data.percentGrowth}%</strong>
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
                  fill="url(#equityGradientAnalytics)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Starting: ${summary.startingBalance.toLocaleString()} → Current: ${summary.currentBalance.toLocaleString()}
            </span>
            <span>
              Consecutive wins record: <strong className="text-emerald-600 font-mono">{summary.maxConsecutiveWins}W</strong> • Losses: <strong className="text-rose-600 font-mono">{summary.maxConsecutiveLosses}L</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Breakdowns: Pairs, Sessions, Strategies (SRS 4.3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pairs */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">Currency Pairs Profitability</CardTitle>
            <CardDescription className="text-xs">Win rate and net PnL by instrument</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pairPerformance.map(p => (
              <div key={p.pair} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono">{p.pair}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    {p.winRate}% ({p.tradesCount})
                  </Badge>
                </div>
                <span className={`font-mono font-bold ${p.netPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {p.netPnL >= 0 ? "+" : ""}${p.netPnL.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">Session Profitability</CardTitle>
            <CardDescription className="text-xs">Performance by market trading session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {sessionPerformance.map(s => (
              <div key={s.session} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.session.replace(/_/g, " ")}</span>
                  <span className="text-[10px] text-muted-foreground">({s.tradesCount})</span>
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

        {/* Strategies */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">Strategy Efficacy</CardTitle>
            <CardDescription className="text-xs">Edge and expectancy by playbook model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {strategyPerformance.map(st => (
              <div key={st.strategy} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{st.strategy.replace(/_/g, " ")}</span>
                  <span className="text-[10px] text-muted-foreground">{st.winRate}% WR • {st.avgRR}R avg</span>
                </div>
                <span className={`font-mono font-bold ${st.netPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {st.netPnL >= 0 ? "+" : ""}${st.netPnL.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <RoutesNavigationBanner className="pt-2" />
    </div>
  )
}
