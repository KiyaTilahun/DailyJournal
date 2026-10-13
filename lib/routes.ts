import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  CalendarDays,
  Brain,
  AlertOctagon,
  Target,
  LucideIcon
} from "lucide-react"

export interface AppRoute {
  path: string
  label: string
  shortTitle: string
  description: string
  iconName: "LayoutDashboard" | "BookOpen" | "TrendingUp" | "CalendarDays" | "Brain" | "AlertOctagon" | "Target"
  group: "core" | "insights" | "mindset"
  badge?: string
}

export const APP_ROUTES: AppRoute[] = [
  {
    path: "/",
    label: "Dashboard",
    shortTitle: "Overview",
    description: "Daily greeting, quick actions, core KPIs, and balance growth",
    iconName: "LayoutDashboard",
    group: "core"
  },
  {
    path: "/journal",
    label: "Trade Logs",
    shortTitle: "Journal",
    description: "Chronological trade logs, filtering, confluences, and trade detail inspection",
    iconName: "BookOpen",
    group: "core"
  },
  {
    path: "/strategies",
    label: "Strategies",
    shortTitle: "Setups",
    description: "Manage backend strategies, active toggles, trade counts, and trade entry pins",
    iconName: "Target",
    group: "core"
  },
  {
    path: "/analytics",
    label: "Equity & Stats",
    shortTitle: "Analytics",
    description: "Interactive equity compounding curve, drawdowns, pair & session efficacy",
    iconName: "TrendingUp",
    group: "insights"
  },
  {
    path: "/calendar",
    label: "Calendar",
    shortTitle: "Calendar",
    description: "Day-by-day trading calendar with daily PnL badges and consistency tracking",
    iconName: "CalendarDays",
    group: "insights"
  },
  {
    path: "/psychology",
    label: "Mindset & Emotions",
    shortTitle: "Psychology",
    description: "Pre-trade emotional states, conviction levels, exit discipline, and reflection notes",
    iconName: "Brain",
    group: "mindset"
  },
  {
    path: "/mistakes",
    label: "Mistake Audit",
    shortTitle: "Mistakes",
    description: "Cost of FOMO, over-leveraging, and systematic error tracking",
    iconName: "AlertOctagon",
    group: "mindset"
  }
]
