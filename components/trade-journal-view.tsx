"use client"

import * as React from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Edit2,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
  AlertTriangle,
  Brain,
  Tag
} from "lucide-react"

import { Trade, TradeDirection, TradeSession, StrategyType, TradeStatus, MistakeTag } from "@/lib/trading-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useTrades } from "@/lib/trade-context"

interface TradeJournalViewProps {
  trades?: Trade[]
  onNewTrade?: () => void
  onEditTrade?: (trade: Trade) => void
  onDeleteTrade?: (id: string) => void
  initialFilter?: string
}

export function TradeJournalView(props: TradeJournalViewProps = {}) {
  const context = useTrades()
  const trades = props.trades ?? context.trades
  const onNewTrade = props.onNewTrade ?? context.openNewTradeModal
  const onEditTrade = props.onEditTrade ?? context.openEditTradeModal
  const onDeleteTrade = props.onDeleteTrade ?? context.deleteTrade
  const initialFilter = props.initialFilter ?? context.journalSearchFilter

  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedDirection, setSelectedDirection] = React.useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL")
  const [selectedSession, setSelectedSession] = React.useState<string>("ALL")
  const [selectedStrategy, setSelectedStrategy] = React.useState<string>("ALL")
  const [inspectingTrade, setInspectingTrade] = React.useState<Trade | null>(null)

  React.useEffect(() => {
    if (initialFilter) {
      if (initialFilter.startsWith("journal-")) {
        const pair = initialFilter.replace("journal-", "")
        setSearchQuery(pair)
      } else if (initialFilter.startsWith("mistake-")) {
        const mistake = initialFilter.replace("mistake-", "")
        setSearchQuery(mistake)
      }
    }
  }, [initialFilter])

  // Filtered trades
  const filteredTrades = React.useMemo(() => {
    return trades.filter(t => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchPair = t.instrument.toLowerCase().includes(q)
        const matchStrategy = t.strategy.toLowerCase().includes(q)
        const matchNotes = (t.lessonsLearned || "").toLowerCase().includes(q)
        const matchMistake = (t.mistakeTag || "").toLowerCase().includes(q)
        const matchTag = t.tags.some(tag => tag.toLowerCase().includes(q))
        if (!matchPair && !matchStrategy && !matchNotes && !matchMistake && !matchTag) return false
      }

      // Direction
      if (selectedDirection !== "ALL" && t.direction !== selectedDirection) return false

      // Status
      if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false

      // Session
      if (selectedSession !== "ALL" && t.session !== selectedSession) return false

      // Strategy
      if (selectedStrategy !== "ALL" && t.strategy !== selectedStrategy) return false

      return true
    })
  }, [trades, searchQuery, selectedDirection, selectedStatus, selectedSession, selectedStrategy])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Trading Journal & Execution Log</span>
            <Badge variant="outline" className="font-mono text-xs">
              {filteredTrades.length} of {trades.length}
            </Badge>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Detailed chronological record of execution, strategy setups, and psychological retrospectives.
          </p>
        </div>

        <Button
          onClick={onNewTrade}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Log New Trade</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search pair, tag, strategy, mistake, lesson..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Direction */}
          <Select value={selectedDirection} onValueChange={(val) => { if (val) setSelectedDirection(val) }}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Directions</SelectItem>
              <SelectItem value="LONG">BUY (Long)</SelectItem>
              <SelectItem value="SHORT">SELL (Short)</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={selectedStatus} onValueChange={(val) => { if (val) setSelectedStatus(val) }}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Outcomes</SelectItem>
              <SelectItem value="WIN">Wins (+PnL)</SelectItem>
              <SelectItem value="LOSS">Losses (-PnL)</SelectItem>
              <SelectItem value="BE">Break-Even</SelectItem>
            </SelectContent>
          </Select>

          {/* Session */}
          <Select value={selectedSession} onValueChange={(val) => { if (val) setSelectedSession(val) }}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sessions</SelectItem>
              <SelectItem value="LONDON">London</SelectItem>
              <SelectItem value="NEW_YORK">New York</SelectItem>
              <SelectItem value="ASIAN">Asian (Tokyo)</SelectItem>
              <SelectItem value="OVERLAP_LONDON_NY">London / NY Overlap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Pair Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground font-semibold mr-1">Pairs:</span>
          {["ALL", "XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY", "GBP/JPY", "AUD/USD", "USD/CAD"].map(pair => {
            const isSelected = pair === "ALL" ? searchQuery === "" : searchQuery.toUpperCase() === pair
            const isGold = pair.includes("XAU")
            return (
              <button
                key={pair}
                onClick={() => setSearchQuery(pair === "ALL" ? "" : pair)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? isGold
                      ? "bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500 font-bold shadow-xs ring-1 ring-amber-500/40"
                      : "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : isGold
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 font-medium"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                }`}
              >
                {pair === "ALL" ? "All Pairs" : isGold ? "🪙 Gold (XAU/USD)" : pair}
              </button>
            )
          })}
        </div>

        {/* Quick Reset Filters */}
        {(searchQuery || selectedDirection !== "ALL" || selectedStatus !== "ALL" || selectedSession !== "ALL") && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
            <span className="text-muted-foreground">Active filters applied</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setSelectedDirection("ALL")
                setSelectedStatus("ALL")
                setSelectedSession("ALL")
                setSelectedStrategy("ALL")
              }}
              className="h-6 text-[11px] text-primary hover:text-primary/80"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Trade Cards Stream */}
      {filteredTrades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-muted/20">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-semibold text-sm">No trades matched your search filters</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your query, clear filters, or record a new trade execution.
          </p>
          <Button size="sm" onClick={onNewTrade} className="text-xs">
            Log New Trade
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map(trade => (
            <Card
              key={trade.id}
              className="rounded-xl border border-border/80 shadow-xs hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Side: Pair, Direction, Timestamps */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-xs font-bold font-mono shadow-xs ${
                      trade.direction === "LONG"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {trade.direction === "LONG" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span className="text-[10px]">{trade.direction === "LONG" ? "BUY" : "SELL"}</span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base tracking-tight text-foreground">{trade.instrument}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0">
                        {trade.strategy.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        {trade.session}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {trade.executionTimeframe} (Trend: {trade.trendTimeframe})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {new Date(trade.entryDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span>•</span>
                      <span>Lots: <strong className="font-mono text-foreground">{trade.lotSize}</strong></span>
                      <span>•</span>
                      <span>Entry: <strong className="font-mono text-foreground">{trade.entryPrice}</strong></span>
                      <span>Exit: <strong className="font-mono text-foreground">{trade.exitPrice}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Middle: Psychology & Mistake Tag */}
                <div className="flex flex-col md:items-center justify-center gap-1.5 min-w-[160px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      Mindset:
                    </span>
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {trade.preTradeEmotion} ({trade.preTradeConfidence}★)
                    </Badge>
                  </div>

                  {trade.mistakeTag && trade.mistakeTag !== "NONE" ? (
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="destructive" className="text-[10px] gap-1 py-0.5">
                        <AlertTriangle className="h-3 w-3" />
                        {trade.mistakeTag.replace(/_/g, " ")}
                      </Badge>
                      {trade.newsAtEntry && (trade.newsHeadline || trade.newsHeadlineAtEntry) && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                          ⚠ headline within 90min of entry: &apos;{trade.newsHeadline || trade.newsHeadlineAtEntry}&apos;
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] text-emerald-600 dark:text-emerald-400 gap-1 py-0 bg-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3" />
                      Clean Execution
                    </Badge>
                  )}
                </div>

                {/* Right: PnL, R:R & Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="flex flex-col md:items-end">
                    <span
                      className={`font-mono text-lg font-bold tracking-tight ${
                        trade.netPnL >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {trade.netPnL >= 0 ? "+" : ""}${trade.netPnL.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Realized: <strong className="text-foreground">{trade.realizedRR}R</strong> (Plan: {trade.plannedRR}R)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectingTrade(trade)}
                      className="h-8 px-2.5 text-xs gap-1"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Details</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditTrade(trade)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete trade ${trade.instrument} (${trade.id})?`)) {
                          onDeleteTrade(trade.id)
                        }
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lessons Learned Snippet */}
              {trade.lessonsLearned && (
                <div className="px-5 py-2.5 bg-muted/30 border-t border-border/50 text-xs text-muted-foreground italic flex items-center gap-2">
                  <span className="font-semibold not-italic text-foreground/80">Takeaway:</span>
                  <span className="truncate">{trade.lessonsLearned}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Trade Detail Inspector Dialog */}
      {inspectingTrade && (
        <Dialog open={!!inspectingTrade} onOpenChange={() => setInspectingTrade(null)}>
          <DialogContent className="w-full sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <span>{inspectingTrade.instrument}</span>
                  <Badge variant={inspectingTrade.direction === "LONG" ? "default" : "destructive"}>
                    {inspectingTrade.direction === "LONG" ? "BUY (Long)" : "SELL (Short)"}
                  </Badge>
                  <span
                    className={`font-mono text-base font-bold ml-auto ${
                      inspectingTrade.netPnL >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {inspectingTrade.netPnL >= 0 ? "+" : ""}${inspectingTrade.netPnL.toFixed(2)}
                  </span>
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Executed {new Date(inspectingTrade.entryDate).toLocaleString()} • {inspectingTrade.session} Session
              </DialogDescription>
            </DialogHeader>

            {/* Pricing Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div>
                <span className="text-muted-foreground block">Entry Price</span>
                <span className="font-mono font-bold">{inspectingTrade.entryPrice}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Stop Loss</span>
                <span className="font-mono font-bold text-rose-500">{inspectingTrade.stopLossPrice}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Take Profit</span>
                <span className="font-mono font-bold text-emerald-500">{inspectingTrade.takeProfitPrice}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Exit Price</span>
                <span className="font-mono font-bold">{inspectingTrade.exitPrice}</span>
              </div>
            </div>

            {/* Costs & R:R */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg border">
                <span className="text-muted-foreground block text-[11px]">Realized R:R</span>
                <span className="font-mono font-bold text-sm">{inspectingTrade.realizedRR}R</span>
              </div>
              <div className="p-2.5 rounded-lg border">
                <span className="text-muted-foreground block text-[11px]">Gross PnL</span>
                <span className="font-mono font-bold text-sm">${inspectingTrade.grossPnL.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg border">
                <span className="text-muted-foreground block text-[11px]">Fees & Costs</span>
                <span className="font-mono font-bold text-sm">
                  ${(inspectingTrade.commissions + inspectingTrade.swaps + inspectingTrade.spreadCost).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Confluences */}
            {inspectingTrade.confluences.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Confluences & Setup Criteria
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingTrade.confluences.map(c => (
                    <Badge key={c} variant="outline" className="text-xs py-0.5 px-2 bg-card">
                      ✓ {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Psychology & Reflection */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-primary" />
                Psychological Analysis & Retrospective
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Pre-Trade Mental State:</span>
                  <span className="font-medium text-foreground">
                    {inspectingTrade.preTradeEmotion} ({inspectingTrade.preTradeConfidence}/5 Conviction)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Exit Discipline:</span>
                  <span className="font-medium text-foreground">
                    {inspectingTrade.postTradeEmotion.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {inspectingTrade.mistakeTag !== "NONE" && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-1">
                  <div>
                    <strong>Mistake Recorded: </strong>
                    {inspectingTrade.mistakeTag.replace(/_/g, " ")}
                  </div>
                  {inspectingTrade.newsAtEntry && (inspectingTrade.newsHeadline || inspectingTrade.newsHeadlineAtEntry) && (
                    <div className="text-[11px] font-medium text-rose-600 dark:text-rose-300">
                      ⚠ headline within 90min of entry: &apos;{inspectingTrade.newsHeadline || inspectingTrade.newsHeadlineAtEntry}&apos;
                    </div>
                  )}
                </div>
              )}

              {inspectingTrade.lessonsLearned && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground">Trader&apos;s Journal Reflection:</span>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border">
                    {inspectingTrade.lessonsLearned}
                  </p>
                </div>
              )}
            </div>

            {/* Screenshots */}
            {(inspectingTrade.entryScreenshotUrl || inspectingTrade.htfScreenshotUrl) && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Chart Documentation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inspectingTrade.entryScreenshotUrl && (
                    <a
                      href={inspectingTrade.entryScreenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Entry TF Chart
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                  {inspectingTrade.htfScreenshotUrl && (
                    <a
                      href={inspectingTrade.htfScreenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Higher TF Context Chart
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
