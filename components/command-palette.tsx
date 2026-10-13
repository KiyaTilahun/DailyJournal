"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Compass,
  FileDown,
  LayoutDashboard,
  PlusCircle,
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
import { useTrades } from "@/lib/trade-context"

export function CommandPalette() {
  const router = useRouter()
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    openNewTradeModal,
    exportTradesCsv,
    setJournalSearchFilter
  } = useTrades()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setCommandPaletteOpen])

  const navigateTo = (path: string, filter?: string) => {
    setCommandPaletteOpen(false)
    if (filter !== undefined) {
      setJournalSearchFilter(filter)
    }
    router.push(path)
  }

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search trades, pairs, strategies, emotions or actions... (⌘K)" />
      <CommandList className="max-h-[380px]">
        <CommandEmpty>No matching trade or action found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false)
              openNewTradeModal()
            }}
            className="cursor-pointer"
          >
            <PlusCircle className="mr-2 h-4 w-4 text-primary" />
            <span>Log New Trade Entry</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false)
              exportTradesCsv()
            }}
            className="cursor-pointer"
          >
            <FileDown className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Journal Data (CSV)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Routes & Pages">
          <CommandItem
            onSelect={() => navigateTo("/")}
            className="cursor-pointer"
          >
            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Dashboard Overview</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => navigateTo("/journal")}
            className="cursor-pointer"
          >
            <Compass className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Trade Logs & History</span>
            <CommandShortcut>/journal</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => navigateTo("/analytics")}
            className="cursor-pointer"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Equity Curve & Performance KPIs</span>
            <CommandShortcut>/analytics</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => navigateTo("/calendar")}
            className="cursor-pointer"
          >
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Trading Calendar</span>
            <CommandShortcut>/calendar</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => navigateTo("/psychology")}
            className="cursor-pointer"
          >
            <BrainCircuit className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Mindset & Emotions Tracker</span>
            <CommandShortcut>/psychology</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => navigateTo("/mistakes")}
            className="cursor-pointer"
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Mistake Audit & Error Cost</span>
            <CommandShortcut>/mistakes</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Pair Filters">
          <CommandItem
            onSelect={() => navigateTo("/journal", "XAU/USD")}
            className="cursor-pointer"
          >
            <span className="font-semibold text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded mr-2">
              GOLD
            </span>
            <span>XAU/USD (Gold) Trades</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigateTo("/journal", "EUR/USD")}
            className="cursor-pointer"
          >
            <span className="font-semibold text-xs bg-muted px-1.5 py-0.5 rounded mr-2">FX</span>
            <span>EUR/USD Trades</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigateTo("/journal", "GBP/USD")}
            className="cursor-pointer"
          >
            <span className="font-semibold text-xs bg-muted px-1.5 py-0.5 rounded mr-2">FX</span>
            <span>GBP/USD Trades</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigateTo("/journal", "USD/JPY")}
            className="cursor-pointer"
          >
            <span className="font-semibold text-xs bg-muted px-1.5 py-0.5 rounded mr-2">FX</span>
            <span>USD/JPY Trades</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigateTo("/journal", "GBP/JPY")}
            className="cursor-pointer"
          >
            <span className="font-semibold text-xs bg-muted px-1.5 py-0.5 rounded mr-2">FX</span>
            <span>GBP/JPY Trades</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Mistake & Psychology Analysis">
          <CommandItem
            onSelect={() => navigateTo("/journal", "FOMO")}
            className="cursor-pointer"
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-rose-500" />
            <span>Cost of FOMO Entries</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigateTo("/journal", "OVER_LEVERAGED")}
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
