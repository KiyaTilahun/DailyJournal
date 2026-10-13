"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileDown,
  Flame,
  Menu,
  Plus,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { APP_ROUTES } from "@/lib/routes"
import { useTrades } from "@/lib/trade-context"

export function HeaderBar() {
  const pathname = usePathname()
  const {
    setMobileMenuOpen,
    setCommandPaletteOpen,
    openNewTradeModal,
    exportTradesCsv,
    summary,
    dbMode
  } = useTrades()

  const currentRoute = APP_ROUTES.find(r => (r.path === "/" ? pathname === "/" : pathname.startsWith(r.path))) || APP_ROUTES[0]

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-md transition-all">
      {/* Left: Mobile Trigger & Desktop Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden h-8 w-8 text-muted-foreground"
          aria-label="Open navigation drawer"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground text-xs">
                FX Journal
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs font-semibold text-foreground">
                {currentRoute.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Center: Global Command Palette Pill Button */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-9 w-full items-center justify-between rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-card focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="truncate">Search trades, pairs, strategies, emotions...</span>
          </span>
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions Cluster */}
      <div className="flex items-center gap-2">
        {/* DB Status Indicator */}
        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono border bg-card/60 cursor-default">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      dbMode === "mongodb"
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-amber-500/80"
                    }`}
                  />
                  <span className="text-muted-foreground uppercase font-semibold">
                    {dbMode === "mongodb" ? "MongoDB Atlas" : "Local Storage"}
                  </span>
                </div>
              }
            />
            <TooltipContent side="bottom">
              {dbMode === "mongodb"
                ? "Connected to MongoDB Atlas cluster via Mongoose."
                : "Running in Local Storage mode. Set MONGODB_URI in .env.local to persist directly to MongoDB Atlas."}
            </TooltipContent>
          </Tooltip>

          {/* Streak Indicator */}
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 cursor-default shadow-xs">
                  <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                  <span className="font-mono font-semibold">{summary.currentStreak.count}</span>
                  <span className="hidden md:inline text-[11px] font-normal text-muted-foreground">
                    {summary.currentStreak.type === "WIN"
                      ? "Win Streak"
                      : summary.currentStreak.type === "LOSS"
                      ? "Loss Streak"
                      : "Streak"}
                  </span>
                </div>
              }
            />
            <TooltipContent side="bottom">
              {summary.currentStreak.type === "WIN"
                ? `You are on a ${summary.currentStreak.count}-trade winning streak! Keep following your plan.`
                : summary.currentStreak.type === "LOSS"
                ? `Current streak: ${summary.currentStreak.count} loss. Pause, review rules, avoid revenge trading.`
                : "No active streak recorded."}
            </TooltipContent>
          </Tooltip>

          {/* Export CSV Quick Button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={exportTradesCsv}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
                >
                  <FileDown className="h-4 w-4" />
                </Button>
              }
            />
            <TooltipContent side="bottom">Export Trades to CSV</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Quick Log Button for small screens */}
        <Button
          size="sm"
          onClick={openNewTradeModal}
          className="h-8 px-2.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex sm:hidden"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>Log</span>
        </Button>
      </div>
    </header>
  )
}
