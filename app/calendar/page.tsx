import { Metadata } from "next"
import { Suspense } from "react"
import { CalendarView, CalendarViewSkeleton } from "@/components/calendar-view"
import { RoutesNavigationBanner } from "@/components/routes-navigation-banner"

export const metadata: Metadata = {
  title: "Trading Calendar & Daily PnL Heatmap — Forex Trading Journal",
  description: "Day-by-day month execution grid, emotional discipline heatmap, weekly rollups, and habit attribution."
}

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<CalendarViewSkeleton />}>
        <CalendarView />
      </Suspense>
      <RoutesNavigationBanner className="pt-2 max-w-7xl mx-auto" />
    </div>
  )
}
