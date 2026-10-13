"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  CalendarDays,
  Brain,
  AlertOctagon,
  ArrowRight
} from "lucide-react"

import { cn } from "@/lib/utils"
import { APP_ROUTES, AppRoute } from "@/lib/routes"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ICON_MAP = {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  CalendarDays,
  Brain,
  AlertOctagon
}

interface RoutesNavigationBannerProps {
  currentPath?: string
  className?: string
}

export function RoutesNavigationBanner({ className }: RoutesNavigationBannerProps) {
  const pathname = usePathname()

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>Journal Modules & Dedicated Routes</span>
        </h3>
        <span className="text-[11px] text-muted-foreground">App Router Active</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {APP_ROUTES.map(route => {
          const Icon = ICON_MAP[route.iconName] || LayoutDashboard
          const isActive = route.path === "/" ? pathname === "/" : pathname.startsWith(route.path)

          return (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                "group flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left bg-card hover:bg-muted/50 hover:shadow-xs",
                isActive
                  ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs"
                  : "border-border/70 hover:border-border"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold tracking-tight truncate",
                      isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                    )}
                  >
                    {route.label}
                  </span>
                  <ArrowRight
                    className={cn(
                      "h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                      isActive && "opacity-100 text-primary"
                    )}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {route.description}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-mono text-[10px] text-muted-foreground/70">{route.path}</span>
                  {isActive && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
