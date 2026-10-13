"use client"

import * as React from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Percent,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  AlertCircle,
  Brain,
  ShieldAlert,
  BarChart2,
  ChevronsUpDown,
  Search
} from "lucide-react"

import {
  Trade,
  TradeDirection,
  TradeSession,
  StrategyType,
  PreTradeEmotion,
  PostTradeEmotion,
  MistakeTag,
  TradeStatus
} from "@/lib/trading-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ResponsiveCombobox, ComboboxGroup } from "@/components/ui/responsive-combobox"
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"

interface TradeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveTrade: (trade: Omit<Trade, "id" | "createdAt" | "updatedAt">) => void
  editingTrade?: Trade | null
}

const COMMON_CONFLUENCES = [
  "HTF Trend Alignment",
  "Liquidity Sweep",
  "Order Block Retest",
  "Fair Value Gap (FVG)",
  "London/NY Session Open",
  "Key S/R Level",
  "Fibonacci Golden Zone",
  "RSI / Divergence Confirmation"
]

export interface InstrumentPreset {
  symbol: string
  label: string
  name: string
  category: "Precious Metals" | "Forex Majors" | "Forex Crosses" | "Indices & Crypto"
  defaultEntry: string
  defaultSL: string
  defaultTP: string
  lotMultiplier: number
  isGold?: boolean
}

export const POPULAR_INSTRUMENTS: InstrumentPreset[] = [
  // Gold (XAU/USD) & Metals
  {
    symbol: "XAU/USD",
    label: "XAU/USD (Gold)",
    name: "Gold / US Dollar",
    category: "Precious Metals",
    defaultEntry: "2850.00",
    defaultSL: "2842.00",
    defaultTP: "2870.00",
    lotMultiplier: 100,
    isGold: true,
  },
  {
    symbol: "XAG/USD",
    label: "XAG/USD (Silver)",
    name: "Silver / US Dollar",
    category: "Precious Metals",
    defaultEntry: "32.50",
    defaultSL: "32.10",
    defaultTP: "33.40",
    lotMultiplier: 5000,
  },
  // Forex Majors
  {
    symbol: "EUR/USD",
    label: "EUR/USD",
    name: "Euro / US Dollar",
    category: "Forex Majors",
    defaultEntry: "1.08500",
    defaultSL: "1.08250",
    defaultTP: "1.09100",
    lotMultiplier: 100000,
  },
  {
    symbol: "GBP/USD",
    label: "GBP/USD",
    name: "British Pound / US Dollar",
    category: "Forex Majors",
    defaultEntry: "1.28500",
    defaultSL: "1.28150",
    defaultTP: "1.29300",
    lotMultiplier: 100000,
  },
  {
    symbol: "USD/JPY",
    label: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    category: "Forex Majors",
    defaultEntry: "154.500",
    defaultSL: "154.100",
    defaultTP: "155.400",
    lotMultiplier: 1000,
  },
  {
    symbol: "AUD/USD",
    label: "AUD/USD",
    name: "Australian Dollar / US Dollar",
    category: "Forex Majors",
    defaultEntry: "0.65500",
    defaultSL: "0.65200",
    defaultTP: "0.66100",
    lotMultiplier: 100000,
  },
  {
    symbol: "USD/CAD",
    label: "USD/CAD",
    name: "US Dollar / Canadian Dollar",
    category: "Forex Majors",
    defaultEntry: "1.38500",
    defaultSL: "1.38200",
    defaultTP: "1.39200",
    lotMultiplier: 100000,
  },
  {
    symbol: "USD/CHF",
    label: "USD/CHF",
    name: "US Dollar / Swiss Franc",
    category: "Forex Majors",
    defaultEntry: "0.88500",
    defaultSL: "0.88200",
    defaultTP: "0.89200",
    lotMultiplier: 100000,
  },
  {
    symbol: "NZD/USD",
    label: "NZD/USD",
    name: "New Zealand Dollar / US Dollar",
    category: "Forex Majors",
    defaultEntry: "0.59500",
    defaultSL: "0.59200",
    defaultTP: "0.60100",
    lotMultiplier: 100000,
  },
  // Forex Crosses
  {
    symbol: "GBP/JPY",
    label: "GBP/JPY",
    name: "British Pound / Japanese Yen",
    category: "Forex Crosses",
    defaultEntry: "191.500",
    defaultSL: "191.000",
    defaultTP: "192.600",
    lotMultiplier: 1000,
  },
  {
    symbol: "EUR/JPY",
    label: "EUR/JPY",
    name: "Euro / Japanese Yen",
    category: "Forex Crosses",
    defaultEntry: "167.500",
    defaultSL: "167.100",
    defaultTP: "168.400",
    lotMultiplier: 1000,
  },
  {
    symbol: "EUR/GBP",
    label: "EUR/GBP",
    name: "Euro / British Pound",
    category: "Forex Crosses",
    defaultEntry: "0.84500",
    defaultSL: "0.84250",
    defaultTP: "0.85000",
    lotMultiplier: 100000,
  },
  // Indices & Crypto
  {
    symbol: "BTC/USD",
    label: "BTC/USD",
    name: "Bitcoin / US Dollar",
    category: "Indices & Crypto",
    defaultEntry: "95000.00",
    defaultSL: "93500.00",
    defaultTP: "98000.00",
    lotMultiplier: 1,
  },
  {
    symbol: "US30",
    label: "US30",
    name: "Dow Jones 30 Index",
    category: "Indices & Crypto",
    defaultEntry: "43500.00",
    defaultSL: "43300.00",
    defaultTP: "43900.00",
    lotMultiplier: 1,
  },
  {
    symbol: "NAS100",
    label: "NAS100",
    name: "Nasdaq 100 Index",
    category: "Indices & Crypto",
    defaultEntry: "20800.00",
    defaultSL: "20650.00",
    defaultTP: "21100.00",
    lotMultiplier: 1,
  },
]

export const QUICK_PRESET_SYMBOLS = [
  "XAU/USD", // Gold
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "GBP/JPY",
  "AUD/USD",
  "USD/CAD",
  "BTC/USD",
]

export const INSTRUMENT_GROUPS: ComboboxGroup[] = [
  {
    name: "Precious Metals & Commodities",
    items: POPULAR_INSTRUMENTS.filter(p => p.category === "Precious Metals").map(p => ({
      value: p.symbol,
      label: p.symbol,
      subLabel: p.name,
      badge: p.isGold ? "🪙 Gold (100 oz)" : "Silver (5k oz)",
      badgeColor: p.isGold
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
        : undefined,
    })),
  },
  {
    name: "Forex Majors",
    items: POPULAR_INSTRUMENTS.filter(p => p.category === "Forex Majors").map(p => ({
      value: p.symbol,
      label: p.symbol,
      subLabel: p.name,
      badge: "Major FX",
    })),
  },
  {
    name: "Forex Crosses",
    items: POPULAR_INSTRUMENTS.filter(p => p.category === "Forex Crosses").map(p => ({
      value: p.symbol,
      label: p.symbol,
      subLabel: p.name,
      badge: p.symbol.includes("JPY") ? "JPY Cross" : "FX Cross",
    })),
  },
  {
    name: "Indices & Crypto",
    items: POPULAR_INSTRUMENTS.filter(p => p.category === "Indices & Crypto").map(p => ({
      value: p.symbol,
      label: p.symbol,
      subLabel: p.name,
      badge: p.symbol.includes("BTC") ? "Crypto" : "Index",
    })),
  },
]

export const STRATEGY_OPTIONS = [
  { value: "SMC_ORDER_BLOCK", label: "SMC Order Block", subLabel: "Smart Money Concepts & Order Block Retest" },
  { value: "LIQUIDITY_SWEEP", label: "Liquidity Sweep", subLabel: "Asian / London High-Low Sweep & Market Shift" },
  { value: "SUPPLY_DEMAND", label: "Supply & Demand", subLabel: "Institutional Imbalance Zones & Fresh Retest" },
  { value: "BREAKOUT", label: "Breakout Momentum", subLabel: "Key Level Breakout with Volume Expansion" },
  { value: "TREND_PULLBACK", label: "Trend Pullback", subLabel: "Higher Timeframe Trend Retracement & Confluence" },
  { value: "FAIR_VALUE_GAP", label: "Fair Value Gap (FVG)", subLabel: "Inefficiency Fill & Algorithmic Entry" },
]

export const SESSION_OPTIONS = [
  { value: "LONDON", label: "London Session", subLabel: "08:00 - 16:00 UTC · Major European Liquidity" },
  { value: "NEW_YORK", label: "New York Session", subLabel: "13:00 - 21:00 UTC · US High Impact Momentum" },
  { value: "ASIAN", label: "Asian (Tokyo) Session", subLabel: "00:00 - 08:00 UTC · Range Accumulation" },
  { value: "OVERLAP_LONDON_NY", label: "London / NY Overlap", subLabel: "13:00 - 16:00 UTC · Peak Daily Volume" },
]

export const MISTAKE_OPTIONS = [
  { value: "NONE", label: "No Mistake — Clean Execution", subLabel: "Disciplined execution following all rules", badge: "Clean" },
  { value: "OVER_LEVERAGED", label: "Over-leveraged / Sized Too Big", subLabel: "Position size was too large for account risk", badge: "Risk" },
  { value: "CHASED_PRICE", label: "Chased Price / Entered on Exhaustion", subLabel: "Entered late after expansion move without retest", badge: "FOMO" },
  { value: "EARLY_EXIT", label: "Exited Prematurely Before Confirmation", subLabel: "Closed before target out of fear or anxiety", badge: "Discipline" },
  { value: "IGNORED_NEWS", label: "Ignored High-Impact News (CPI/NFP/FOMC)", subLabel: "Held through volatile event without plan", badge: "Risk" },
  { value: "REVENGE_TRADING", label: "Revenge Trading After a Loss", subLabel: "Rushed entry following a loss to recoup money", badge: "Mindset" },
  { value: "NO_STOP_LOSS", label: "No Fixed Stop Loss Placed", subLabel: "Traded without hard stop loss order in place", badge: "Severe" },
  { value: "TRADED_OUTSIDE_PLAN", label: "Traded Outside Defined Plan", subLabel: "Setup lacked predefined edge & checklist criteria", badge: "Plan" },
]

export const EXECUTION_TF_OPTIONS = [
  { value: "1m", label: "1-Minute (1m)", subLabel: "Scalping / Micro structure entry" },
  { value: "5m", label: "5-Minute (5m)", subLabel: "Intraday momentum execution" },
  { value: "15m", label: "15-Minute (15m)", subLabel: "Standard intraday setup timeframe" },
  { value: "30m", label: "30-Minute (30m)", subLabel: "Intermediate session structure" },
  { value: "1h", label: "1-Hour (1H)", subLabel: "Swing / higher timeframe entry" },
]

export const TREND_TF_OPTIONS = [
  { value: "1h", label: "1-Hour (1H)", subLabel: "Intraday bias & order flow" },
  { value: "4h", label: "4-Hour (4H)", subLabel: "Macro institutional market structure" },
  { value: "Daily", label: "Daily (1D)", subLabel: "Key daily supply/demand & trend" },
  { value: "Weekly", label: "Weekly (1W)", subLabel: "Major secular cycle direction" },
]

export const PRE_TRADE_EMOTION_OPTIONS = [
  { value: "CONFIDENT", label: "Confident & Centered", subLabel: "Clear conviction based on plan", badge: "Optimal" },
  { value: "CALM", label: "Calm & Neutral", subLabel: "Emotionally detached from outcome", badge: "Disciplined" },
  { value: "FOMO", label: "FOMO (Fear Of Missing Out)", subLabel: "Urge to catch running price", badge: "Warning" },
  { value: "ANXIOUS", label: "Anxious / Hesitant", subLabel: "Second-guessing entry or position size", badge: "Hesitant" },
  { value: "REVENGE", label: "Revenge Mindset", subLabel: "Frustrated after previous loss", badge: "Danger" },
  { value: "IMPATIENT", label: "Impatient / Bored", subLabel: "Forcing setups during low volume", badge: "Bored" },
]

export const POST_TRADE_EMOTION_OPTIONS = [
  { value: "HELD_TO_TP", label: "Held to Planned TP", subLabel: "Target hit without tampering", badge: "Clean" },
  { value: "DISCIPLINED_EXIT", label: "Disciplined Technical Exit", subLabel: "Exited on genuine market shift", badge: "Rules" },
  { value: "MOVED_SL_TO_BE", label: "Moved SL to Break-Even", subLabel: "Secured risk after structure break", badge: "Management" },
  { value: "CLOSED_EARLY_FEAR", label: "Closed Early out of Fear", subLabel: "Cut winners prematurely in panic", badge: "Fear" },
  { value: "WIDENED_SL", label: "Widened / Moved SL Further", subLabel: "Moved stop loss backwards", badge: "Violated" },
  { value: "PANIC_EXIT", label: "Panic Market Close", subLabel: "Impulsive market execution on drawdown", badge: "Panic" },
]

export function TradeEntryDialog({
  open,
  onOpenChange,
  onSaveTrade,
  editingTrade
}: TradeEntryDialogProps) {
  // Quantitative Form State
  const [instrument, setInstrument] = React.useState("EUR/USD")
  const [direction, setDirection] = React.useState<TradeDirection>("LONG")
  const [entryDate, setEntryDate] = React.useState("")
  const [exitDate, setExitDate] = React.useState("")
  const [entryPrice, setEntryPrice] = React.useState<string>("1.08500")
  const [stopLossPrice, setStopLossPrice] = React.useState<string>("1.08250")
  const [takeProfitPrice, setTakeProfitPrice] = React.useState<string>("1.09100")
  const [exitPrice, setExitPrice] = React.useState<string>("1.09100")
  const [lotSize, setLotSize] = React.useState<string>("1.0")
  const [commissions, setCommissions] = React.useState<string>("7.00")
  const [swaps, setSwaps] = React.useState<string>("0.00")
  const [spreadCost, setSpreadCost] = React.useState<string>("3.00")
  const [manualGrossPnL, setManualGrossPnL] = React.useState<string>("")
  const [manualNetPnL, setManualNetPnL] = React.useState<string>("")

  // Qualitative Strategy State
  const [strategy, setStrategy] = React.useState<StrategyType>("SMC_ORDER_BLOCK")
  const [executionTimeframe, setExecutionTimeframe] = React.useState<"1m" | "5m" | "15m" | "30m" | "1h">("15m")
  const [trendTimeframe, setTrendTimeframe] = React.useState<"1h" | "4h" | "Daily" | "Weekly">("4h")
  const [session, setSession] = React.useState<TradeSession>("LONDON")
  const [selectedConfluences, setSelectedConfluences] = React.useState<string[]>([
    "HTF Trend Alignment",
    "Order Block Retest"
  ])

  // Psychology & Media State
  const [preTradeEmotion, setPreTradeEmotion] = React.useState<PreTradeEmotion>("CONFIDENT")
  const [preTradeConfidence, setPreTradeConfidence] = React.useState<number>(4)
  const [postTradeEmotion, setPostTradeEmotion] = React.useState<PostTradeEmotion>("HELD_TO_TP")
  const [mistakeTag, setMistakeTag] = React.useState<MistakeTag>("NONE")
  const [lessonsLearned, setLessonsLearned] = React.useState("")
  const [entryScreenshotUrl, setEntryScreenshotUrl] = React.useState("")
  const [htfScreenshotUrl, setHtfScreenshotUrl] = React.useState("")
  const [tagInput, setTagInput] = React.useState("")
  const [tags, setTags] = React.useState<string[]>(["Discipline"])

  // Active sub-tab inside the dialog
  const [formStep, setFormStep] = React.useState<"execution" | "strategy" | "psychology">("execution")

  // Handle switching instrument and auto-updating default prices sensibly
  const handleSelectInstrument = (symbol: string, preset?: InstrumentPreset) => {
    setInstrument(symbol)
    const match = preset || POPULAR_INSTRUMENTS.find(p => p.symbol === symbol)
    if (match && !editingTrade) {
      const isDefaultPrice =
        entryPrice === "1.08500" ||
        entryPrice === "" ||
        POPULAR_INSTRUMENTS.some(p => p.defaultEntry === entryPrice)

      if (isDefaultPrice) {
        setEntryPrice(match.defaultEntry)
        setStopLossPrice(match.defaultSL)
        setTakeProfitPrice(match.defaultTP)
        setExitPrice(match.defaultTP)
      }
    }
  }

  // Asset type detection
  const upperInstrument = instrument.toUpperCase()
  const isGoldAsset = upperInstrument.includes("XAU") || upperInstrument.includes("GOLD")
  const isJpyAsset = upperInstrument.includes("JPY")
  const isCryptoOrIndex =
    upperInstrument.includes("BTC") ||
    upperInstrument.includes("ETH") ||
    upperInstrument.includes("US30") ||
    upperInstrument.includes("NAS") ||
    upperInstrument.includes("SPX")

  // Reset or fill with editing trade
  React.useEffect(() => {
    if (editingTrade) {
      setInstrument(editingTrade.instrument)
      setDirection(editingTrade.direction)
      setEntryDate(editingTrade.entryDate.slice(0, 16))
      setExitDate(editingTrade.exitDate.slice(0, 16))
      setEntryPrice(editingTrade.entryPrice.toString())
      setStopLossPrice(editingTrade.stopLossPrice.toString())
      setTakeProfitPrice(editingTrade.takeProfitPrice.toString())
      setExitPrice(editingTrade.exitPrice.toString())
      setLotSize(editingTrade.lotSize.toString())
      setCommissions(editingTrade.commissions.toString())
      setSwaps(editingTrade.swaps.toString())
      setSpreadCost(editingTrade.spreadCost.toString())
      setManualGrossPnL(editingTrade.grossPnL.toString())
      setManualNetPnL(editingTrade.netPnL.toString())
      setStrategy(editingTrade.strategy)
      setExecutionTimeframe(editingTrade.executionTimeframe)
      setTrendTimeframe(editingTrade.trendTimeframe)
      setSession(editingTrade.session)
      setSelectedConfluences(editingTrade.confluences)
      setPreTradeEmotion(editingTrade.preTradeEmotion)
      setPreTradeConfidence(editingTrade.preTradeConfidence)
      setPostTradeEmotion(editingTrade.postTradeEmotion)
      setMistakeTag(editingTrade.mistakeTag)
      setLessonsLearned(editingTrade.lessonsLearned)
      setEntryScreenshotUrl(editingTrade.entryScreenshotUrl || "")
      setHtfScreenshotUrl(editingTrade.htfScreenshotUrl || "")
      setTags(editingTrade.tags || [])
    } else {
      const now = new Date()
      const nowStr = now.toISOString().slice(0, 16)
      setEntryDate(nowStr)
      setExitDate(nowStr)
      setInstrument("EUR/USD")
      setDirection("LONG")
      setEntryPrice("1.08500")
      setStopLossPrice("1.08250")
      setTakeProfitPrice("1.09100")
      setExitPrice("1.09100")
      setLotSize("1.0")
      setCommissions("7.00")
      setSwaps("0.00")
      setSpreadCost("3.00")
      setManualGrossPnL("")
      setManualNetPnL("")
      setStrategy("SMC_ORDER_BLOCK")
      setExecutionTimeframe("15m")
      setTrendTimeframe("4h")
      setSession("LONDON")
      setSelectedConfluences(["HTF Trend Alignment", "Order Block Retest"])
      setPreTradeEmotion("CONFIDENT")
      setPreTradeConfidence(4)
      setPostTradeEmotion("HELD_TO_TP")
      setMistakeTag("NONE")
      setLessonsLearned("")
      setEntryScreenshotUrl("")
      setHtfScreenshotUrl("")
      setTags(["Discipline"])
      setFormStep("execution")
    }
  }, [editingTrade, open])

  // Automatic Calculation of PnL and R:R
  const calculatedMetrics = React.useMemo(() => {
    const ep = parseFloat(entryPrice) || 0
    const sl = parseFloat(stopLossPrice) || 0
    const tp = parseFloat(takeProfitPrice) || 0
    const xp = parseFloat(exitPrice) || 0
    const lots = parseFloat(lotSize) || 1
    const comm = parseFloat(commissions) || 0
    const sw = parseFloat(swaps) || 0
    const sp = parseFloat(spreadCost) || 0

    const riskDistance = Math.abs(ep - sl)
    const rewardDistance = Math.abs(tp - ep)
    const plannedRR = riskDistance > 0 ? Number((rewardDistance / riskDistance).toFixed(2)) : 0

    let realizedRR = 0
    if (riskDistance > 0) {
      if (direction === "LONG") {
        realizedRR = Number(((xp - ep) / riskDistance).toFixed(2))
      } else {
        realizedRR = Number(((ep - xp) / riskDistance).toFixed(2))
      }
    }

    const upper = instrument.toUpperCase()
    let multiplier = 100000
    if (upper.includes("XAU") || upper.includes("GOLD")) {
      multiplier = 100
    } else if (upper.includes("JPY")) {
      multiplier = 1000
    } else if (upper.includes("XAG") || upper.includes("SILVER")) {
      multiplier = 5000
    } else if (
      upper.includes("BTC") ||
      upper.includes("ETH") ||
      upper.includes("US30") ||
      upper.includes("NAS") ||
      upper.includes("SPX")
    ) {
      multiplier = 1
    }

    let defaultGrossPnL = 0
    if (direction === "LONG") {
      defaultGrossPnL = (xp - ep) * multiplier * lots
    } else {
      defaultGrossPnL = (ep - xp) * multiplier * lots
    }

    const finalGross = manualGrossPnL !== "" ? parseFloat(manualGrossPnL) || 0 : Number(defaultGrossPnL.toFixed(2))
    const totalFees = comm + sw + sp
    const finalNet = manualNetPnL !== "" ? parseFloat(manualNetPnL) || 0 : Number((finalGross - totalFees).toFixed(2))

    let status: TradeStatus = "BE"
    if (finalNet > 5) status = "WIN"
    else if (finalNet < -5) status = "LOSS"

    return {
      plannedRR,
      realizedRR,
      grossPnL: finalGross,
      netPnL: finalNet,
      status
    }
  }, [entryPrice, stopLossPrice, takeProfitPrice, exitPrice, lotSize, commissions, swaps, spreadCost, manualGrossPnL, manualNetPnL, direction, instrument])

  const toggleConfluence = (item: string) => {
    setSelectedConfluences(prev =>
      prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
    )
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(x => x !== t))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSaveTrade({
      instrument: instrument.toUpperCase().trim(),
      direction,
      entryDate: new Date(entryDate || Date.now()).toISOString(),
      exitDate: new Date(exitDate || Date.now()).toISOString(),
      entryPrice: parseFloat(entryPrice) || 0,
      stopLossPrice: parseFloat(stopLossPrice) || 0,
      takeProfitPrice: parseFloat(takeProfitPrice) || 0,
      exitPrice: parseFloat(exitPrice) || 0,
      lotSize: parseFloat(lotSize) || 1.0,
      commissions: parseFloat(commissions) || 0,
      swaps: parseFloat(swaps) || 0,
      spreadCost: parseFloat(spreadCost) || 0,
      grossPnL: calculatedMetrics.grossPnL,
      netPnL: calculatedMetrics.netPnL,
      plannedRR: calculatedMetrics.plannedRR,
      realizedRR: calculatedMetrics.realizedRR,
      status: calculatedMetrics.status,
      strategy,
      executionTimeframe,
      trendTimeframe,
      session,
      confluences: selectedConfluences,
      preTradeEmotion,
      preTradeConfidence,
      postTradeEmotion,
      mistakeTag,
      lessonsLearned,
      entryScreenshotUrl: entryScreenshotUrl.trim() || undefined,
      htfScreenshotUrl: htfScreenshotUrl.trim() || undefined,
      tags
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border shadow-2xl rounded-2xl">
        {/* Header Strip with Spacious Layout */}
        <DialogHeader className="p-6 sm:px-8 sm:py-6 border-b border-border/70 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <span>{editingTrade ? "Edit Trade Record" : "Log Trade Entry"}</span>
                <span className="font-mono text-sm px-2.5 py-0.5 rounded-full font-bold border bg-card shadow-xs">
                  {instrument}
                </span>
                <Badge
                  variant={calculatedMetrics.netPnL >= 0 ? "default" : "destructive"}
                  className="font-mono text-xs px-2.5 py-1 ml-1"
                >
                  {calculatedMetrics.netPnL >= 0 ? "+" : ""}${calculatedMetrics.netPnL.toFixed(2)} Net
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                Frictionless logging for quantitative pricing, strategy confluences, and psychological mindset.
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Tabs with Generous Whitespace */}
          <div className="flex items-center gap-2.5 pt-4">
            <button
              type="button"
              onClick={() => setFormStep("execution")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold border text-center transition-all flex items-center justify-center gap-2 ${
                formStep === "execution"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted/60 border-border"
              }`}
            >
              <BarChart2 className="h-4 w-4 shrink-0" />
              <span>1. Execution Data</span>
            </button>
            <button
              type="button"
              onClick={() => setFormStep("strategy")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold border text-center transition-all flex items-center justify-center gap-2 ${
                formStep === "strategy"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted/60 border-border"
              }`}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span>2. Strategy & Setup</span>
            </button>
            <button
              type="button"
              onClick={() => setFormStep("psychology")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold border text-center transition-all flex items-center justify-center gap-2 ${
                formStep === "psychology"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted/60 border-border"
              }`}
            >
              <Brain className="h-4 w-4 shrink-0" />
              <span>3. Psychology & Reflection</span>
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Quantitative Execution Data */}
          {formStep === "execution" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Row 1: Pair, Direction, Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Instrument / Pair */}
                <div className="space-y-2 lg:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="instrument" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                      <span>Instrument / Pair</span>
                      {isGoldAsset ? (
                        <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                          🪙 Gold (100 oz/lot)
                        </span>
                      ) : isJpyAsset ? (
                        <span className="text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                          JPY Cross (1k unit)
                        </span>
                      ) : isCryptoOrIndex ? (
                        <span className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                          Index / Crypto
                        </span>
                      ) : (
                        <span className="text-[10px] bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full border border-border">
                          Standard FX (100k lot)
                        </span>
                      )}
                    </Label>

                    {/* Presets catalog combobox */}
                    <div className="w-auto">
                      <ResponsiveCombobox
                        value={instrument}
                        onValueChange={val => handleSelectInstrument(val)}
                        groups={INSTRUMENT_GROUPS}
                        searchPlaceholder="Search pair..."
                        emptyMessage="No instrument found"
                        title="Select Trading Instrument"
                        contentClassName="w-[340px]"
                        renderTrigger={(selected) => (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 border-dashed bg-muted/40 hover:bg-muted font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <Search className="h-3 w-3 text-muted-foreground" />
                            <span>{selected ? selected.label : "Preset Catalog ▾"}</span>
                            <ChevronsUpDown className="h-3 w-3 opacity-50" />
                          </Button>
                        )}
                      />
                    </div>
                  </div>

                  <Input
                    id="instrument"
                    placeholder="e.g. XAU/USD, EUR/USD, GBP/JPY, BTC/USD"
                    value={instrument}
                    onChange={e => setInstrument(e.target.value.toUpperCase())}
                    required
                    className="font-mono text-sm uppercase h-10 bg-background"
                  />

                  {/* 1-Click Quick-Picks Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-muted-foreground font-semibold mr-0.5">Quick:</span>
                    {QUICK_PRESET_SYMBOLS.map(sym => {
                      const isSelected = instrument === sym
                      const isGold = sym.includes("XAU")
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleSelectInstrument(sym)}
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? isGold
                                ? "bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500 font-bold shadow-xs ring-1 ring-amber-500/50"
                                : "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                              : isGold
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 font-semibold"
                              : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                          }`}
                        >
                          {isGold ? "🪙 Gold (XAU/USD)" : sym}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Direction Toggle */}
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-xs sm:text-sm font-semibold">Direction</Label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-lg border border-border h-10 items-center">
                    <button
                      type="button"
                      onClick={() => setDirection("LONG")}
                      className={`flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${
                        direction === "LONG"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      BUY (Long)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection("SHORT")}
                      className={`flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${
                        direction === "SHORT"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ArrowDownRight className="h-4 w-4" />
                      SELL (Short)
                    </button>
                  </div>
                </div>

                {/* Entry Time */}
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="entryDate" className="text-xs sm:text-sm font-semibold">
                    Entry Date & Time
                  </Label>
                  <Input
                    id="entryDate"
                    type="datetime-local"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    required
                    className="text-xs sm:text-sm h-10 bg-background font-mono"
                  />
                </div>

                {/* Exit Time */}
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="exitDate" className="text-xs sm:text-sm font-semibold">
                    Exit Date & Time
                  </Label>
                  <Input
                    id="exitDate"
                    type="datetime-local"
                    value={exitDate}
                    onChange={e => setExitDate(e.target.value)}
                    required
                    className="text-xs sm:text-sm h-10 bg-background font-mono"
                  />
                </div>
              </div>

              {/* Pricing & Position Card */}
              <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-2">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Execution Pricing & Position Sizing
                  </span>
                  <div className="flex items-center gap-4 text-xs sm:text-sm">
                    <span className="text-muted-foreground">
                      Planned R:R: <strong className="text-foreground font-mono font-bold">{calculatedMetrics.plannedRR}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Realized R:R:{" "}
                      <strong
                        className={`font-mono font-bold ${
                          calculatedMetrics.realizedRR >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {calculatedMetrics.realizedRR}R
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Price levels */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="entryPrice" className="text-xs font-semibold text-muted-foreground">
                      Entry Price
                    </Label>
                    <Input
                      id="entryPrice"
                      type="number"
                      step="any"
                      value={entryPrice}
                      onChange={e => setEntryPrice(e.target.value)}
                      required
                      className="font-mono text-sm h-10 bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="stopLossPrice" className="text-xs font-semibold text-rose-500">
                      Stop Loss (SL)
                    </Label>
                    <Input
                      id="stopLossPrice"
                      type="number"
                      step="any"
                      value={stopLossPrice}
                      onChange={e => setStopLossPrice(e.target.value)}
                      required
                      className="font-mono text-sm h-10 bg-background border-rose-300 dark:border-rose-900/80 focus-visible:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="takeProfitPrice" className="text-xs font-semibold text-emerald-500">
                      Take Profit (TP)
                    </Label>
                    <Input
                      id="takeProfitPrice"
                      type="number"
                      step="any"
                      value={takeProfitPrice}
                      onChange={e => setTakeProfitPrice(e.target.value)}
                      className="font-mono text-sm h-10 bg-background border-emerald-300 dark:border-emerald-900/80 focus-visible:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="exitPrice" className="text-xs font-semibold text-muted-foreground">
                      Actual Exit Price
                    </Label>
                    <Input
                      id="exitPrice"
                      type="number"
                      step="any"
                      value={exitPrice}
                      onChange={e => setExitPrice(e.target.value)}
                      required
                      className="font-mono text-sm h-10 bg-background"
                    />
                  </div>
                </div>

                {/* Position & Costs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="lotSize" className="text-xs font-semibold text-muted-foreground">
                      Lot Size
                    </Label>
                    <Input
                      id="lotSize"
                      type="number"
                      step="0.01"
                      value={lotSize}
                      onChange={e => setLotSize(e.target.value)}
                      className="font-mono text-sm h-10 bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="commissions" className="text-xs font-semibold text-muted-foreground">
                      Commissions ($)
                    </Label>
                    <Input
                      id="commissions"
                      type="number"
                      step="0.1"
                      value={commissions}
                      onChange={e => setCommissions(e.target.value)}
                      className="font-mono text-sm h-10 bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="swaps" className="text-xs font-semibold text-muted-foreground">
                      Swaps ($)
                    </Label>
                    <Input
                      id="swaps"
                      type="number"
                      step="0.1"
                      value={swaps}
                      onChange={e => setSwaps(e.target.value)}
                      className="font-mono text-sm h-10 bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="spreadCost" className="text-xs font-semibold text-muted-foreground">
                      Spread Cost ($)
                    </Label>
                    <Input
                      id="spreadCost"
                      type="number"
                      step="0.1"
                      value={spreadCost}
                      onChange={e => setSpreadCost(e.target.value)}
                      className="font-mono text-sm h-10 bg-background"
                    />
                  </div>
                </div>

                {/* PnL Summary Banner */}
                <div className="rounded-xl bg-muted/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-border">
                  <div className="flex items-center gap-6 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">Gross PnL: </span>
                      <strong className="font-mono text-foreground font-bold">
                        ${calculatedMetrics.grossPnL.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Fees: </span>
                      <strong className="font-mono text-muted-foreground">
                        ${(parseFloat(commissions || "0") + parseFloat(swaps || "0") + parseFloat(spreadCost || "0")).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground font-semibold">Net PnL:</span>
                    <span
                      className={`font-mono text-xl sm:text-2xl font-extrabold tracking-tight ${
                        calculatedMetrics.netPnL >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {calculatedMetrics.netPnL >= 0 ? "+" : ""}${calculatedMetrics.netPnL.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Setup & Strategy (Qualitative) */}
          {formStep === "strategy" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Strategy Dropdown */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold">Strategy Model</Label>
                  <ResponsiveCombobox
                    value={strategy}
                    onValueChange={val => setStrategy(val as StrategyType)}
                    items={STRATEGY_OPTIONS}
                    searchPlaceholder="Search strategy model..."
                    emptyMessage="No strategy model found."
                    title="Select Strategy Model"
                    placeholder="Select strategy model"
                  />
                </div>

                {/* Session */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold">Trading Session</Label>
                  <ResponsiveCombobox
                    value={session}
                    onValueChange={val => setSession(val as TradeSession)}
                    items={SESSION_OPTIONS}
                    searchPlaceholder="Search trading session..."
                    emptyMessage="No session found."
                    title="Select Trading Session"
                    placeholder="Select session"
                  />
                </div>

                {/* Execution TF */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold">Execution Timeframe</Label>
                  <ResponsiveCombobox
                    value={executionTimeframe}
                    onValueChange={val => setExecutionTimeframe(val as "1m" | "5m" | "15m" | "30m" | "1h")}
                    items={EXECUTION_TF_OPTIONS}
                    searchPlaceholder="Search execution timeframe..."
                    emptyMessage="No timeframe found."
                    title="Select Execution Timeframe"
                    placeholder="Execution TF"
                  />
                </div>

                {/* Trend TF */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold">Trend Context TF</Label>
                  <ResponsiveCombobox
                    value={trendTimeframe}
                    onValueChange={val => setTrendTimeframe(val as "1h" | "4h" | "Daily" | "Weekly")}
                    items={TREND_TF_OPTIONS}
                    searchPlaceholder="Search trend context TF..."
                    emptyMessage="No timeframe found."
                    title="Select Trend Context Timeframe"
                    placeholder="Trend TF"
                  />
                </div>
              </div>

              {/* Confluence Checkbox Grid with MultiSelect Combobox (Rule 7) */}
              <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground block">
                    Checklist & Confluences Met
                  </Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {selectedConfluences.length} of {COMMON_CONFLUENCES.length} selected
                  </span>
                </div>

                {/* Searchable Multi-Select Combobox with Badge Trigger */}
                <MultiSelectCombobox
                  values={selectedConfluences}
                  onValuesChange={setSelectedConfluences}
                  options={COMMON_CONFLUENCES}
                  placeholder="Click to search and select confluences..."
                  searchPlaceholder="Filter confluences checklist..."
                  emptyMessage="No matching confluence found."
                  title="Confluence Setup Criteria"
                  maxBadges={3}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  {COMMON_CONFLUENCES.map(item => {
                    const checked = selectedConfluences.includes(item)
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleConfluence(item)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs sm:text-sm text-left transition-all cursor-pointer ${
                          checked
                            ? "bg-primary/10 border-primary text-foreground font-semibold shadow-xs"
                            : "bg-background border-border/70 text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 ${
                            checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                          }`}
                        >
                          {checked && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className="truncate">{item}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Screenshot URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="entryScreenshot" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Entry TF Chart URL
                  </Label>
                  <Input
                    id="entryScreenshot"
                    placeholder="https://tradingview.com/x/... or image link"
                    value={entryScreenshotUrl}
                    onChange={e => setEntryScreenshotUrl(e.target.value)}
                    className="text-xs sm:text-sm h-10 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="htfScreenshot" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Higher TF Context Chart URL
                  </Label>
                  <Input
                    id="htfScreenshot"
                    placeholder="https://tradingview.com/x/... or image link"
                    value={htfScreenshotUrl}
                    onChange={e => setHtfScreenshotUrl(e.target.value)}
                    className="text-xs sm:text-sm h-10 bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Psychology & Reflection (SRS 3.1) */}
          {formStep === "psychology" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Pre-Trade Emotion */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold">Pre-Trade Mental State</Label>
                  <ResponsiveCombobox
                    value={preTradeEmotion}
                    onValueChange={val => setPreTradeEmotion(val as PreTradeEmotion)}
                    items={PRE_TRADE_EMOTION_OPTIONS}
                    searchPlaceholder="Search mental state..."
                    emptyMessage="No matching state."
                    title="Pre-Trade Emotional State"
                    placeholder="Select mindset..."
                  />
                </div>

                {/* Pre-Trade Confidence 1-5 */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold">
                    Setup Conviction Level ({preTradeConfidence}/5)
                  </Label>
                  <div className="flex items-center gap-1.5 h-10">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        type="button"
                        key={rating}
                        onClick={() => setPreTradeConfidence(rating)}
                        className={`flex-1 h-10 text-xs sm:text-sm font-bold rounded-lg border transition-all ${
                          rating <= preTradeConfidence
                            ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                        }`}
                      >
                        {rating}★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post-Trade Exit Discipline */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold">Post-Trade Exit Execution</Label>
                  <ResponsiveCombobox
                    value={postTradeEmotion}
                    onValueChange={val => setPostTradeEmotion(val as PostTradeEmotion)}
                    items={POST_TRADE_EMOTION_OPTIONS}
                    searchPlaceholder="Search exit execution..."
                    emptyMessage="No matching execution found."
                    title="Post-Trade Exit Execution"
                    placeholder="Select exit execution..."
                  />
                </div>
              </div>

              {/* Mistakes Log (Crucial SRS 3.1 & 4.4 requirement) */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.03] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Mistake Classification (Cost of Error Tracking)
                  </Label>
                </div>
                <ResponsiveCombobox
                  value={mistakeTag}
                  onValueChange={val => setMistakeTag(val as MistakeTag)}
                  items={MISTAKE_OPTIONS}
                  searchPlaceholder="Search mistake classification..."
                  emptyMessage="No matching mistake tag found."
                  title="Classify Trading Error"
                  placeholder="Select mistake classification..."
                  triggerClassName="border-rose-300/60 dark:border-rose-900 bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Tagging errors allows the analytics dashboard to calculate your exact financial loss under specific habits (e.g. &ldquo;Cost of FOMO&rdquo;).
                </p>
              </div>

              {/* Lessons Learned Journal */}
              <div className="space-y-2">
                <Label htmlFor="lessons" className="text-xs sm:text-sm font-semibold">
                  Lessons Learned & Trader&apos;s Reflection
                </Label>
                <Textarea
                  id="lessons"
                  rows={4}
                  placeholder="What did you do right? What psychological urge did you face? What will you repeat next time?"
                  value={lessonsLearned}
                  onChange={e => setLessonsLearned(e.target.value)}
                  className="text-xs sm:text-sm leading-relaxed bg-background"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2.5">
                <Label className="text-xs sm:text-sm font-semibold">Custom Setup Tags</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add tag and press Enter"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    className="text-xs sm:text-sm h-9 max-w-xs bg-background"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddTag} className="h-9 text-xs">
                    Add Tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
                      #{t}
                      <button type="button" onClick={() => handleRemoveTag(t)}>
                        <X className="h-3.5 w-3.5 hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border/70 pt-5 flex flex-row items-center justify-between sm:justify-between">
            <div className="flex items-center gap-2">
              {formStep !== "execution" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormStep(formStep === "psychology" ? "strategy" : "execution")}
                  className="text-xs sm:text-sm h-9 px-4"
                >
                  Back
                </Button>
              )}
              {formStep !== "psychology" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormStep(formStep === "execution" ? "strategy" : "psychology")}
                  className="text-xs sm:text-sm h-9 px-4"
                >
                  Next Step
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs sm:text-sm h-9 px-4"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground text-xs sm:text-sm h-9 px-5 shadow-sm font-semibold">
                {editingTrade ? "Update Trade" : "Save Trade Entry"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
