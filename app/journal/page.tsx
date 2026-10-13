import { Metadata } from "next"
import { TradeJournalView } from "@/components/trade-journal-view"

export const metadata: Metadata = {
  title: "Trade Logs & History — Forex Trading Journal",
  description: "Chronological trade logs, filtering, confluences, and trade detail inspection."
}

export default function JournalPage() {
  return <TradeJournalView />
}
