"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  Compass,
  FileDown,
  Flame,
  LayoutDashboard,
  PlusCircle,
  Search,
  SlidersHorizontal,
  TrendingUp,
  BrainCircuit,
  AlertTriangle
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewTradeClick: () => void
  onNavigate: (sectionId: string) => void
  onExportCsv: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onNewTradeClick,
  onNavigate,
  onExportCsv
}: CommandPaletteProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search trades, pairs, strategies, emotions or actions... (⌘K)" />
      <CommandList className="max-h-[360px]">
        <CommandEmpty>No matching trade or action found.</CommandEmpty>
        
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNewTradeClick()
            }}
            className="cursor-pointer"
          >
            <PlusCircle className="mr-2 h-4 w-4 text-primary" />
            <span>Log New Trade Entry</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onExportCsv()
            }}
            className="cursor-pointer"
          >
            <FileDown className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Journal Data (CSV)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("dashboard")
            }}
            className="cursor-pointer"
          >
            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Dashboard Overview</span>
          </CommandItem>
          
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("analytics")
            }}
            className="cursor-pointer"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Equity Curve & Performance KPIs</span>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("journal")
            }}
            className="cursor-pointer"
          >
            <Compass className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Trade Logs & History</span>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("calendar")
            }}
            className="cursor-pointer"
          >
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Trading Calendar</span>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("psychology")
            }}
            className="cursor-pointer"
          >
            <BrainCircuit className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Psychology & Mistakes Log</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Pair Filters">
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("journal-EURUSD")
            }}
            className="cursor-pointer"
          >
            <span className="font-semibold text-xs bg-muted px-1.5 py-0.5 rounded mr-2">FX</span>
            <span>EUR/USD Trades</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("journal-XAUUSD")
            }}
            className="cursor-pointer"
          >
            <span className="font-semibold text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded mr-2">METAL</span>
            <span>XAU/USD (Gold) Trades</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("journal-GBPJPY")
            }}
            className="cursor-pointer"
          >
            <span className="font-semibold text-xs bg-muted px-1.5 py-0.5 rounded mr-2">FX</span>
            <span>GBP/JPY Trades</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Mistake & Psychology Analysis">
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("mistake-FOMO")
            }}
            className="cursor-pointer"
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-rose-500" />
            <span>Cost of FOMO Entries</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onNavigate("mistake-OVER_LEVERAGED")
            }}
            className="cursor-pointer"
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
            <span>Over-leveraged Trades</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
