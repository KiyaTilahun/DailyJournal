"use client"

import * as React from "react"
import { useTrades } from "@/lib/trade-context"
import { SidebarNav } from "@/components/sidebar-nav"
import { HeaderBar } from "@/components/header-bar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { CommandPalette } from "@/components/command-palette"
import { GlobalTradeDialog } from "@/components/global-trade-dialog"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { mobileMenuOpen, setMobileMenuOpen } = useTrades()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* 1. Desktop Collapsible Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <SidebarNav />
      </div>

      {/* 2. Mobile Drawer Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarNav />
        </SheetContent>
      </Sheet>

      {/* 3. Main Application Column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <HeaderBar />

        {/* Scrollable Main Content Slot */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* 4. Global Modals */}
      <CommandPalette />
      <GlobalTradeDialog />
    </div>
  )
}
