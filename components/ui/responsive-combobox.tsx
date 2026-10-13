"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "cn"

import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export interface ComboboxItem {
  value: string
  label: string
  subLabel?: string
  badge?: string
  badgeColor?: string
  icon?: React.ReactNode
  keywords?: string[]
}

export interface ComboboxGroup {
  name: string
  items: ComboboxItem[]
}

export interface ResponsiveComboboxProps {
  value: string
  onValueChange: (value: string) => void
  groups?: ComboboxGroup[]
  items?: ComboboxItem[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  title?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  disabled?: boolean
  renderTrigger?: (selectedItem?: ComboboxItem, isOpen?: boolean) => React.ReactElement
}

export function ResponsiveCombobox({
  value,
  onValueChange,
  groups,
  items,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  title,
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
  renderTrigger,
}: ResponsiveComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  // Normalize groups
  const resolvedGroups: ComboboxGroup[] = React.useMemo(() => {
    if (groups && groups.length > 0) return groups
    if (items && items.length > 0) return [{ name: "", items }]
    return []
  }, [groups, items])

  // Flat list of all items for lookups
  const allItems = React.useMemo(() => {
    return resolvedGroups.flatMap(g => g.items)
  }, [resolvedGroups])

  const selectedItem = React.useMemo(() => {
    return allItems.find(i => i.value.toLowerCase() === value.toLowerCase())
  }, [allItems, value])

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
  }

  // Common Command Body
  const renderCommandContent = (isMobileView: boolean) => (
    <Command className="w-full">
      <CommandInput
        placeholder={searchPlaceholder}
        className={isMobileView ? "h-11 text-base" : "h-9 text-xs sm:text-sm"}
      />
      <CommandList
        className={cn(
          "overflow-y-auto outline-hidden",
          isMobileView ? "max-h-[60vh] p-2" : "max-h-[300px] p-1"
        )}
      >
        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </CommandEmpty>

        {resolvedGroups.map((group, groupIdx) => (
          <React.Fragment key={group.name || groupIdx}>
            {groupIdx > 0 && <CommandSeparator className="my-1" />}
            <CommandGroup
              heading={
                group.name ? (
                  <div className="flex items-center justify-between w-full py-0.5">
                    <span className="font-semibold text-xs tracking-wide">
                      {group.name}
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground border border-border/50">
                      {group.items.length}
                    </span>
                  </div>
                ) : undefined
              }
              className={cn(
                group.name &&
                  "[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10 [&_[cmdk-group-heading]]:bg-popover/95 [&_[cmdk-group-heading]]:backdrop-blur-xs [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:px-2.5"
              )}
            >
              {group.items.map(item => {
                const isSelected = item.value.toLowerCase() === value.toLowerCase()
                return (
                  <CommandItem
                    key={item.value}
                    value={`${item.value} ${item.label} ${item.subLabel || ""} ${item.keywords?.join(" ") || ""}`}
                    onSelect={() => handleSelect(item.value)}
                    className={cn(
                      "flex items-center justify-between cursor-pointer rounded-lg transition-colors",
                      isMobileView
                        ? "min-h-11 py-3 px-3.5 text-sm"
                        : "py-2 px-2.5 text-xs sm:text-sm"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      <div className="flex flex-col min-w-0 text-left">
                        <span
                          className="font-medium truncate"
                          title={item.label}
                        >
                          {item.label}
                        </span>
                        {item.subLabel && (
                          <span
                            className="text-[11px] text-muted-foreground truncate"
                            title={item.subLabel}
                          >
                            {item.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                            item.badgeColor ||
                              "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </Command>
  )

  // Default Trigger Button
  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "w-full justify-between font-normal text-left h-10 px-3 bg-background border-border/80 hover:bg-muted/40",
        !selectedItem && "text-muted-foreground",
        triggerClassName
      )}
    >
      <div className="flex items-center gap-2 min-w-0 truncate">
        {selectedItem?.icon && (
          <span className="shrink-0">{selectedItem.icon}</span>
        )}
        <span className="truncate">
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        {selectedItem?.badge && (
          <span
            className={cn(
              "text-[10px] font-mono px-1.5 py-0.2 rounded border ml-1",
              selectedItem.badgeColor ||
                "bg-muted text-muted-foreground border-border"
            )}
          >
            {selectedItem.badge}
          </span>
        )}
      </div>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )

  const triggerNode: React.ReactElement = renderTrigger
    ? renderTrigger(selectedItem, open)
    : defaultTrigger

  // Mobile Bottom Sheet
  if (isMobile) {
    return (
      <div className={cn("relative w-full", className)}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={triggerNode} />
          <SheetContent
            side="bottom"
            className="p-0 z-[60] rounded-t-2xl max-h-[85vh] border-t border-border flex flex-col bg-popover"
          >
            <SheetHeader className="px-4 py-3 border-b border-border/60 shrink-0 text-left">
              <SheetTitle className="text-sm font-semibold">
                {title || placeholder}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Select an option from the list below
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-hidden flex flex-col">
              {renderCommandContent(true)}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop Floating Popover
  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={triggerNode} />
        <PopoverContent
          align="start"
          sideOffset={4}
          className={cn(
            "p-0 z-[60] w-[--radix-popover-trigger-width] min-w-[300px] max-w-[420px] shadow-2xl border border-border bg-popover rounded-xl overflow-hidden",
            contentClassName
          )}
        >
          {renderCommandContent(false)}
        </PopoverContent>
      </Popover>
    </div>
  )
}
