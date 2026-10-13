import { Metadata } from "next"
import { CalendarView } from "@/components/calendar-view"
import { RoutesNavigationBanner } from "@/components/routes-navigation-banner"

export const metadata: Metadata = {
  title: "Trading Calendar — Forex Trading Journal",
  description: "Day-by-day trading calendar with daily net PnL badges and consistency tracking."
}

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <CalendarView />
      <RoutesNavigationBanner className="pt-2 max-w-7xl mx-auto" />
    </div>
  )
}
