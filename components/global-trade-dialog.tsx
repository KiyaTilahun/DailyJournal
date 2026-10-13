"use client"

import * as React from "react"
import { useTrades } from "@/lib/trade-context"
import { TradeEntryDialog } from "@/components/trade-entry-dialog"

export function GlobalTradeDialog() {
  const {
    tradeEntryOpen,
    setTradeEntryOpen,
    editingTrade,
    saveTrade
  } = useTrades()

  return (
    <TradeEntryDialog
      open={tradeEntryOpen}
      onOpenChange={setTradeEntryOpen}
      onSaveTrade={saveTrade}
      editingTrade={editingTrade}
    />
  )
}
