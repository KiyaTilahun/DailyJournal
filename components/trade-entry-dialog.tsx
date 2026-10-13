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
  Search,
  Minus,
  ChevronRight,
  Star,
  Info
} from "lucide-react"
import { cn } from "cn"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

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
import Link from "next/link"
import { calculateSuggestedLotSize, QUICK_LOT_SIZES } from "@/lib/constants"
import { useTrades } from "@/lib/trade-context"

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

export const CONVICTION_LABELS: Record<number, string> = {
  1: "1 — Low conviction",
  2: "2 — Moderate-low conviction",
  3: "3 — Moderate conviction",
  4: "4 — High conviction",
  5: "5 — Very high conviction",
}

export function TradeEntryDialog({
  open,
  onOpenChange,
  onSaveTrade,
  editingTrade
}: TradeEntryDialogProps) {
  const { accountBalance } = useTrades()

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
  const [riskPercent, setRiskPercent] = React.useState<string>("")
  const [commissions, setCommissions] = React.useState<string>("0.00")
  const [swaps, setSwaps] = React.useState<string>("0.00")
  const [spreadCost, setSpreadCost] = React.useState<string>("0.00")
  const [manualGrossPnL, setManualGrossPnL] = React.useState<string>("")
  const [manualNetPnL, setManualNetPnL] = React.useState<string>("")

  // Qualitative Strategy State - loads from backend /api/strategies
  const [strategy, setStrategy] = React.useState<string>("SMC")
  const [backendStrategies, setBackendStrategies] = React.useState<ComboboxGroup[]>([])
  const [activeStrategyNames, setActiveStrategyNames] = React.useState<string[]>([])
  const [executionTimeframe, setExecutionTimeframe] = React.useState<"1m" | "5m" | "15m" | "30m" | "1h">("15m")
  const [trendTimeframe, setTrendTimeframe] = React.useState<"1h" | "4h" | "Daily" | "Weekly">("4h")
  const [session, setSession] = React.useState<TradeSession>("LONDON")
  const [selectedConfluences, setSelectedConfluences] = React.useState<string[]>([])

  // Fetch backend strategies on open, grouping pinned first (Rule 3.3)
  React.useEffect(() => {
    if (!open) return
    fetch("/api/strategies?active=true")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const activeStrats = data.filter((s: any) => s.active !== false)
          const activeNames = activeStrats.map((s: any) => s.name)
          setActiveStrategyNames(activeNames)

          const pinned = activeStrats.filter((s: any) => s.isPinned)
          const unpinned = activeStrats.filter((s: any) => !s.isPinned)
          const groups: ComboboxGroup[] = []
          if (pinned.length > 0) {
            groups.push({
              name: "📌 Pinned Playbooks",
              items: pinned.map((s: any) => ({
                value: s.name,
                label: s.name,
                subLabel: s.description || "Pinned strategy",
                badge: "📌 Pinned",
              })),
            })
          }
          if (unpinned.length > 0) {
            groups.push({
              name: "All Active Strategies",
              items: unpinned.map((s: any) => ({
                value: s.name,
                label: s.name,
                subLabel: s.description || undefined,
                badge: `${s.tradeCount || 0} trades`,
              })),
            })
          }
          if (groups.length > 0) {
            setBackendStrategies(groups)
          }
        }
      })
      .catch(err => console.warn("Failed to fetch strategies for combobox:", err))
  }, [open])

  // Only show active strategies in the checklist grid
  const displayedConfluences = React.useMemo(() => {
    if (activeStrategyNames.length > 0) {
      return activeStrategyNames
    }
    return [
      "SMC Order Block",
      "Liquidity Sweep",
      "Supply & Demand",
      "Breakout Momentum",
      "Trend Pullback",
      "Fair Value Gap (FVG)",
      "Price Action"
    ]
  }, [activeStrategyNames])

  // Live XAU Benchmark Rates via exchangerate.fun (cached 6h server-side)
  const [goldTicker, setGoldTicker] = React.useState<{
    price: number
    formattedPrice: string
    rates: Record<string, number>
  } | null>(null)

  // Fetch server-cached live XAU benchmark rates on dialog open (no client polling)
  React.useEffect(() => {
    if (!open) return
    fetch("/api/fx/gold")
      .then(res => res.json())
      .then(data => {
        if (data && data.price) {
          setGoldTicker({
            price: data.price,
            formattedPrice: data.formattedPrice || `$${Math.round(data.price).toLocaleString()}`,
            rates: data.rates || {},
          })
        }
      })
      .catch(err => console.warn("Failed to fetch server-cached XAU rates:", err))
  }, [open])

  // Computed suggested lot size hint based on risk % and pip value lookup (Rule 2 & 3.3)
  const suggestedLotInfo = React.useMemo(() => {
    const riskNum = parseFloat(riskPercent)
    const entryNum = parseFloat(entryPrice)
    const slNum = parseFloat(stopLossPrice)
    if (isNaN(riskNum) || isNaN(entryNum) || isNaN(slNum) || riskNum <= 0) return null
    return calculateSuggestedLotSize(
      instrument,
      accountBalance,
      riskNum,
      entryNum,
      slNum,
      {
        accountCurrency: "USD",
        liveGoldPriceUsd: goldTicker?.price,
        rates: goldTicker?.rates,
      }
    )
  }, [riskPercent, entryPrice, stopLossPrice, instrument, accountBalance, goldTicker])

  // Psychology & Media State
  const [preTradeEmotion, setPreTradeEmotion] = React.useState<PreTradeEmotion>("CONFIDENT")
  const [preTradeConfidence, setPreTradeConfidence] = React.useState<number>(4)
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)
  const [postTradeEmotion, setPostTradeEmotion] = React.useState<PostTradeEmotion>("HELD_TO_TP")
  const [mistakeTag, setMistakeTag] = React.useState<MistakeTag>("NONE")
  const [lessonsLearned, setLessonsLearned] = React.useState("")
  const [reflectionError, setReflectionError] = React.useState<string | null>(null)
  const [entryScreenshotUrl, setEntryScreenshotUrl] = React.useState("")
  const [htfScreenshotUrl, setHtfScreenshotUrl] = React.useState("")
  const [tagInput, setTagInput] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])

  // Active sub-tab inside the dialog
  const [formStep, setFormStep] = React.useState<"execution" | "strategy" | "psychology">("execution")

  // Step 1: Subgroup States & Inline Validation
  const [costsOpen, setCostsOpen] = React.useState(false)
  const [morePairsOpen, setMorePairsOpen] = React.useState(false)
  const [slError, setSlError] = React.useState<string | null>(null)
  const [tpError, setTpError] = React.useState<string | null>(null)

  const validateLevels = React.useCallback(() => {
    const ep = parseFloat(entryPrice)
    const sl = parseFloat(stopLossPrice)
    const tp = parseFloat(takeProfitPrice)

    if (!isNaN(ep) && !isNaN(sl)) {
      if (direction === "LONG" && sl >= ep) {
        setSlError("For BUY (Long), Stop Loss must be below Entry Price.")
      } else if (direction === "SHORT" && sl <= ep) {
        setSlError("For SELL (Short), Stop Loss must be above Entry Price.")
      } else {
        setSlError(null)
      }
    } else {
      setSlError(null)
    }

    if (!isNaN(ep) && !isNaN(tp) && tp > 0) {
      if (direction === "LONG" && tp <= ep) {
        setTpError("For BUY (Long), Take Profit should be above Entry Price.")
      } else if (direction === "SHORT" && tp >= ep) {
        setTpError("For SELL (Short), Take Profit should be below Entry Price.")
      } else {
        setTpError(null)
      }
    } else {
      setTpError(null)
    }
  }, [entryPrice, stopLossPrice, takeProfitPrice, direction])

  const handleLotStep = (delta: number) => {
    const cur = parseFloat(lotSize) || 1.0
    const nextVal = Math.max(0.01, Number((cur + delta).toFixed(2)))
    setLotSize(nextVal.toString())
  }

  const handleDirectionSelect = (dir: TradeDirection) => {
    setDirection(dir)
    const ep = parseFloat(entryPrice)
    const sl = parseFloat(stopLossPrice)
    if (!isNaN(ep) && !isNaN(sl)) {
      if (dir === "LONG" && sl >= ep) {
        setSlError("For BUY (Long), Stop Loss must be below Entry Price.")
      } else if (dir === "SHORT" && sl <= ep) {
        setSlError("For SELL (Short), Stop Loss must be above Entry Price.")
      } else {
        setSlError(null)
      }
    }
  }

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
      setRiskPercent(editingTrade.riskPercent ? editingTrade.riskPercent.toString() : "")
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
      setReflectionError(null)
      setHoverRating(null)
    } else {
      const now = new Date()
      const nowStr = now.toISOString().slice(0, 16)
      setEntryDate(nowStr)
      setExitDate("") // Rule 6: default Entry to now, Exit empty for open trades
      setInstrument("EUR/USD")
      setDirection("LONG")
      setEntryPrice("1.08500")
      setStopLossPrice("1.08250")
      setTakeProfitPrice("1.09100")
      setExitPrice("1.09100")
      setLotSize("1.0")
      setRiskPercent("")
      setCommissions("0.00")
      setSwaps("0.00")
      setSpreadCost("0.00")
      setManualGrossPnL("")
      setManualNetPnL("")
      setStrategy("SMC")
      setExecutionTimeframe("15m")
      setTrendTimeframe("4h")
      setSession("LONDON")
      setSelectedConfluences([])
      setPreTradeEmotion("CONFIDENT")
      setPreTradeConfidence(4)
      setHoverRating(null)
      setPostTradeEmotion("HELD_TO_TP")
      setMistakeTag("NONE")
      setLessonsLearned("")
      setReflectionError(null)
      setEntryScreenshotUrl("")
      setHtfScreenshotUrl("")
      setTags([])
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

  // Dynamic suggested tags derived from mistake classification and pre-trade mindset
  const suggestedTags = React.useMemo(() => {
    const pool: string[] = []
    if (mistakeTag === "CHASED_PRICE") {
      pool.push("NoChasing", "WaitRetest", "Discipline")
    } else if (mistakeTag === "OVER_LEVERAGED") {
      pool.push("RiskDiscipline", "StrictLotSize", "CapitalPreservation")
    } else if (mistakeTag === "EARLY_EXIT") {
      pool.push("HoldToTP", "Patience", "TrustPlan")
    } else if (mistakeTag === "IGNORED_NEWS") {
      pool.push("NewsCollision", "EventRisk", "CalendarCheck")
    } else if (mistakeTag === "REVENGE_TRADING") {
      pool.push("WalkAway", "ResetMindset", "Discipline")
    } else if (mistakeTag === "NO_STOP_LOSS") {
      pool.push("HardStopLoss", "RiskControl")
    } else if (mistakeTag === "TRADED_OUTSIDE_PLAN") {
      pool.push("StickToPlan", "EdgeOnly")
    }

    if (preTradeEmotion === "CONFIDENT") {
      pool.push("A+Setup", "HighConviction")
    } else if (preTradeEmotion === "CALM") {
      pool.push("ZenTrader", "RulesFirst")
    } else if (preTradeEmotion === "FOMO") {
      pool.push("FOMOControl", "WaitConfirmation")
    } else if (preTradeEmotion === "ANXIOUS") {
      pool.push("SizeReduction", "ConfidenceBuilder")
    }

    const fallbacks = ["A+Setup", "Discipline", "ProcessOverPnL", "StrictRisk"]
    for (const f of fallbacks) {
      if (!pool.includes(f)) pool.push(f)
    }

    return pool.filter(tag => !tags.includes(tag)).slice(0, 4)
  }, [mistakeTag, preTradeEmotion, tags])

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const trimmed = tagInput.replace(/^#/, "").trim()
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed])
        setTagInput("")
      }
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const handleAddSuggestedTag = (st: string) => {
    if (!tags.includes(st)) {
      setTags([...tags, st])
    }
  }

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(x => x !== t))
  }

  const validateReflection = React.useCallback(() => {
    if (mistakeTag !== "NONE" && !lessonsLearned.trim()) {
      setReflectionError("Reflection notes are required when classifying a mistake.")
      return false
    }
    setReflectionError(null)
    return true
  }, [mistakeTag, lessonsLearned])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (mistakeTag !== "NONE" && !lessonsLearned.trim()) {
      setReflectionError("Reflection notes are required when classifying a mistake.")
      setFormStep("psychology")
      return
    }

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
      riskPercent: riskPercent ? parseFloat(riskPercent) : undefined,
      balanceAtEntry: editingTrade?.balanceAtEntry || accountBalance,
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
      <TooltipProvider delay={100}>
        <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border shadow-2xl rounded-2xl">
        {/* Header Strip with Compact Height for 900px Viewport */}
        <DialogHeader className="p-4 sm:px-6 sm:py-3.5 border-b border-border/70 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{editingTrade ? "Edit Trade Record" : "Log Trade Entry"}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full font-bold border bg-card shadow-xs">
                  {instrument}
                </span>
                <Badge
                  variant={calculatedMetrics.netPnL >= 0 ? "default" : "destructive"}
                  className="font-mono text-[11px] px-2 py-0.5 ml-1"
                >
                  {calculatedMetrics.netPnL >= 0 ? "+" : ""}${calculatedMetrics.netPnL.toFixed(2)} Net
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Frictionless logging for quantitative pricing, strategy confluences, and psychological mindset.
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="flex items-center gap-2 pt-2.5">
            <button
              type="button"
              onClick={() => setFormStep("execution")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                formStep === "execution"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground hover:bg-muted/60 border-border"
              )}
            >
              <BarChart2 className="h-3.5 w-3.5 shrink-0" />
              <span>1. Execution Data</span>
            </button>
            <button
              type="button"
              onClick={() => setFormStep("strategy")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                formStep === "strategy"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground hover:bg-muted/60 border-border"
              )}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>2. Strategy & Setup</span>
            </button>
            <button
              type="button"
              onClick={() => setFormStep("psychology")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                formStep === "psychology"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground hover:bg-muted/60 border-border"
              )}
            >
              <Brain className="h-3.5 w-3.5 shrink-0" />
              <span>3. Psychology & Reflection</span>
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
          {/* STEP 1: Quantitative Execution Data */}
          {formStep === "execution" && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* Row 1: Instrument & Direction */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 1.1 Instrument Section (lg:col-span-7) */}
                <div className="lg:col-span-7">
                  <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Label htmlFor="instrument" className="text-xs font-semibold text-foreground">
                        Instrument
                      </Label>
                      {/* XAU Benchmark Ticker Chip */}
                      {goldTicker && (
                        <span
                          title="Reference rate via exchangerate.fun (cached 6h)"
                          className="text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-300 font-mono font-medium px-1.5 py-0.2 rounded-full border border-amber-500/25 inline-flex items-center gap-1"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                          XAU/USD ≈ {goldTicker.formattedPrice}
                        </span>
                      )}
                      {/* Asset Category Tag */}
                      {isGoldAsset ? (
                        <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                          🪙 Gold (100 oz/lot)
                        </span>
                      ) : isJpyAsset ? (
                        <span className="text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold px-1.5 py-0.2 rounded-full border border-sky-500/30">
                          JPY Cross
                        </span>
                      ) : isCryptoOrIndex ? (
                        <span className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold px-1.5 py-0.2 rounded-full border border-purple-500/30">
                          Index / Crypto
                        </span>
                      ) : (
                        <span className="text-[10px] bg-muted text-muted-foreground font-medium px-1.5 py-0.2 rounded-full border border-border">
                          Standard FX
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Responsive Combobox Trigger (Search icon + Selected Instrument + Chevron) */}
                  <ResponsiveCombobox
                    value={instrument}
                    onValueChange={val => handleSelectInstrument(val)}
                    groups={INSTRUMENT_GROUPS}
                    searchPlaceholder="Search pair or symbol..."
                    emptyMessage="No instrument found"
                    title="Select Trading Instrument"
                    contentClassName="w-[320px]"
                    renderTrigger={(selected) => (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-9 px-3 font-mono text-sm justify-between bg-background border-input hover:bg-muted/40 flex items-center cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-bold text-foreground tracking-tight">{instrument || "Select Instrument"}</span>
                        </div>
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                      </Button>
                    )}
                  />

                  {/* Single Inline Row: Quick-Pair Pills (Max 6 + Popover) */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {QUICK_PRESET_SYMBOLS.slice(0, 6).map(sym => {
                      const isSelected = instrument === sym
                      const isGold = sym.includes("XAU")
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleSelectInstrument(sym)}
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                              : isGold
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 font-semibold"
                              : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70"
                          )}
                        >
                          {isGold ? "🪙 Gold" : sym}
                        </button>
                      )
                    })}

                    {QUICK_PRESET_SYMBOLS.length > 6 && (
                      <Popover open={morePairsOpen} onOpenChange={setMorePairsOpen}>
                        <PopoverTrigger
                          render={
                            <button
                              type="button"
                              className="text-[10px] font-mono px-2 py-0.5 rounded border border-dashed border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer"
                            >
                              +{QUICK_PRESET_SYMBOLS.length - 6} more
                            </button>
                          }
                        />
                        <PopoverContent className="w-48 p-2 flex flex-wrap gap-1 shadow-md z-[70]" align="start">
                          {QUICK_PRESET_SYMBOLS.slice(6).map(sym => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => {
                                handleSelectInstrument(sym)
                                setMorePairsOpen(false)
                              }}
                              className={cn(
                                "text-[10px] font-mono px-2 py-1 rounded border transition-all cursor-pointer flex-1 text-center min-w-[70px]",
                                instrument === sym
                                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                              )}
                            >
                              {sym}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>

                {/* 1.2 Direction (lg:col-span-5) */}
                <div className="lg:col-span-5">
                  <Label className="text-xs font-semibold mb-1.5 block">Direction</Label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-lg border border-border h-9 items-center">
                    <button
                      type="button"
                      onClick={() => handleDirectionSelect("LONG")}
                      aria-pressed={direction === "LONG"}
                      className={cn(
                        "flex items-center justify-center gap-1.5 h-7 rounded-md text-xs font-bold transition-all cursor-pointer",
                        direction === "LONG"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>BUY (Long)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectionSelect("SHORT")}
                      aria-pressed={direction === "SHORT"}
                      className={cn(
                        "flex items-center justify-center gap-1.5 h-7 rounded-md text-xs font-bold transition-all cursor-pointer",
                        direction === "SHORT"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      <span>SELL (Short)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Timestamps (2-col row with tight labels) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entryDate" className="text-xs font-semibold mb-1.5 block">
                    Entry Date & Time
                  </Label>
                  <Input
                    id="entryDate"
                    type="datetime-local"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    required
                    className="text-xs sm:text-sm h-9 bg-background font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="exitDate" className="text-xs font-semibold mb-1.5 flex items-center justify-between text-muted-foreground">
                    <span>Exit Date & Time</span>
                    <span className="text-[10px] font-normal">(empty for open trade)</span>
                  </Label>
                  <Input
                    id="exitDate"
                    type="datetime-local"
                    value={exitDate}
                    onChange={e => setExitDate(e.target.value)}
                    className="text-xs sm:text-sm h-9 bg-background font-mono"
                  />
                </div>
              </div>

              {/* Section 2: Execution Pricing & Position Sizing Card */}
              <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-5">
                {/* 2.a) TRADE LEVELS Sub-group */}
                <fieldset className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-border/50">
                    <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Trade Levels
                    </legend>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        Planned R:R: <strong className="font-mono text-foreground font-bold">{calculatedMetrics.plannedRR}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        Realized R:R:{" "}
                        <strong
                          className={cn(
                            "font-mono font-bold",
                            calculatedMetrics.realizedRR >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {calculatedMetrics.realizedRR}R
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* 4-col row matching visual and tab order */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Tab 1: Entry Price */}
                    <div>
                      <Label htmlFor="entryPrice" className="text-xs font-semibold mb-1.5 block">
                        Entry Price
                      </Label>
                      <Input
                        id="entryPrice"
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={entryPrice}
                        onChange={e => setEntryPrice(e.target.value)}
                        onBlur={validateLevels}
                        required
                        className="font-mono text-sm h-9 bg-background"
                      />
                    </div>

                    {/* Tab 2: Stop Loss (Red Ring + WCAG Text Cue) */}
                    <div>
                      <Label htmlFor="stopLossPrice" className="text-xs font-semibold mb-1.5 flex items-center justify-between text-rose-600 dark:text-rose-400">
                        <span>Stop Loss</span>
                        <span className="text-[10px] font-normal text-muted-foreground">(Risk Cut)</span>
                      </Label>
                      <Input
                        id="stopLossPrice"
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={stopLossPrice}
                        onChange={e => setStopLossPrice(e.target.value)}
                        onBlur={validateLevels}
                        required
                        className="font-mono text-sm h-9 bg-background border-rose-300 dark:border-rose-900/80 focus-visible:ring-rose-500"
                      />
                      {slError && (
                        <p className="text-[10px] text-rose-500 font-medium mt-1 leading-tight flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{slError}</span>
                        </p>
                      )}
                    </div>

                    {/* Tab 3: Take Profit (Green Ring + WCAG Text Cue) */}
                    <div>
                      <Label htmlFor="takeProfitPrice" className="text-xs font-semibold mb-1.5 flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Take Profit</span>
                        <span className="text-[10px] font-normal text-muted-foreground">(Target)</span>
                      </Label>
                      <Input
                        id="takeProfitPrice"
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={takeProfitPrice}
                        onChange={e => setTakeProfitPrice(e.target.value)}
                        onBlur={validateLevels}
                        className="font-mono text-sm h-9 bg-background border-emerald-300 dark:border-emerald-900/80 focus-visible:ring-emerald-500"
                      />
                      {tpError && (
                        <p className="text-[10px] text-amber-500 font-medium mt-1 leading-tight flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{tpError}</span>
                        </p>
                      )}
                    </div>

                    {/* Tab 4: Actual Exit Price */}
                    <div>
                      <Label htmlFor="exitPrice" className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                        Actual Exit
                      </Label>
                      <Input
                        id="exitPrice"
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={exitPrice}
                        onChange={e => setExitPrice(e.target.value)}
                        placeholder="leave blank if open"
                        className="font-mono text-sm h-9 bg-background"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* 2.b) SIZE & RISK Sub-group */}
                <fieldset className="space-y-3 pt-2 border-t border-border/40">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Size & Risk
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    {/* Lot Size as a Stepper (− value + lots suffix) */}
                    <div>
                      <Label htmlFor="lotSize" className="text-xs font-semibold mb-1.5 block">
                        Lot Size
                      </Label>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleLotStep(-0.1)}
                          className="h-9 w-9 rounded-r-none shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          aria-label="Decrease lot size"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <div className="relative flex-1">
                          <Input
                            id="lotSize"
                            type="number"
                            step="0.01"
                            min="0.01"
                            inputMode="decimal"
                            value={lotSize}
                            onChange={e => setLotSize(e.target.value)}
                            className="h-9 rounded-none text-center font-mono text-sm pr-9 bg-background focus-visible:z-10"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none select-none">
                            lots
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleLotStep(0.1)}
                          className="h-9 w-9 rounded-l-none shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          aria-label="Increase lot size"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Quick Lots Chips & Suggested Hint */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Quick:</span>
                        {QUICK_LOT_SIZES.map(qLot => (
                          <button
                            type="button"
                            key={qLot}
                            onClick={() => setLotSize(qLot.toString())}
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer",
                              lotSize === qLot.toString()
                                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/70"
                            )}
                          >
                            {qLot.toFixed(2)}
                          </button>
                        ))}
                      </div>

                      {suggestedLotInfo && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-medium">
                          <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Suggested: <strong className="font-mono font-bold">{suggestedLotInfo.suggestedLots} lots</strong> (${suggestedLotInfo.riskAmount} · {suggestedLotInfo.pipsAtRisk}p)</span>
                          <button
                            type="button"
                            onClick={() => setLotSize(suggestedLotInfo.suggestedLots.toString())}
                            className="underline font-bold hover:opacity-80 ml-1 cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Risk % (optional, helper text below) */}
                    <div>
                      <Label htmlFor="riskPercent" className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                        <Percent className="h-3 w-3 text-primary" />
                        <span>Risk %</span>
                        <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="riskPercent"
                        type="number"
                        step="0.25"
                        min="0"
                        max="10"
                        inputMode="decimal"
                        value={riskPercent}
                        onChange={e => setRiskPercent(e.target.value)}
                        className="font-mono text-sm h-9 bg-background"
                      />
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        % of balance at risk
                      </span>
                    </div>
                  </div>
                </fieldset>

                {/* 2.c) COSTS (Collapsed by default) */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <button
                    type="button"
                    onClick={() => setCostsOpen(prev => !prev)}
                    className="flex items-center justify-between w-full py-1.5 px-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200", costsOpen && "rotate-90")} />
                      <span>Costs (3 fields · defaults $0.00)</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-foreground/80">
                      ${(parseFloat(commissions || "0") + parseFloat(swaps || "0") + parseFloat(spreadCost || "0")).toFixed(2)} total
                    </span>
                  </button>

                  {costsOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 animate-in fade-in-50 duration-150">
                      <div>
                        <Label htmlFor="commissions" className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                          Commissions
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none select-none">
                            $
                          </span>
                          <Input
                            id="commissions"
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            value={commissions}
                            onChange={e => setCommissions(e.target.value)}
                            className="h-9 pl-6 font-mono text-sm bg-background"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="swaps" className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                          Swaps
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none select-none">
                            $
                          </span>
                          <Input
                            id="swaps"
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            value={swaps}
                            onChange={e => setSwaps(e.target.value)}
                            className="h-9 pl-6 font-mono text-sm bg-background"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="spreadCost" className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                          Spread Cost
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none select-none">
                            $
                          </span>
                          <Input
                            id="spreadCost"
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            value={spreadCost}
                            onChange={e => setSpreadCost(e.target.value)}
                            className="h-9 pl-6 font-mono text-sm bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PnL Summary Strip */}
                <div className="rounded-lg bg-muted/40 px-3.5 py-2.5 flex items-center justify-between border border-border/70 text-xs">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>Gross: <strong className="font-mono text-foreground">${calculatedMetrics.grossPnL.toFixed(2)}</strong></span>
                    <span>Total Fees: <strong className="font-mono">${(parseFloat(commissions || "0") + parseFloat(swaps || "0") + parseFloat(spreadCost || "0")).toFixed(2)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-muted-foreground">Net PnL:</span>
                    <span
                      className={cn(
                        "font-mono text-base font-extrabold tracking-tight",
                        calculatedMetrics.netPnL >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
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
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* 2.1 Strategy Model & Timeframe Context */}
              <fieldset className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Playbook & Execution Timeframe
                  </legend>
                  <Link
                    href="/strategies"
                    target="_blank"
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Manage Playbooks ↗
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Strategy Dropdown */}
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Strategy Model</Label>
                    <ResponsiveCombobox
                      value={strategy}
                      onValueChange={val => setStrategy(val)}
                      groups={backendStrategies.length > 0 ? backendStrategies : undefined}
                      items={backendStrategies.length === 0 ? STRATEGY_OPTIONS : undefined}
                      searchPlaceholder="Search strategy model..."
                      emptyMessage="No strategy model found."
                      title="Select Strategy Model"
                      placeholder="Select strategy model"
                    />
                  </div>

                  {/* Session */}
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Trading Session</Label>
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
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Execution Timeframe</Label>
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
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Trend Context TF</Label>
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
              </fieldset>

              {/* 2.2 Confluence Checkbox Grid with MultiSelect Combobox */}
              <fieldset className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Checklist & Active Strategies Met
                  </legend>
                  <span className="text-xs text-muted-foreground font-mono">
                    {selectedConfluences.length} of {displayedConfluences.length} criteria active
                  </span>
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                  {/* Searchable Multi-Select Combobox with Badge Trigger */}
                  <MultiSelectCombobox
                    values={selectedConfluences}
                    onValuesChange={setSelectedConfluences}
                    options={Array.from(new Set([...displayedConfluences, ...selectedConfluences]))}
                    placeholder="Click to search and select active strategies & confluences..."
                    searchPlaceholder="Filter active strategies checklist..."
                    emptyMessage="No matching strategy or confluence found."
                    title="Active Strategies & Confluence Criteria"
                    maxBadges={3}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                    {displayedConfluences.map(item => {
                      const checked = selectedConfluences.includes(item)
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => toggleConfluence(item)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all cursor-pointer",
                            checked
                              ? "bg-primary/10 border-primary text-foreground font-semibold shadow-xs"
                              : "bg-background border-border/70 text-muted-foreground hover:bg-muted/40"
                          )}
                        >
                          <div
                            className={cn(
                              "h-4 w-4 rounded flex items-center justify-center border shrink-0",
                              checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                            )}
                          >
                            {checked && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <span className="truncate">{item}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </fieldset>

              {/* 2.3 Screenshot URLs */}
              <fieldset className="space-y-3">
                <div className="pb-1.5 border-b border-border/50">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Chart Context & Screenshots
                  </legend>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entryScreenshot" className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      Entry TF Chart URL
                    </Label>
                    <Input
                      id="entryScreenshot"
                      placeholder="https://tradingview.com/x/... or image link"
                      value={entryScreenshotUrl}
                      onChange={e => setEntryScreenshotUrl(e.target.value)}
                      className="text-xs sm:text-sm h-9 bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="htfScreenshot" className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      Higher TF Context Chart URL
                    </Label>
                    <Input
                      id="htfScreenshot"
                      placeholder="https://tradingview.com/x/... or image link"
                      value={htfScreenshotUrl}
                      onChange={e => setHtfScreenshotUrl(e.target.value)}
                      className="text-xs sm:text-sm h-9 bg-background"
                    />
                  </div>
                </div>
              </fieldset>
            </div>
          )}

          {/* STEP 3: Psychology & Reflection (SRS 3.1) */}
          {formStep === "psychology" && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* 3.a) BEFORE THE TRADE */}
              <fieldset className="space-y-3">
                <div className="pb-1.5 border-b border-border/50">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Before The Trade
                  </legend>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pre-Trade Emotion */}
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">
                      Pre-Trade Mental State
                    </Label>
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

                  {/* Setup Conviction */}
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">
                      Setup Conviction
                    </Label>
                    <div className="h-9 px-3 rounded-lg border border-border bg-background flex items-center justify-between gap-2 shadow-2xs">
                      <div
                        role="radiogroup"
                        aria-label="Setup conviction level"
                        className="flex items-center gap-0.5"
                      >
                        {[1, 2, 3, 4, 5].map(rating => {
                          const isFilled = rating <= (hoverRating ?? preTradeConfidence)
                          return (
                            <button
                              key={rating}
                              type="button"
                              role="radio"
                              aria-checked={preTradeConfidence === rating}
                              aria-label={CONVICTION_LABELS[rating]}
                              tabIndex={preTradeConfidence === rating ? 0 : -1}
                              onClick={() => setPreTradeConfidence(rating)}
                              onMouseEnter={() => setHoverRating(rating)}
                              onMouseLeave={() => setHoverRating(null)}
                              onKeyDown={e => {
                                if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                                  e.preventDefault()
                                  setPreTradeConfidence(Math.min(5, preTradeConfidence + 1))
                                  setHoverRating(null)
                                } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                                  e.preventDefault()
                                  setPreTradeConfidence(Math.max(1, preTradeConfidence - 1))
                                  setHoverRating(null)
                                }
                              }}
                              className="p-1 rounded hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4 transition-colors",
                                  isFilled
                                    ? "fill-amber-400 text-amber-500"
                                    : "fill-transparent stroke-muted-foreground/40 text-muted-foreground/40"
                                )}
                              />
                            </button>
                          )
                        })}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground font-mono">
                        {CONVICTION_LABELS[hoverRating ?? preTradeConfidence]}
                      </span>
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* 3.b) AFTER THE TRADE */}
              <fieldset className="space-y-3">
                <div className="pb-1.5 border-b border-border/50">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    After The Trade
                  </legend>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Post-Trade Exit Discipline */}
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">
                      Exit Execution
                    </Label>
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

                  {/* Mistake Classification */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Label className="text-xs font-semibold">
                        Mistake (cost of error tracking)
                      </Label>
                      <Tooltip>
                        <TooltipTrigger
                          type="button"
                          className="text-muted-foreground/60 hover:text-foreground transition-colors inline-flex items-center cursor-pointer p-0.5 focus:outline-none"
                          aria-label="Mistake tracking information"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Tagging errors allows the analytics dashboard to calculate your exact financial loss under specific habits (e.g. &ldquo;Cost of FOMO&rdquo;).
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <ResponsiveCombobox
                      value={mistakeTag}
                      onValueChange={val => {
                        const next = val as MistakeTag
                        setMistakeTag(next)
                        if (next === "NONE") {
                          setReflectionError(null)
                        }
                      }}
                      items={MISTAKE_OPTIONS}
                      searchPlaceholder="Search mistake classification..."
                      emptyMessage="No matching mistake tag found."
                      title="Classify Trading Error"
                      placeholder="Select mistake classification..."
                      triggerClassName="bg-background"
                    />

                    {/* Progressive Disclosure Container */}
                    {mistakeTag !== "NONE" && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in-50 duration-200">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="leading-tight">
                          Analytics dashboard will attribute financial loss from this trade to the <strong>{MISTAKE_OPTIONS.find(m => m.value === mistakeTag)?.label || mistakeTag}</strong> habit.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* 3.c) REFLECTION */}
              <fieldset className="space-y-3">
                <div className="pb-1.5 border-b border-border/50">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Reflection
                  </legend>
                </div>

                <div className="space-y-4">
                  {/* Reflection Textarea */}
                  <div>
                    <Label htmlFor="lessons" className="text-xs font-semibold mb-1.5 block">
                      Lessons Learned & Trader&apos;s Reflection
                      {mistakeTag !== "NONE" && (
                        <span className="text-rose-500 font-normal ml-1">* Required for mistakes</span>
                      )}
                    </Label>
                    <Textarea
                      id="lessons"
                      rows={3}
                      placeholder="What did you do right? What will you repeat?"
                      value={lessonsLearned}
                      onChange={e => {
                        setLessonsLearned(e.target.value)
                        if (reflectionError && e.target.value.trim()) {
                          setReflectionError(null)
                        }
                      }}
                      onBlur={validateReflection}
                      onInput={e => {
                        const target = e.currentTarget
                        target.style.height = "auto"
                        const nextHeight = Math.min(target.scrollHeight, 144)
                        target.style.height = `${nextHeight}px`
                      }}
                      className={cn(
                        "text-xs sm:text-sm leading-relaxed bg-background min-h-[72px] max-h-[144px] resize-none transition-colors",
                        reflectionError && "border-rose-500 focus-visible:ring-rose-500"
                      )}
                    />
                    <div className="flex items-center justify-between gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="text-[11px] text-muted-foreground/90">
                        Prompts: What psychological urge did you face? Did you adhere to your risk rule? What will you repeat or avoid next time?
                      </span>
                      {lessonsLearned.length >= 200 && (
                        <span className="font-mono text-[11px] shrink-0 text-muted-foreground">
                          {lessonsLearned.length} chars
                        </span>
                      )}
                    </div>
                    {reflectionError && (
                      <p className="text-xs text-rose-500 flex items-center gap-1.5 mt-1 font-medium">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {reflectionError}
                      </p>
                    )}
                  </div>

                  {/* Single Tag-Input with Suggestions */}
                  <div>
                    <Label htmlFor="tagInput" className="text-xs font-semibold mb-1.5 block">
                      Custom Setup Tags
                    </Label>
                    <div className="flex flex-wrap items-center gap-1.5 p-1.5 min-h-9 rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-ring">
                      {tags.map(t => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border border-border"
                        >
                          <span>#{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            aria-label={`Remove tag ${t}`}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-sm focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        id="tagInput"
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder={tags.length === 0 ? "Type tag & press Enter or comma..." : "Add tag..."}
                        className="flex-1 min-w-[140px] bg-transparent text-xs sm:text-sm px-1 py-0.5 outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>

                    {suggestedTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[11px] text-muted-foreground font-medium">Suggestions:</span>
                        {suggestedTags.map(st => (
                          <button
                            type="button"
                            key={st}
                            onClick={() => handleAddSuggestedTag(st)}
                            className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border/80 text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/40 transition-colors cursor-pointer"
                          >
                            +{st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>
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
      </TooltipProvider>
    </Dialog>
  )
}
