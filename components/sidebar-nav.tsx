"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronLeft,
  Download,
  Flame,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Brain,
  AlertOctagon,
  Target,
  LogOut,
  User as UserIcon
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { APP_ROUTES, AppRoute } from "@/lib/routes"
import { useTrades } from "@/lib/trade-context"

const ICON_MAP = {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  CalendarDays,
  Brain,
  AlertOctagon,
  Target,
}

export function SidebarNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const {
    sidebarCollapsed,
    toggleSidebar,
    summary,
    openNewTradeModal,
    setCommandPaletteOpen,
    exportTradesCsv,
    resetSeedTrades
  } = useTrades()

  const coreRoutes = APP_ROUTES.filter(r => r.group === "core")
  const insightsRoutes = APP_ROUTES.filter(r => r.group === "insights")
  const mindsetRoutes = APP_ROUTES.filter(r => r.group === "mindset")

  const renderNavLink = (route: AppRoute) => {
    const Icon = ICON_MAP[route.iconName] || LayoutDashboard
    const isActive = route.path === "/" ? pathname === "/" : pathname.startsWith(route.path)

    if (sidebarCollapsed) {
      return (
        <Tooltip key={route.path}>
          <TooltipTrigger
            render={
              <Link
                href={route.path}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg mx-auto transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
                aria-label={route.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            }
          />
          <TooltipContent side="right">
            {route.badge ? `${route.label} (${route.badge})` : route.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return (
      <Link
        key={route.path}
        href={route.path}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-2 border-primary"
            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
        <span className="truncate flex-1">{route.label}</span>
        {route.badge && (
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
            {route.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <TooltipProvider delay={150}>
      <aside
        className={cn(
          "relative z-30 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 ease-in-out select-none h-full",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Floating Collapse / Expand Toggle Button on Right Border */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!sidebarCollapsed}
                className="absolute -right-3 top-5 z-40 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-background shadow-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <ChevronLeft
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    sidebarCollapsed && "rotate-180"
                  )}
                />
              </button>
            }
          />
          <TooltipContent side="right">
            {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>

        {/* Brand Block */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-sidebar-border shrink-0",
            sidebarCollapsed ? "justify-center px-0" : "px-3.5"
          )}
        >
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="/"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs transition-transform hover:scale-105"
                    aria-label="FX Journal Pro Dashboard"
                  >
                    <TrendingUp className="h-5 w-5" />
                  </Link>
                }
              />
              <TooltipContent side="right">FX Journal Pro</TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs transition-transform group-hover:scale-105">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm tracking-tight truncate flex items-center gap-1.5 text-foreground leading-tight">
                  FX Journal
                  <span className="text-[10px] uppercase font-mono px-1 rounded bg-primary/10 text-primary border border-primary/20">
                    Pro
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground truncate leading-tight">
                  Discipline & Analytics
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Primary "+ Log Trade" CTA */}
        <div className="p-3">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={openNewTradeModal}
                    size="icon"
                    className="h-9 w-9 mx-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                    aria-label="Log New Trade"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipContent side="right">Log New Trade (N)</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={openNewTradeModal}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Log New Trade</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-primary-foreground/20 px-1.5 font-mono text-[10px] font-medium text-primary-foreground">
                N
              </kbd>
            </Button>
          )}
        </div>

        {/* Quick Search Button in Sidebar */}
        <div className="px-3 pb-2">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCommandPaletteOpen(true)}
                    className="h-9 w-9 mx-auto text-muted-foreground hover:text-foreground"
                    aria-label="Search & Filter"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipContent side="right">Search & Filter (⌘K)</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left truncate">Search & Filter...</span>
              <kbd className="pointer-events-none inline-flex h-4 items-center rounded bg-muted px-1 font-mono text-[9px] text-muted-foreground border">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
          {/* Main Core Group */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Trading Core
              </p>
            )}
            <nav className="space-y-0.5">{coreRoutes.map(renderNavLink)}</nav>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Insights Group */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Insights & Calendar
              </p>
            )}
            <nav className="space-y-0.5">{insightsRoutes.map(renderNavLink)}</nav>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Psychology & Discipline Group */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Mindset & Strategy
              </p>
            )}
            <nav className="space-y-0.5">{mindsetRoutes.map(renderNavLink)}</nav>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Quick Actions / Data Tools */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Data Tools
              </p>
            )}
            <div className="space-y-0.5">
              {sidebarCollapsed ? (
                <>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          onClick={exportTradesCsv}
                          className="flex h-9 w-9 items-center justify-center rounded-lg mx-auto text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      }
                    />
                    <TooltipContent side="right">Export CSV</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          onClick={resetSeedTrades}
                          className="flex h-9 w-9 items-center justify-center rounded-lg mx-auto text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      }
                    />
                    <TooltipContent side="right">Reset Demo Data</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <button
                    onClick={exportTradesCsv}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate">Export to CSV</span>
                  </button>
                  <button
                    onClick={resetSeedTrades}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="truncate">Reset Demo Trades</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom User & Balance Widget */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar/50 space-y-2">
          {sidebarCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="flex flex-col items-center gap-1 cursor-default">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {session?.user?.name?.[0] || "FX"}
                      </div>
                      <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ${(summary.currentBalance / 1000).toFixed(1)}k
                      </span>
                    </div>
                  }
                />
                <TooltipContent side="right">
                  {session?.user?.name || "Trader"} | ${summary.currentBalance.toLocaleString()}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex h-8 w-8 items-center justify-center rounded-lg mx-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  }
                />
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-card/60 border border-border/60">
                <div className="h-9 w-9 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">Live Balance</span>
                    <span className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                      <Flame className="h-3 w-3 mr-0.5 fill-amber-500 text-amber-500" />
                      {summary.currentStreak.count}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    ${summary.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {session?.user && (
                <div className="flex items-center justify-between px-1 pt-1 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                      {session.user.name?.[0] || "U"}
                    </div>
                    <div className="truncate flex flex-col">
                      <span className="font-medium text-foreground truncate text-xs">{session.user.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{session.user.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
