"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Check,
  AlertCircle,
  X,
  Filter,
  RotateCcw,
  Brain,
  ShieldAlert,
  Star,
  ExternalLink,
  Plus,
  Sparkles,
  Info,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from "lucide-react"

import {
  Trade,
  TradeDirection,
  TradeSession,
  PreTradeEmotion,
  MistakeTag
} from "@/lib/trading-types"
import { useTrades } from "@/lib/trade-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "cn"

// ==========================================
// TYPES & CONSTANTS
// ==========================================

export type MetricType = "dollar" | "r" | "percent"
export type OverlayType = "pnl" | "mood" | "mistakes" | "conviction"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export interface CalendarDay {
  date: Date
  dateKey: string // "YYYY-MM-DD"
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  trades: Trade[]
  netPnL: number
  realizedRR: number
  percentReturn: number
  tradeCount: number
  winCount: number
  lossCount: number
  hasMistake: boolean
  isClean: boolean
  dominantMood?: PreTradeEmotion
  avgConviction?: number
}

export interface WeekSummary {
  weekNumber: number
  netPnL: number
  realizedRR: number
  percentReturn: number
  tradeCount: number
  winRate: number
}

interface CalendarFilters {
  instrument: string
  strategy: string
  session: string
  direction: string
  account: string
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatSignedCurrency(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : ""
  return `${sign}$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function formatSignedR(r: number): string {
  const sign = r > 0 ? "+" : r < 0 ? "-" : ""
  return `${sign}${Math.abs(r).toFixed(2)}R`
}

function formatSignedPercent(pct: number): string {
  const sign = pct > 0 ? "+" : pct < 0 ? "-" : ""
  return `${sign}${Math.abs(pct).toFixed(2)}%`
}

function formatDayMetric(day: CalendarDay, metric: MetricType): string {
  if (day.tradeCount === 0) return ""
  if (metric === "dollar") return formatSignedCurrency(day.netPnL)
  if (metric === "r") return formatSignedR(day.realizedRR)
  return formatSignedPercent(day.percentReturn)
}

function formatWeekMetric(summary: WeekSummary, metric: MetricType): string {
  if (summary.tradeCount === 0) return "—"
  if (metric === "dollar") return formatSignedCurrency(summary.netPnL)
  if (metric === "r") return formatSignedR(summary.realizedRR)
  return formatSignedPercent(summary.percentReturn)
}

// Generate WCAG AA heat color class for P&L based on max absolute value
function getPnLHeatClass(value: number, maxAbs: number): string {
  if (value === 0 || maxAbs === 0) return ""
  const ratio = Math.min(1, Math.abs(value) / maxAbs)

  if (value > 0) {
    if (ratio >= 0.75) return "bg-emerald-500/35 border-emerald-500/50 text-emerald-950 dark:text-emerald-100 font-bold"
    if (ratio >= 0.50) return "bg-emerald-500/25 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 font-semibold"
    if (ratio >= 0.25) return "bg-emerald-500/18 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 font-medium"
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
  } else {
    if (ratio >= 0.75) return "bg-rose-500/35 border-rose-500/50 text-rose-950 dark:text-rose-100 font-bold"
    if (ratio >= 0.50) return "bg-rose-500/25 border-rose-500/40 text-rose-950 dark:text-rose-100 font-semibold"
    if (ratio >= 0.25) return "bg-rose-500/18 border-rose-500/30 text-rose-950 dark:text-rose-200 font-medium"
    return "bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200"
  }
}

// Color class based on active overlay switch
function getOverlayDayClass(day: CalendarDay, overlay: OverlayType, maxAbs: number, metric: MetricType): string {
  if (day.tradeCount === 0) {
    return day.isCurrentMonth
      ? "bg-card hover:bg-muted/40 border-border/60 text-muted-foreground/80"
      : "bg-muted/10 opacity-35 border-dashed border-border/40 text-muted-foreground/40"
  }

  if (overlay === "pnl") {
    const val = metric === "dollar" ? day.netPnL : metric === "r" ? day.realizedRR : day.percentReturn
    return getPnLHeatClass(val, maxAbs)
  }

  if (overlay === "mood") {
    if (!day.dominantMood) return "bg-card border-border/60"
    switch (day.dominantMood) {
      case "CONFIDENT":
      case "CALM":
        return "bg-teal-500/20 border-teal-500/35 text-teal-950 dark:text-teal-100 font-semibold"
      case "FOMO":
      case "IMPATIENT":
        return "bg-amber-500/22 border-amber-500/40 text-amber-950 dark:text-amber-100 font-semibold"
      case "ANXIOUS":
        return "bg-purple-500/20 border-purple-500/35 text-purple-950 dark:text-purple-100 font-semibold"
      case "REVENGE":
        return "bg-rose-500/30 border-rose-500/50 text-rose-950 dark:text-rose-100 font-bold"
      default:
        return "bg-card border-border/60"
    }
  }

  if (overlay === "mistakes") {
    if (!day.hasMistake) {
      return "bg-emerald-500/18 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 font-semibold"
    }
    const mistakeCount = day.trades.filter(t => t.mistakeTag && t.mistakeTag !== "NONE").length
    if (mistakeCount > 1) {
      return "bg-rose-500/30 border-rose-500/45 text-rose-950 dark:text-rose-100 font-bold"
    }
    return "bg-amber-500/25 border-amber-500/40 text-amber-950 dark:text-amber-100 font-semibold"
  }

  if (overlay === "conviction") {
    const avg = day.avgConviction || 3
    if (avg >= 4.5) return "bg-amber-500/35 border-amber-500/50 text-amber-950 dark:text-amber-100 font-bold"
    if (avg >= 3.5) return "bg-amber-500/25 border-amber-500/40 text-amber-950 dark:text-amber-100 font-semibold"
    if (avg >= 2.5) return "bg-amber-500/15 border-amber-500/30 text-amber-950 dark:text-amber-200 font-medium"
    return "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
  }

  return "bg-card border-border/60"
}

// ==========================================
// MAIN COMPONENT
// ==========================================

interface CalendarViewProps {
  trades?: Trade[]
  onSelectTrade?: (trade: Trade) => void
}

export function CalendarView(props: CalendarViewProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const context = useTrades()

  const rawTrades = props.trades ?? context.trades
  const onSelectTrade = props.onSelectTrade ?? context.openEditTradeModal
  const startingBalance = context.startingBalance || 10000

  // ------------------------------------------
  // URL PARAMS / STATE SYNCHRONIZATION
  // ------------------------------------------

  // Metric Toggle: $ | R | %
  const [metric, setMetric] = React.useState<MetricType>(() => {
    const m = searchParams?.get("metric")
    if (m === "r" || m === "percent" || m === "dollar") return m
    return "dollar"
  })

  // Overlay Switch: P&L | Mood | Mistakes | Conviction
  const [overlay, setOverlay] = React.useState<OverlayType>(() => {
    const o = searchParams?.get("overlay")
    if (o === "mood" || o === "mistakes" || o === "conviction" || o === "pnl") return o
    return "pnl"
  })

  // Filters
  const [filters, setFilters] = React.useState<CalendarFilters>(() => ({
    instrument: searchParams?.get("instrument") || "ALL",
    strategy: searchParams?.get("strategy") || "ALL",
    session: searchParams?.get("session") || "ALL",
    direction: searchParams?.get("direction") || "ALL",
    account: searchParams?.get("account") || "ALL"
  }))

  // Current Visible Month / Year (0-indexed month)
  const [currentDate, setCurrentDate] = React.useState<Date>(() => {
    const mParam = searchParams?.get("month")
    if (mParam && /^\d{4}-\d{2}$/.test(mParam)) {
      const [y, m] = mParam.split("-").map(Number)
      return new Date(y, m - 1, 1)
    }
    // Default to latest trade date if available, otherwise current date
    if (rawTrades.length > 0) {
      const sorted = [...rawTrades].sort((a, b) => (b.exitDate || b.entryDate).localeCompare(a.exitDate || a.entryDate))
      const latest = new Date(sorted[0].exitDate || sorted[0].entryDate)
      if (!isNaN(latest.getTime())) {
        return new Date(latest.getFullYear(), latest.getMonth(), 1)
      }
    }
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // Selected Day for Drawer
  const [selectedDay, setSelectedDay] = React.useState<CalendarDay | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  // Quick Reflection Editing in Drawer
  const [quickReflectionTradeId, setQuickReflectionTradeId] = React.useState<string | null>(null)
  const [quickReflectionText, setQuickReflectionText] = React.useState("")
  const [isSavingReflection, setIsSavingReflection] = React.useState(false)

  // Insights Collapsible State
  const [insightsOpen, setInsightsOpen] = React.useState(true)

  // Keyboard navigation focus index
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
  const dayButtonRefs = React.useRef<Record<number, HTMLButtonElement | null>>({})

  // Update URL search parameters
  const updateUrl = React.useCallback(
    (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() || "")
      for (const [k, v] of Object.entries(newParams)) {
        if (!v || v === "ALL" || (k === "metric" && v === "dollar") || (k === "overlay" && v === "pnl")) {
          params.delete(k)
        } else {
          params.set(k, v)
        }
      }
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const handleMetricChange = (newMetric: MetricType) => {
    setMetric(newMetric)
    updateUrl({ metric: newMetric })
  }

  const handleOverlayChange = (newOverlay: OverlayType) => {
    setOverlay(newOverlay)
    updateUrl({ overlay: newOverlay })
  }

  const handleFilterChange = (key: keyof CalendarFilters, val: string) => {
    const next = { ...filters, [key]: val }
    setFilters(next)
    updateUrl({ [key]: val })
  }

  const handleResetFilters = () => {
    const reset: CalendarFilters = {
      instrument: "ALL",
      strategy: "ALL",
      session: "ALL",
      direction: "ALL",
      account: "ALL"
    }
    setFilters(reset)
    updateUrl({
      instrument: null,
      strategy: null,
      session: null,
      direction: null,
      account: null
    })
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== "ALL")

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      const mStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
      updateUrl({ month: mStr })
      return next
    })
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      const mStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
      updateUrl({ month: mStr })
      return next
    })
  }

  const handleToday = () => {
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth(), 1)
    setCurrentDate(next)
    const mStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
    updateUrl({ month: mStr })
  }

  // ------------------------------------------
  // FILTERING TRADES
  // ------------------------------------------

  // Available filter options derived from dataset
  const availableInstruments = React.useMemo(() => {
    const set = new Set<string>()
    rawTrades.forEach(t => { if (t.instrument) set.add(t.instrument) })
    return Array.from(set).sort()
  }, [rawTrades])

  const availableStrategies = React.useMemo(() => {
    const set = new Set<string>()
    rawTrades.forEach(t => { if (t.strategy) set.add(t.strategy) })
    return Array.from(set).sort()
  }, [rawTrades])

  // Filtered Trades
  const filteredTrades = React.useMemo(() => {
    return rawTrades.filter(t => {
      if (filters.instrument !== "ALL" && t.instrument !== filters.instrument) return false
      if (filters.strategy !== "ALL" && t.strategy !== filters.strategy) return false
      if (filters.session !== "ALL" && t.session !== filters.session) return false
      if (filters.direction !== "ALL" && t.direction !== filters.direction) return false
      return true
    })
  }, [rawTrades, filters])

  // Group trades by "YYYY-MM-DD"
  const tradesByDate = React.useMemo(() => {
    const map = new Map<string, Trade[]>()
    for (const trade of filteredTrades) {
      const dKey = (trade.exitDate || trade.entryDate).slice(0, 10)
      const list = map.get(dKey) || []
      list.push(trade)
      map.set(dKey, list)
    }
    return map
  }, [filteredTrades])

  // ------------------------------------------
  // MONTH GRID DATA CALCULATION
  // ------------------------------------------

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { weeks, activeDaysCount, maxAbsMonthMetric, monthSummaryStats, allVisibleDays } = React.useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInCurMonth = lastDay.getDate()

    // Day of week for 1st day (0 = Mon, 6 = Sun)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7

    const prevMonthLastDay = new Date(year, month, 0).getDate()

    const todayStr = formatLocalDateKey(new Date())

    const rawWeeks: CalendarDay[][] = []
    let currentWeek: CalendarDay[] = []

    // 1. Padding days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDayNum = prevMonthLastDay - i
      const pDate = new Date(year, month - 1, pDayNum)
      const dKey = formatLocalDateKey(pDate)
      const dayTrades = tradesByDate.get(dKey) || []

      const net = dayTrades.reduce((acc, t) => acc + t.netPnL, 0)
      const r = dayTrades.reduce((acc, t) => acc + t.realizedRR, 0)
      const pct = (net / startingBalance) * 100
      const winCount = dayTrades.filter(t => t.netPnL > 0).length
      const lossCount = dayTrades.filter(t => t.netPnL < 0).length
      const hasMistake = dayTrades.some(t => t.mistakeTag && t.mistakeTag !== "NONE")
      const isClean = dayTrades.length > 0 && !hasMistake

      // Dominant mood
      const moodCounts: Record<string, number> = {}
      dayTrades.forEach(t => { moodCounts[t.preTradeEmotion] = (moodCounts[t.preTradeEmotion] || 0) + 1 })
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as PreTradeEmotion | undefined

      // Avg conviction
      const avgConviction = dayTrades.length > 0
        ? dayTrades.reduce((acc, t) => acc + (t.preTradeConfidence || 3), 0) / dayTrades.length
        : undefined

      currentWeek.push({
        date: pDate,
        dateKey: dKey,
        dayNumber: pDayNum,
        isCurrentMonth: false,
        isToday: dKey === todayStr,
        trades: dayTrades,
        netPnL: net,
        realizedRR: r,
        percentReturn: pct,
        tradeCount: dayTrades.length,
        winCount,
        lossCount,
        hasMistake,
        isClean,
        dominantMood,
        avgConviction
      })
    }

    // 2. Days of current month
    for (let d = 1; d <= daysInCurMonth; d++) {
      const curDate = new Date(year, month, d)
      const dKey = formatLocalDateKey(curDate)
      const dayTrades = tradesByDate.get(dKey) || []

      const net = dayTrades.reduce((acc, t) => acc + t.netPnL, 0)
      const r = dayTrades.reduce((acc, t) => acc + t.realizedRR, 0)
      const pct = (net / startingBalance) * 100
      const winCount = dayTrades.filter(t => t.netPnL > 0).length
      const lossCount = dayTrades.filter(t => t.netPnL < 0).length
      const hasMistake = dayTrades.some(t => t.mistakeTag && t.mistakeTag !== "NONE")
      const isClean = dayTrades.length > 0 && !hasMistake

      const moodCounts: Record<string, number> = {}
      dayTrades.forEach(t => { moodCounts[t.preTradeEmotion] = (moodCounts[t.preTradeEmotion] || 0) + 1 })
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as PreTradeEmotion | undefined

      const avgConviction = dayTrades.length > 0
        ? dayTrades.reduce((acc, t) => acc + (t.preTradeConfidence || 3), 0) / dayTrades.length
        : undefined

      currentWeek.push({
        date: curDate,
        dateKey: dKey,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dKey === todayStr,
        trades: dayTrades,
        netPnL: net,
        realizedRR: r,
        percentReturn: pct,
        tradeCount: dayTrades.length,
        winCount,
        lossCount,
        hasMistake,
        isClean,
        dominantMood,
        avgConviction
      })

      if (currentWeek.length === 7) {
        rawWeeks.push(currentWeek)
        currentWeek = []
      }
    }

    // 3. Padding days into next month to complete the last week
    if (currentWeek.length > 0) {
      let nextDayNum = 1
      while (currentWeek.length < 7) {
        const nDate = new Date(year, month + 1, nextDayNum)
        const dKey = formatLocalDateKey(nDate)
        const dayTrades = tradesByDate.get(dKey) || []

        const net = dayTrades.reduce((acc, t) => acc + t.netPnL, 0)
        const r = dayTrades.reduce((acc, t) => acc + t.realizedRR, 0)
        const pct = (net / startingBalance) * 100
        const winCount = dayTrades.filter(t => t.netPnL > 0).length
        const lossCount = dayTrades.filter(t => t.netPnL < 0).length
        const hasMistake = dayTrades.some(t => t.mistakeTag && t.mistakeTag !== "NONE")
        const isClean = dayTrades.length > 0 && !hasMistake

        currentWeek.push({
          date: nDate,
          dateKey: dKey,
          dayNumber: nextDayNum,
          isCurrentMonth: false,
          isToday: dKey === todayStr,
          trades: dayTrades,
          netPnL: net,
          realizedRR: r,
          percentReturn: pct,
          tradeCount: dayTrades.length,
          winCount,
          lossCount,
          hasMistake,
          isClean
        })
        nextDayNum++
      }
      rawWeeks.push(currentWeek)
    }

    // Calculate max absolute values for intensity scaling (from current month active days)
    const currentMonthDays = rawWeeks.flat().filter(d => d.isCurrentMonth && d.tradeCount > 0)
    let maxAbsDollar = 0
    let maxAbsR = 0
    let maxAbsPct = 0

    currentMonthDays.forEach(d => {
      maxAbsDollar = Math.max(maxAbsDollar, Math.abs(d.netPnL))
      maxAbsR = Math.max(maxAbsR, Math.abs(d.realizedRR))
      maxAbsPct = Math.max(maxAbsPct, Math.abs(d.percentReturn))
    })

    const maxAbs = metric === "dollar" ? maxAbsDollar : metric === "r" ? maxAbsR : maxAbsPct

    // Precalculate Weekly Summaries
    const completedWeeks = rawWeeks.map((weekDays, idx) => {
      const wNet = weekDays.reduce((acc, d) => acc + d.netPnL, 0)
      const wR = weekDays.reduce((acc, d) => acc + d.realizedRR, 0)
      const wPct = (wNet / startingBalance) * 100
      const wTrades = weekDays.reduce((acc, d) => acc + d.tradeCount, 0)
      const wWins = weekDays.reduce((acc, d) => acc + d.winCount, 0)
      const winRate = wTrades > 0 ? (wWins / wTrades) * 100 : 0

      const summary: WeekSummary = {
        weekNumber: idx + 1,
        netPnL: wNet,
        realizedRR: wR,
        percentReturn: wPct,
        tradeCount: wTrades,
        winRate
      }

      return {
        days: weekDays,
        summary
      }
    })

    // Month summary statistics
    let totalMonthNet = 0
    let totalMonthGrossProfit = 0
    let totalMonthGrossLoss = 0
    let totalMonthTrades = 0
    let totalMonthWins = 0
    let totalMonthR = 0
    let bestDay = { net: -Infinity, dateKey: "" }
    let worstDay = { net: Infinity, dateKey: "" }

    // Active day streak calculation
    const sortedActiveDays = [...currentMonthDays].sort((a, b) => a.dateKey.localeCompare(b.dateKey))

    sortedActiveDays.forEach(d => {
      totalMonthNet += d.netPnL
      totalMonthTrades += d.tradeCount
      totalMonthWins += d.winCount
      totalMonthR += d.realizedRR

      d.trades.forEach(t => {
        if (t.netPnL > 0) totalMonthGrossProfit += t.netPnL
        else totalMonthGrossLoss += Math.abs(t.netPnL)
      })

      if (d.netPnL > bestDay.net) bestDay = { net: d.netPnL, dateKey: d.dateKey }
      if (d.netPnL < worstDay.net) worstDay = { net: d.netPnL, dateKey: d.dateKey }
    })

    // Streak of active days (consecutive winning or losing days up to the latest active day)
    let streakCount = 0
    let streakType: "W" | "L" | null = null
    for (let i = sortedActiveDays.length - 1; i >= 0; i--) {
      const isWin = sortedActiveDays[i].netPnL > 0
      const isLoss = sortedActiveDays[i].netPnL < 0
      if (!streakType) {
        if (isWin) streakType = "W"
        else if (isLoss) streakType = "L"
        streakCount = 1
      } else if ((streakType === "W" && isWin) || (streakType === "L" && isLoss)) {
        streakCount++
      } else {
        break
      }
    }

    const winRate = totalMonthTrades > 0 ? (totalMonthWins / totalMonthTrades) * 100 : 0
    const profitFactor = totalMonthGrossLoss > 0
      ? totalMonthGrossProfit / totalMonthGrossLoss
      : totalMonthGrossProfit > 0 ? 99.9 : 0
    const avgR = totalMonthTrades > 0 ? totalMonthR / totalMonthTrades : 0

    const stats = {
      netPnL: totalMonthNet,
      winRate,
      profitFactor,
      avgR,
      bestDay: bestDay.net !== -Infinity ? bestDay : null,
      worstDay: worstDay.net !== Infinity ? worstDay : null,
      streak: streakType ? `${streakCount}${streakType}` : "—"
    }

    const flatDays = completedWeeks.flatMap(w => w.days)

    return {
      weeks: completedWeeks,
      activeDaysCount: currentMonthDays.length,
      maxAbsMonthMetric: maxAbs || 1,
      monthSummaryStats: stats,
      allVisibleDays: flatDays
    }
  }, [year, month, tradesByDate, metric, startingBalance])

  // ------------------------------------------
  // INSIGHTS COMPUTATION
  // ------------------------------------------

  const insightsData = React.useMemo(() => {
    // Current month trades
    const monthTrades = filteredTrades.filter(t => {
      const d = (t.exitDate || t.entryDate).slice(0, 7)
      return d === `${year}-${String(month + 1).padStart(2, "0")}`
    })

    // 1. Day of Week Performance
    const dowMap: Record<number, { name: string; net: number; wins: number; total: number }> = {
      1: { name: "Monday", net: 0, wins: 0, total: 0 },
      2: { name: "Tuesday", net: 0, wins: 0, total: 0 },
      3: { name: "Wednesday", net: 0, wins: 0, total: 0 },
      4: { name: "Thursday", net: 0, wins: 0, total: 0 },
      5: { name: "Friday", net: 0, wins: 0, total: 0 }
    }
    monthTrades.forEach(t => {
      const d = new Date(t.exitDate || t.entryDate)
      const day = d.getDay() // 0=Sun, 1=Mon, ..., 5=Fri
      if (dowMap[day]) {
        dowMap[day].net += t.netPnL
        dowMap[day].total += 1
        if (t.netPnL > 0) dowMap[day].wins += 1
      }
    })
    const dowList = Object.values(dowMap).map(item => ({
      ...item,
      winRate: item.total > 0 ? Math.round((item.wins / item.total) * 100) : 0
    }))

    // 2. Session Performance
    const sessionMap: Record<string, { label: string; net: number; wins: number; total: number }> = {
      LONDON: { label: "London", net: 0, wins: 0, total: 0 },
      NEW_YORK: { label: "New York", net: 0, wins: 0, total: 0 },
      ASIAN: { label: "Asian", net: 0, wins: 0, total: 0 },
      OVERLAP_LONDON_NY: { label: "London / NY Overlap", net: 0, wins: 0, total: 0 }
    }
    monthTrades.forEach(t => {
      if (sessionMap[t.session]) {
        sessionMap[t.session].net += t.netPnL
        sessionMap[t.session].total += 1
        if (t.netPnL > 0) sessionMap[t.session].wins += 1
      }
    })
    const sessionList = Object.values(sessionMap).map(item => ({
      ...item,
      winRate: item.total > 0 ? Math.round((item.wins / item.total) * 100) : 0
    }))

    // 3. Cost of Mistakes by Tag
    const mistakeMap: Record<string, { label: string; cost: number; count: number }> = {
      CHASED_PRICE: { label: "Chased Price / FOMO", cost: 0, count: 0 },
      OVER_LEVERAGED: { label: "Over-leveraged Size", cost: 0, count: 0 },
      EARLY_EXIT: { label: "Premature Exit", cost: 0, count: 0 },
      IGNORED_NEWS: { label: "High-Impact News Collision", cost: 0, count: 0 },
      REVENGE_TRADING: { label: "Revenge Execution", cost: 0, count: 0 },
      NO_STOP_LOSS: { label: "No Stop Loss", cost: 0, count: 0 },
      TRADED_OUTSIDE_PLAN: { label: "Outside Plan Criteria", cost: 0, count: 0 }
    }
    monthTrades.forEach(t => {
      if (t.mistakeTag && t.mistakeTag !== "NONE" && mistakeMap[t.mistakeTag]) {
        mistakeMap[t.mistakeTag].cost += t.netPnL < 0 ? Math.abs(t.netPnL) : 0
        mistakeMap[t.mistakeTag].count += 1
      }
    })
    const mistakeList = Object.values(mistakeMap)
      .filter(m => m.count > 0)
      .sort((a, b) => b.cost - a.cost)

    // 4. Mental State vs Win Rate
    const emotionMap: Record<string, { label: string; net: number; wins: number; total: number }> = {
      CONFIDENT: { label: "Confident & Centered", net: 0, wins: 0, total: 0 },
      CALM: { label: "Calm & Neutral", net: 0, wins: 0, total: 0 },
      FOMO: { label: "FOMO (Impulsive)", net: 0, wins: 0, total: 0 },
      ANXIOUS: { label: "Anxious / Hesitant", net: 0, wins: 0, total: 0 },
      REVENGE: { label: "Revenge Mindset", net: 0, wins: 0, total: 0 },
      IMPATIENT: { label: "Impatient / Bored", net: 0, wins: 0, total: 0 }
    }
    monthTrades.forEach(t => {
      if (emotionMap[t.preTradeEmotion]) {
        emotionMap[t.preTradeEmotion].net += t.netPnL
        emotionMap[t.preTradeEmotion].total += 1
        if (t.netPnL > 0) emotionMap[t.preTradeEmotion].wins += 1
      }
    })
    const emotionList = Object.values(emotionMap)
      .filter(e => e.total > 0)
      .map(e => ({
        ...e,
        winRate: Math.round((e.wins / e.total) * 100)
      }))
      .sort((a, b) => b.winRate - a.winRate)

    // 5. Trades-Per-Day vs P&L (Overtrading Detection)
    const dayBuckets: Record<string, { label: string; net: number; wins: number; total: number; daysCount: number }> = {
      "1": { label: "1 trade/day", net: 0, wins: 0, total: 0, daysCount: 0 },
      "2": { label: "2 trades/day", net: 0, wins: 0, total: 0, daysCount: 0 },
      "3": { label: "3 trades/day", net: 0, wins: 0, total: 0, daysCount: 0 },
      "4+": { label: "4+ trades/day", net: 0, wins: 0, total: 0, daysCount: 0 }
    }

    // Iterate over active days in this month
    const activeDaysInMonth = Array.from(tradesByDate.entries()).filter(([key]) =>
      key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)
    )

    activeDaysInMonth.forEach(([_, dTrades]) => {
      const count = dTrades.length
      const bucketKey = count === 1 ? "1" : count === 2 ? "2" : count === 3 ? "3" : "4+"
      const bucket = dayBuckets[bucketKey]
      bucket.daysCount += 1
      dTrades.forEach(t => {
        bucket.net += t.netPnL
        bucket.total += 1
        if (t.netPnL > 0) bucket.wins += 1
      })
    })

    const tradeDensityList = Object.values(dayBuckets).map(b => ({
      ...b,
      winRate: b.total > 0 ? Math.round((b.wins / b.total) * 100) : 0
    }))

    return {
      monthTradeCount: monthTrades.length,
      dowList,
      sessionList,
      mistakeList,
      emotionList,
      tradeDensityList
    }
  }, [filteredTrades, year, month, tradesByDate])

  // ------------------------------------------
  // KEYBOARD NAVIGATION HANDLER
  // ------------------------------------------

  const handleDayKeyDown = (e: React.KeyboardEvent, index: number, day: CalendarDay) => {
    let nextIndex = index
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      nextIndex = Math.max(0, index - 1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      nextIndex = Math.min(allVisibleDays.length - 1, index + 1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      nextIndex = Math.max(0, index - 7)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      nextIndex = Math.min(allVisibleDays.length - 1, index + 7)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setSelectedDay(day)
      setDrawerOpen(true)
      return
    } else {
      return
    }

    const nextDay = allVisibleDays[nextIndex]
    if (nextDay) {
      setFocusedIndex(nextIndex)
      dayButtonRefs.current[nextIndex]?.focus()
    }
  }

  // ------------------------------------------
  // QUICK REFLECTION SAVE IN DRAWER
  // ------------------------------------------

  const handleSaveQuickReflection = async (trade: Trade) => {
    if (!quickReflectionText.trim()) return
    setIsSavingReflection(true)
    try {
      await context.saveTrade({
        ...trade,
        lessonsLearned: quickReflectionText.trim()
      })
      // Update local day state
      if (selectedDay) {
        setSelectedDay({
          ...selectedDay,
          trades: selectedDay.trades.map(t =>
            t.id === trade.id ? { ...t, lessonsLearned: quickReflectionText.trim() } : t
          )
        })
      }
      setQuickReflectionTradeId(null)
      setQuickReflectionText("")
    } catch (err) {
      console.error("Failed to save reflection note:", err)
    } finally {
      setIsSavingReflection(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ========================================================= */}
      {/* 1. HEADER: Title, Active Days, Month Navigator, Metric    */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <span>Trading Calendar & Daily PnL Heatmap</span>
            </h1>
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 font-bold border-primary/30 bg-primary/5 text-foreground">
              {activeDaysCount} active {activeDaysCount === 1 ? "day" : "days"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Day-by-day month execution grid, emotional discipline heatmap, and habit attribution.
          </p>
        </div>

        {/* Controls: Month Navigator & Segmented Metric Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0 hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-8 px-2.5 text-xs font-semibold hover:bg-muted"
            >
              Today
            </Button>
            <span className="font-bold text-xs sm:text-sm px-2.5 min-w-[120px] text-center select-none font-mono">
              {MONTH_NAMES[month]} {year}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0 hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Segmented Metric Toggle: $ | R | % */}
          <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1 shadow-2xs" role="group" aria-label="Selected PnL Metric">
            <button
              type="button"
              onClick={() => handleMetricChange("dollar")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                metric === "dollar"
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={metric === "dollar"}
              aria-label="Show dollar PnL"
            >
              $
            </button>
            <button
              type="button"
              onClick={() => handleMetricChange("r")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                metric === "r"
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={metric === "r"}
              aria-label="Show R-multiple"
            >
              R
            </button>
            <button
              type="button"
              onClick={() => handleMetricChange("percent")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                metric === "percent"
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={metric === "percent"}
              aria-label="Show percentage return"
            >
              %
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUMMARY STRIP: One Row, Compact 7 Core Metrics        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
        {/* 2.1 Net PnL */}
        <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Net P&L ({MONTH_NAMES[month].slice(0, 3)})
          </span>
          <span
            className={cn(
              "font-mono text-base sm:text-lg font-bold tracking-tight block",
              monthSummaryStats.netPnL >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {formatSignedCurrency(monthSummaryStats.netPnL)}
          </span>
        </div>

        {/* 2.2 Win Rate */}
        <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Win Rate
          </span>
          <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-foreground block">
            {monthSummaryStats.winRate.toFixed(1)}%
          </span>
        </div>

        {/* 2.3 Profit Factor */}
        <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Profit Factor
          </span>
          <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-foreground block">
            {monthSummaryStats.profitFactor.toFixed(2)}
          </span>
        </div>

        {/* 2.4 Avg R */}
        <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Avg R / Trade
          </span>
          <span
            className={cn(
              "font-mono text-base sm:text-lg font-bold tracking-tight block",
              monthSummaryStats.avgR >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {formatSignedR(monthSummaryStats.avgR)}
          </span>
        </div>

        {/* 2.5 Best Day */}
        <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Best Day
          </span>
          <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400 block truncate">
            {monthSummaryStats.bestDay
              ? formatSignedCurrency(monthSummaryStats.bestDay.net)
              : "—"}
          </span>
        </div>

        {/* 2.6 Worst Day */}
        <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Worst Day
          </span>
          <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-rose-600 dark:text-rose-400 block truncate">
            {monthSummaryStats.worstDay
              ? formatSignedCurrency(monthSummaryStats.worstDay.net)
              : "—"}
          </span>
        </div>

        {/* 2.7 Current Streak */}
        <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Current Streak
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-mono text-base sm:text-lg font-bold tracking-tight",
                monthSummaryStats.streak.includes("W")
                  ? "text-emerald-600 dark:text-emerald-400"
                  : monthSummaryStats.streak.includes("L")
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              )}
            >
              {monthSummaryStats.streak}
            </span>
            <span className="text-[11px] text-muted-foreground">active days</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 & 7. OVERLAY SWITCH & LIVE FILTERS                     */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
          {/* Overlay Switch: P&L | Mood | Mistakes | Conviction */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mr-1">
              <Brain className="h-3.5 w-3.5 text-primary" />
              Recolor Overlay:
            </span>
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => handleOverlayChange("pnl")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                  overlay === "pnl"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                P&L
              </button>
              <button
                type="button"
                onClick={() => handleOverlayChange("mood")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                  overlay === "mood"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Mood
              </button>
              <button
                type="button"
                onClick={() => handleOverlayChange("mistakes")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                  overlay === "mistakes"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Mistakes
              </button>
              <button
                type="button"
                onClick={() => handleOverlayChange("conviction")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                  overlay === "conviction"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Conviction
              </button>
            </div>
          </div>

          {/* Overlay Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {overlay === "pnl" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-500/40 border border-emerald-500/60" />
                  <span>Gain Intensity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-rose-500/40 border border-rose-500/60" />
                  <span>Loss Intensity</span>
                </div>
              </>
            )}
            {overlay === "mood" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-teal-500/40 border border-teal-500/60" />
                  <span>Calm/Confident</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-amber-500/40 border border-amber-500/60" />
                  <span>FOMO/Anxious</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-rose-500/40 border border-rose-500/60" />
                  <span>Revenge</span>
                </div>
              </>
            )}
            {overlay === "mistakes" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />
                  <span>Clean</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-amber-500/40 border border-amber-500/60" />
                  <span>1 Error</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-rose-500/40 border border-rose-500/60" />
                  <span>Multiple Errors</span>
                </div>
              </>
            )}
            {overlay === "conviction" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-amber-500/15 border border-amber-500/30" />
                  <span>Low (1-2★)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-amber-500/40 border border-amber-500/60" />
                  <span>High (4-5★)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 7. LIVE FILTERS ROW: Instrument, Strategy, Session, Direction, Account */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 rounded-xl border border-border/80 bg-muted/20">
          {/* Instrument Filter */}
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Instrument
            </Label>
            <Select
              value={filters.instrument}
              onValueChange={v => { if (v) handleFilterChange("instrument", v) }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Pairs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Instruments</SelectItem>
                {availableInstruments.map(sym => (
                  <SelectItem key={sym} value={sym}>
                    {sym}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strategy Filter */}
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Strategy
            </Label>
            <Select
              value={filters.strategy}
              onValueChange={v => { if (v) handleFilterChange("strategy", v) }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Strategies</SelectItem>
                {availableStrategies.map(strat => (
                  <SelectItem key={strat} value={strat}>
                    {strat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Filter */}
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Session
            </Label>
            <Select
              value={filters.session}
              onValueChange={v => { if (v) handleFilterChange("session", v) }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sessions</SelectItem>
                <SelectItem value="LONDON">London Session</SelectItem>
                <SelectItem value="NEW_YORK">New York Session</SelectItem>
                <SelectItem value="ASIAN">Asian Session</SelectItem>
                <SelectItem value="OVERLAP_LONDON_NY">London/NY Overlap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Direction Filter */}
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Direction
            </Label>
            <Select
              value={filters.direction}
              onValueChange={v => { if (v) handleFilterChange("direction", v) }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Both Directions</SelectItem>
                <SelectItem value="LONG">BUY (Long)</SelectItem>
                <SelectItem value="SHORT">SELL (Short)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Filter */}
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Account
            </Label>
            <Select
              value={filters.account}
              onValueChange={v => { if (v) handleFilterChange("account", v) }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Accounts</SelectItem>
                <SelectItem value="DEFAULT">Main Account ($10k)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="h-8 w-full text-xs gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MONTH GRID: 7 Columns (Mon-Sun) + 8th "Week" Column   */}
      {/* ========================================================= */}
      {activeDaysCount === 0 && filteredTrades.length === 0 ? (
        /* 8. EMPTY MONTH STATE */
        <Card className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
              <CalendarIcon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                No trades recorded for {MONTH_NAMES[month]} {year}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "No trade executions match your current filter criteria for this month."
                  : "Begin tracking daily consistency and psychological confluences by logging your first trade."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                  Reset Filters
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => context.openNewTradeModal()}
                className="bg-primary text-primary-foreground text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Log Trade Entry
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
          {/* Scroll container for responsiveness on small viewports */}
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* 8-Column Grid Header */}
              <div className="grid grid-cols-8 border-b border-border/70 bg-muted/30 text-xs font-semibold text-muted-foreground text-center">
                {WEEKDAYS.map(dayName => (
                  <div key={dayName} className="py-2.5 px-2 border-r border-border/50">
                    {dayName}
                  </div>
                ))}
                <div className="py-2.5 px-2 font-bold uppercase tracking-wider text-foreground bg-muted/60">
                  Week Total
                </div>
              </div>

              {/* Month Week Rows */}
              <div role="grid" aria-label={`Trading Calendar for ${MONTH_NAMES[month]} ${year}`}>
                {weeks.map((weekObj, weekIndex) => (
                  <div
                    key={`week-${weekIndex}`}
                    role="row"
                    className="grid grid-cols-8 border-b border-border/50 last:border-b-0"
                  >
                    {/* 7 Day Cells */}
                    {weekObj.days.map((day, dayIndex) => {
                      const overallIndex = weekIndex * 7 + dayIndex
                      const overlayClass = getOverlayDayClass(day, overlay, maxAbsMonthMetric, metric)

                      // Accessible Label
                      const ariaLabel = `${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${
                        day.tradeCount > 0
                          ? `${formatDayMetric(day, metric)}, ${day.tradeCount} trade${day.tradeCount > 1 ? "s" : ""}, ${
                              day.hasMistake ? "mistake tagged" : "clean execution"
                            }`
                          : "no trades logged"
                      }`

                      const cellKey = `cell-${day.dateKey}-${day.isCurrentMonth ? "cur" : "pad"}-${overallIndex}`

                      return (
                        <button
                          key={cellKey}
                          ref={el => { dayButtonRefs.current[overallIndex] = el }}
                          type="button"
                          role="gridcell"
                          tabIndex={focusedIndex === overallIndex || (focusedIndex === null && overallIndex === 0) ? 0 : -1}
                          aria-label={ariaLabel}
                          onClick={() => {
                            setSelectedDay(day)
                            setDrawerOpen(true)
                          }}
                          onKeyDown={e => handleDayKeyDown(e, overallIndex, day)}
                          className={cn(
                            "relative min-h-[68px] sm:min-h-[74px] p-2 border-r border-border/50 text-left transition-all flex flex-col justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset",
                            overlayClass,
                            day.isToday && "ring-1 ring-primary ring-inset font-bold"
                          )}
                        >
                          {/* Day Number Strip & Status Indicators */}
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span
                              className={cn(
                                "text-xs font-mono select-none",
                                day.isCurrentMonth
                                  ? "text-foreground font-semibold"
                                  : "text-muted-foreground/40",
                                day.isToday && "text-primary font-extrabold"
                              )}
                            >
                              {day.dayNumber}
                            </span>

                            {/* Small Status Indicator Dots */}
                            {day.tradeCount > 0 && (
                              <div className="flex items-center gap-1">
                                {day.hasMistake ? (
                                  <span
                                    className="h-2 w-2 rounded-full bg-rose-500 shadow-2xs inline-block"
                                    title="Mistake classified on this day"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <span title="Clean execution following plan" className="inline-flex items-center">
                                    <Check
                                      className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[3]"
                                      aria-hidden="true"
                                    />
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Day Net Value & Trade Count */}
                          {day.tradeCount > 0 ? (
                            <div className="mt-1">
                              <span className="font-mono text-xs sm:text-sm font-bold tracking-tight block truncate">
                                {formatDayMetric(day, metric)}
                              </span>
                              <span className="text-[10px] text-muted-foreground/80 font-mono block">
                                {day.tradeCount} trade{day.tradeCount > 1 ? "s" : ""}
                              </span>
                            </div>
                          ) : (
                            <div className="h-5" />
                          )}
                        </button>
                      )
                    })}

                    {/* 8th Column: Weekly Rollup Total */}
                    <div
                      className="p-2 sm:p-2.5 bg-muted/40 border-l border-border/70 flex flex-col justify-center text-right"
                      role="gridcell"
                      aria-label={`Week ${weekObj.summary.weekNumber} total: ${formatWeekMetric(weekObj.summary, metric)}, ${weekObj.summary.tradeCount} trades`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-0.5">
                        W{weekObj.summary.weekNumber} Net
                      </span>
                      <span
                        className={cn(
                          "font-mono text-xs sm:text-sm font-bold tracking-tight block truncate",
                          weekObj.summary.netPnL > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : weekObj.summary.netPnL < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatWeekMetric(weekObj.summary, metric)}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground block">
                        {weekObj.summary.tradeCount > 0
                          ? `${weekObj.summary.tradeCount} trd • ${Math.round(weekObj.summary.winRate)}% W`
                          : "No trades"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. DAY DRAWER (Right-side Sheet for Day Details)         */}
      {/* ========================================================= */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 gap-0">
          {selectedDay && (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <SheetHeader className="p-5 border-b border-border/70 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[11px] font-semibold">
                    {selectedDay.date.toLocaleDateString("en-US", { weekday: "long" })}
                  </Badge>
                  <span
                    className={cn(
                      "font-mono text-sm font-extrabold px-2 py-0.5 rounded-lg border",
                      selectedDay.netPnL >= 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    )}
                  >
                    {formatSignedCurrency(selectedDay.netPnL)} Net
                  </span>
                </div>
                <SheetTitle className="text-lg font-bold text-foreground mt-1">
                  {selectedDay.date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {selectedDay.tradeCount > 0
                    ? `${selectedDay.tradeCount} trade(s) logged • ${selectedDay.winCount} Wins / ${selectedDay.lossCount} Losses`
                    : "No trading activity logged on this date."}
                </SheetDescription>
              </SheetHeader>

              {/* Drawer Body */}
              <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                {selectedDay.tradeCount === 0 ? (
                  /* Empty Day View */
                  <div className="text-center py-10 space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">No Trades On This Day</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Clean discipline or unlogged executions?
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setDrawerOpen(false)
                        context.openNewTradeModal()
                      }}
                      className="bg-primary text-primary-foreground text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Log Trade for this Day
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Trades List */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                        Trades Executed ({selectedDay.trades.length})
                      </Label>

                      {selectedDay.trades.map(trade => (
                        <div
                          key={trade.id}
                          className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 shadow-2xs hover:border-primary/50 transition-all"
                        >
                          {/* Row 1: Direction, Symbol, Net P&L */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[11px] font-bold font-mono",
                                  trade.direction === "LONG"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                                )}
                              >
                                {trade.direction === "LONG" ? "BUY" : "SELL"}
                              </span>
                              <span className="font-bold font-mono text-sm text-foreground">
                                {trade.instrument}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                                {trade.session}
                              </Badge>
                            </div>

                            <div className="text-right">
                              <span
                                className={cn(
                                  "font-mono text-sm font-bold block",
                                  trade.netPnL >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                )}
                              >
                                {formatSignedCurrency(trade.netPnL)}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {trade.realizedRR}R
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Psychology & Mistake Tag */}
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border border-border">
                              Mindset: {trade.preTradeEmotion}
                            </span>
                            {trade.mistakeTag && trade.mistakeTag !== "NONE" ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-500/30 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-rose-500" />
                                {trade.mistakeTag}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                                <Check className="h-3 w-3 text-emerald-600" />
                                Clean Rules
                              </span>
                            )}
                            {trade.preTradeConfidence && (
                              <span className="text-[10px] text-amber-500 font-bold ml-auto">
                                {"★".repeat(trade.preTradeConfidence)}
                              </span>
                            )}
                          </div>

                          {/* Row 3: Reflection Notes */}
                          {trade.lessonsLearned ? (
                            <div className="rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground border border-border/50">
                              <span className="font-semibold text-foreground block mb-0.5">Reflection:</span>
                              <p className="leading-relaxed italic">&ldquo;{trade.lessonsLearned}&rdquo;</p>
                            </div>
                          ) : (
                            /* Unreviewed prompt if lessons empty */
                            <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                              <span>No reflection notes recorded yet.</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setQuickReflectionTradeId(trade.id)
                                  setQuickReflectionText("")
                                }}
                                className="h-6 text-[10px] px-2 bg-background border-amber-500/40"
                              >
                                Add reflection
                              </Button>
                            </div>
                          )}

                          {/* Quick Reflection Editor */}
                          {quickReflectionTradeId === trade.id && (
                            <div className="space-y-2 pt-1 border-t border-border/50">
                              <Textarea
                                rows={2}
                                value={quickReflectionText}
                                onChange={e => setQuickReflectionText(e.target.value)}
                                placeholder="What did you do right? What will you repeat?"
                                className="text-xs bg-background"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setQuickReflectionTradeId(null)}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isSavingReflection || !quickReflectionText.trim()}
                                  onClick={() => handleSaveQuickReflection(trade)}
                                  className="h-7 text-xs bg-primary text-primary-foreground font-semibold"
                                >
                                  {isSavingReflection ? "Saving..." : "Save Note"}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Row 4: Chart Links & Action Button */}
                          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                            <div className="flex items-center gap-2">
                              {trade.entryScreenshotUrl && (
                                <a
                                  href={trade.entryScreenshotUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                                >
                                  Entry Chart <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {trade.htfScreenshotUrl && (
                                <a
                                  href={trade.htfScreenshotUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                                >
                                  HTF Chart <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setDrawerOpen(false)
                                onSelectTrade(trade)
                              }}
                              className="text-primary hover:underline font-semibold"
                            >
                              Edit Trade ↗
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ========================================================= */}
      {/* 6. INSIGHTS PANEL (Collapsible, Progressive Disclosure)    */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setInsightsOpen(!insightsOpen)}
          className="w-full p-4 sm:px-6 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Monthly Trading Insights & Psychology Analytics
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Weekday bias, session profitability, habit loss attribution, and overtrading thresholds.
              </p>
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground">
            {insightsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {insightsOpen && (
          <div className="p-4 sm:p-6 border-t border-border/70 space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Chart 1: Day of Week Performance */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Day-of-Week Performance
                </span>
                <div className="space-y-2.5 pt-1">
                  {insightsData.dowList.map(dow => {
                    const isPositive = dow.net >= 0
                    return (
                      <div key={dow.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">{dow.name}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[11px] text-muted-foreground">{dow.winRate}% win</span>
                            <span className={cn("font-bold", isPositive ? "text-emerald-600" : "text-rose-600")}>
                              {formatSignedCurrency(dow.net)}
                            </span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", isPositive ? "bg-emerald-500" : "bg-rose-500")}
                            style={{ width: `${Math.min(100, Math.max(8, dow.winRate))}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Chart 2: Session Performance */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Session Performance
                </span>
                <div className="space-y-2.5 pt-1">
                  {insightsData.sessionList.map(session => {
                    const isPositive = session.net >= 0
                    return (
                      <div key={session.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">{session.label}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[11px] text-muted-foreground">{session.total} trds</span>
                            <span className={cn("font-bold", isPositive ? "text-emerald-600" : "text-rose-600")}>
                              {formatSignedCurrency(session.net)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", isPositive ? "bg-emerald-500" : "bg-rose-500")}
                            style={{ width: `${Math.min(100, Math.max(8, session.winRate))}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Chart 3: Cost of Mistakes by Tag */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Cost of Mistakes by Tag
                </span>
                {insightsData.mistakeList.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    No trading errors tagged this month. Outstanding rule execution!
                  </p>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {insightsData.mistakeList.map(mistake => (
                      <div key={mistake.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground truncate max-w-[150px]">
                            {mistake.label}
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[11px] text-muted-foreground">{mistake.count}x</span>
                            <span className="font-bold text-rose-600">
                              -${mistake.cost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rose-500"
                            style={{ width: `${Math.min(100, Math.max(15, (mistake.cost / 500) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chart 4: Mental State vs Win Rate */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Mental State vs Win Rate
                </span>
                <div className="space-y-2.5 pt-1">
                  {insightsData.emotionList.map(em => (
                    <div key={em.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[140px]">{em.label}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[11px] text-muted-foreground">{em.winRate}% win</span>
                          <span className={cn("font-bold", em.net >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {formatSignedCurrency(em.net)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", em.winRate >= 50 ? "bg-teal-500" : "bg-amber-500")}
                          style={{ width: `${Math.min(100, Math.max(8, em.winRate))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 5: Trades-Per-Day vs P&L (Overtrading Detection) */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Trades-Per-Day vs P&L (Overtrading Detection)
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">Daily Execution Density</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {insightsData.tradeDensityList.map(item => (
                    <div key={item.label} className="p-3 rounded-lg bg-card border border-border/60 text-center space-y-1">
                      <span className="text-xs font-bold text-foreground block">{item.label}</span>
                      <span
                        className={cn(
                          "font-mono text-sm font-extrabold block",
                          item.net >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {formatSignedCurrency(item.net)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {item.daysCount} days • {item.winRate}% W
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// SKELETON COMPONENT FOR SUSPENSE / LOADING
// ==========================================

export function CalendarViewSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-border/70 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-18 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />

      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  )
}
