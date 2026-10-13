import { Metadata } from "next"
import { MindsetAnalysisView } from "@/components/mindset-analysis-view"
import { RoutesNavigationBanner } from "@/components/routes-navigation-banner"

export const metadata: Metadata = {
  title: "Mindset & Emotions Tracker — Forex Trading Journal",
  description: "Track emotional states at entry, conviction levels, exit discipline, and reflection notes."
}

export default function PsychologyPage() {
  return (
    <div className="space-y-6">
      <MindsetAnalysisView />
      <RoutesNavigationBanner className="pt-2 max-w-7xl mx-auto" />
    </div>
  )
}
