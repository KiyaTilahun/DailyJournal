import { Metadata } from "next"
import { AnalyticsPageView } from "@/components/analytics-page-view"

export const metadata: Metadata = {
  title: "Equity & Performance Analytics — Forex Trading Journal",
  description: "Account balance equity compounding curve, max drawdown, and strategy efficacy metrics."
}

export default function AnalyticsPage() {
  return <AnalyticsPageView />
}
