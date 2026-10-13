"use client"

import * as React from "react"
import {
  Trade,
  TradingAccountSummary,
  PairPerformance,
  SessionPerformance,
  StrategyPerformance,
  MistakeAnalysis
} from "./trading-types"
import {
  getStoredTrades,
  saveTrades,
  addTrade as storageAddTrade,
  updateTrade as storageUpdateTrade,
  deleteTrade as storageDeleteTrade,
  resetToSeedData,
  computeAccountSummary,
  computeEquityCurve,
  computePairPerformance,
  computeSessionPerformance,
  computeStrategyPerformance,
  computeMistakeAnalysis,
  downloadCSV,
  getInitialStartingBalance
} from "./trading-storage"

export type DatabaseMode = "mongodb" | "local" | "connecting"

interface TradeContextValue {
  trades: Trade[]
  startingBalance: number
  dbMode: DatabaseMode
  summary: TradingAccountSummary
  equityCurve: Array<{ date: string; balance: number; netPnL: number; cumulativePnL: number }>
  pairPerformance: PairPerformance[]
  sessionPerformance: SessionPerformance[]
  strategyPerformance: StrategyPerformance[]
  mistakeAnalysis: MistakeAnalysis[]
  sidebarCollapsed: boolean
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  toggleSidebar: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  tradeEntryOpen: boolean
  setTradeEntryOpen: React.Dispatch<React.SetStateAction<boolean>>
  editingTrade: Trade | null
  setEditingTrade: React.Dispatch<React.SetStateAction<Trade | null>>
  commandPaletteOpen: boolean
  setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>
  openNewTradeModal: () => void
  openEditTradeModal: (trade: Trade) => void
  saveTrade: (tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  resetSeedTrades: () => Promise<void>
  exportTradesCsv: () => void
  journalSearchFilter: string
  setJournalSearchFilter: (filter: string) => void
}

const TradeContext = React.createContext<TradeContextValue | undefined>(undefined)

function mapMongoTradeToApp(doc: any): Trade {
  return {
    id: doc._id?.toString() || doc.id || `TRD-${Date.now()}`,
    instrument: doc.instrument,
    direction: doc.direction,
    entryDate: doc.entryTime ? new Date(doc.entryTime).toISOString() : new Date().toISOString(),
    exitDate: doc.exitTime ? new Date(doc.exitTime).toISOString() : new Date().toISOString(),
    entryPrice: doc.entryPrice,
    stopLossPrice: doc.stopLoss ?? 0,
    takeProfitPrice: doc.takeProfit ?? 0,
    exitPrice: doc.exitPrice ?? doc.entryPrice,
    lotSize: doc.lotSize ?? 1.0,
    commissions: doc.commission ?? 0,
    swaps: doc.swap ?? 0,
    spreadCost: doc.spread ?? 0,
    grossPnL: doc.grossPnL ?? 0,
    netPnL: doc.netPnL,
    plannedRR: doc.plannedRR ?? 0,
    realizedRR: doc.realizedRR ?? 0,
    status: doc.netPnL > 5 ? "WIN" : doc.netPnL < -5 ? "LOSS" : "BE",
    strategy: doc.strategy || "SMC_ORDER_BLOCK",
    executionTimeframe: doc.executionTF || "15m",
    trendTimeframe: doc.trendTF || "4h",
    session: doc.session || "LONDON",
    confluences: doc.confluences || [],
    preTradeEmotion: doc.preTradeEmotion || "CONFIDENT",
    preTradeConfidence: doc.emotionScore || 4,
    postTradeEmotion: doc.postTradeEmotion || "HELD_TO_TP",
    mistakeTag: doc.mistakes && doc.mistakes.length > 0 ? doc.mistakes[0] : "NONE",
    lessonsLearned: doc.lessons || "",
    entryScreenshotUrl: doc.screenshots?.[0]?.url,
    htfScreenshotUrl: doc.screenshots?.[1]?.url,
    tags: doc.tags || [],
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  }
}

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = React.useState<Trade[]>([])
  const [startingBalance, setStartingBalance] = React.useState(10000)
  const [dbMode, setDbMode] = React.useState<DatabaseMode>("connecting")

  // Layout & Global Dialog States
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [tradeEntryOpen, setTradeEntryOpen] = React.useState(false)
  const [editingTrade, setEditingTrade] = React.useState<Trade | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false)
  const [journalSearchFilter, setJournalSearchFilter] = React.useState("")

  React.useEffect(() => {
    // 1. Load LocalStorage first for instant rendering
    const stored = getStoredTrades()
    setTrades(stored)
    setStartingBalance(getInitialStartingBalance())

    const savedSidebar = localStorage.getItem("forex_journal_sidebar_collapsed")
    if (savedSidebar !== null) {
      setSidebarCollapsed(savedSidebar === "true")
    }

    // 2. Probe API to see if MongoDB Atlas is connected
    fetch("/api/trades")
      .then(async res => {
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const mapped = data.map(mapMongoTradeToApp)
            setTrades(mapped)
            saveTrades(mapped)
          }
          setDbMode("mongodb")
        } else {
          setDbMode("local")
        }
      })
      .catch(() => {
        setDbMode("local")
      })
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("forex_journal_sidebar_collapsed", String(next))
      }
      return next
    })
  }

  // Keyboard shortcut: 'N' to open trade entry
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }
      if (e.key === "n" || e.key === "N") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault()
          setEditingTrade(null)
          setTradeEntryOpen(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Analytics calculations
  const summary = React.useMemo(() => {
    return computeAccountSummary(trades, startingBalance)
  }, [trades, startingBalance])

  const equityCurve = React.useMemo(() => {
    return computeEquityCurve(trades, startingBalance)
  }, [trades, startingBalance])

  const pairPerformance = React.useMemo(() => {
    return computePairPerformance(trades)
  }, [trades])

  const sessionPerformance = React.useMemo(() => {
    return computeSessionPerformance(trades)
  }, [trades])

  const strategyPerformance = React.useMemo(() => {
    return computeStrategyPerformance(trades)
  }, [trades])

  const mistakeAnalysis = React.useMemo(() => {
    return computeMistakeAnalysis(trades)
  }, [trades])

  const openNewTradeModal = () => {
    setEditingTrade(null)
    setTradeEntryOpen(true)
  }

  const openEditTradeModal = (trade: Trade) => {
    setEditingTrade(trade)
    setTradeEntryOpen(true)
  }

  const saveTrade = async (tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">) => {
    // 1. Optimistic Local Update
    if (editingTrade) {
      storageUpdateTrade(editingTrade.id, tradeData)
      setTrades(getStoredTrades())
    } else {
      storageAddTrade(tradeData)
      setTrades(getStoredTrades())
    }

    // 2. Sync with MongoDB if available
    if (dbMode === "mongodb") {
      try {
        const payload = {
          instrument: tradeData.instrument,
          direction: tradeData.direction,
          entryTime: tradeData.entryDate,
          exitTime: tradeData.exitDate,
          entryPrice: tradeData.entryPrice,
          stopLoss: tradeData.stopLossPrice,
          takeProfit: tradeData.takeProfitPrice,
          exitPrice: tradeData.exitPrice,
          lotSize: tradeData.lotSize,
          commission: tradeData.commissions,
          swap: tradeData.swaps,
          spread: tradeData.spreadCost,
          grossPnL: tradeData.grossPnL,
          netPnL: tradeData.netPnL,
          strategy: tradeData.strategy,
          executionTF: tradeData.executionTimeframe,
          trendTF: tradeData.trendTimeframe,
          session: tradeData.session,
          confluences: tradeData.confluences,
          plannedRR: tradeData.plannedRR,
          realizedRR: tradeData.realizedRR,
          preTradeEmotion: tradeData.preTradeEmotion,
          emotionScore: tradeData.preTradeConfidence,
          postTradeEmotion: tradeData.postTradeEmotion,
          mistakes: tradeData.mistakeTag !== "NONE" ? [tradeData.mistakeTag] : [],
          lessons: tradeData.lessonsLearned,
          tags: tradeData.tags,
        }

        if (editingTrade) {
          await fetch(`/api/trades/${editingTrade.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        } else {
          await fetch("/api/trades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        }
      } catch (err) {
        console.warn("MongoDB sync failed, saved locally:", err)
      }
    }

    setEditingTrade(null)
  }

  const deleteTrade = async (id: string) => {
    storageDeleteTrade(id)
    setTrades(getStoredTrades())

    if (dbMode === "mongodb") {
      try {
        await fetch(`/api/trades/${id}`, { method: "DELETE" })
      } catch (err) {
        console.warn("MongoDB delete sync failed:", err)
      }
    }
  }

  const resetSeedTrades = async () => {
    if (confirm("Reset and seed trade logs with default demonstration records?")) {
      resetToSeedData()
      setTrades(getStoredTrades())

      if (dbMode === "mongodb") {
        try {
          const res = await fetch("/api/seed", { method: "POST" })
          if (res.ok) {
            const fresh = await fetch("/api/trades")
            if (fresh.ok) {
              const data = await fresh.json()
              if (Array.isArray(data) && data.length > 0) {
                setTrades(data.map(mapMongoTradeToApp))
              }
            }
          }
        } catch (err) {
          console.warn("MongoDB seed sync error:", err)
        }
      }
    }
  }

  const exportTradesCsv = () => {
    downloadCSV(trades)
  }

  return (
    <TradeContext.Provider
      value={{
        trades,
        startingBalance,
        dbMode,
        summary,
        equityCurve,
        pairPerformance,
        sessionPerformance,
        strategyPerformance,
        mistakeAnalysis,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        mobileMenuOpen,
        setMobileMenuOpen,
        tradeEntryOpen,
        setTradeEntryOpen,
        editingTrade,
        setEditingTrade,
        commandPaletteOpen,
        setCommandPaletteOpen,
        openNewTradeModal,
        openEditTradeModal,
        saveTrade,
        deleteTrade,
        resetSeedTrades,
        exportTradesCsv,
        journalSearchFilter,
        setJournalSearchFilter,
      }}
    >
      {children}
    </TradeContext.Provider>
  )
}

export function useTrades() {
  const context = React.useContext(TradeContext)
  if (!context) {
    throw new Error("useTrades must be used within a TradeProvider")
  }
  return context
}
