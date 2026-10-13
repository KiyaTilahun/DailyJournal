import { Metadata } from "next"
import { MindsetAnalysisView } from "@/components/mindset-analysis-view"
import { RoutesNavigationBanner } from "@/components/routes-navigation-banner"

export const metadata: Metadata = {
  title: "Mistake Audit & Error Cost — Forex Trading Journal",
  description: "Identify and eliminate financial leaks from FOMO, over-leveraging, and undisciplined trading."
}

export default function MistakesPage() {
  return (
    <div className="space-y-6">
      <MindsetAnalysisView />
      <RoutesNavigationBanner className="pt-2 max-w-7xl mx-auto" />
    </div>
  )
}
