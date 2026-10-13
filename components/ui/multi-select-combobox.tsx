"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "cn"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
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

export interface MultiSelectOption {
  value: string
  label: string
  category?: string
  description?: string
  badge?: string
}

export interface MultiSelectComboboxProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: (string | MultiSelectOption)[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  title?: string
  maxBadges?: number
  className?: string
  triggerClassName?: string
  disabled?: boolean
}

export function MultiSelectCombobox({
  values,
  onValuesChange,
  options,
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No matching options.",
  title = "Select Multiple Items",
  maxBadges = 3,
  className,
  triggerClassName,
  disabled = false,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  // Normalize options
  const normalizedOptions: MultiSelectOption[] = React.useMemo(() => {
    return options.map(opt =>
      typeof opt === "string"
        ? { value: opt, label: opt }
        : opt
    )
  }, [options])

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onValuesChange(values.filter(v => v !== val))
    } else {
      onValuesChange([...values, val])
    }
  }

  const removeOption = (val: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onValuesChange(values.filter(v => v !== val))
  }

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onValuesChange([])
  }

  // Common Command Body
  const renderCommandContent = (isMobileView: boolean) => (
    <Command className="w-full">
      <CommandInput
        placeholder={searchPlaceholder}
        className={isMobileView ? "h-11 text-base" : "h-9 text-xs sm:text-sm"}
      />
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 text-[11px] text-muted-foreground bg-muted/20">
        <span>
          {values.length} of {normalizedOptions.length} selected
        </span>
        {values.length > 0 && (
          <button
            type="button"
            onClick={() => clearAll()}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
      <CommandList
        className={cn(
          "overflow-y-auto outline-hidden",
          isMobileView ? "max-h-[60vh] p-2" : "max-h-[300px] p-1.5"
        )}
      >
        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </CommandEmpty>

        <CommandGroup>
          {normalizedOptions.map(option => {
            const isSelected = values.includes(option.value)
            return (
              <CommandItem
                key={option.value}
                value={`${option.value} ${option.label} ${option.description || ""}`}
                onSelect={() => toggleOption(option.value)}
                className={cn(
                  "flex items-center justify-between cursor-pointer rounded-lg transition-colors",
                  isMobileView
                    ? "min-h-11 py-3 px-3.5 text-sm"
                    : "py-2 px-2.5 text-xs sm:text-sm"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="font-medium truncate" title={option.label}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>

                {option.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-muted text-muted-foreground shrink-0 ml-2">
                    {option.badge}
                  </span>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  // Badge Trigger Button
  const triggerNode = (
    <div
      role="combobox"
      aria-expanded={open}
      className={cn(
        "group w-full min-h-10 px-3 py-1.5 rounded-lg border border-border/80 bg-background text-sm flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-muted/30 focus-within:ring-2 focus-within:ring-ring/30",
        disabled && "opacity-50 pointer-events-none cursor-not-allowed",
        triggerClassName
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        {values.length === 0 ? (
          <span className="text-xs sm:text-sm text-muted-foreground truncate">
            {placeholder}
          </span>
        ) : (
          <>
            {values.slice(0, maxBadges).map(val => {
              const match = normalizedOptions.find(o => o.value === val)
              const label = match ? match.label : val
              return (
                <Badge
                  key={val}
                  variant="secondary"
                  className="text-[11px] py-0.5 px-2 bg-primary/10 text-primary border-primary/20 flex items-center gap-1 shrink-0 font-medium max-w-[200px]"
                >
                  <span className="truncate">{label}</span>
                  <button
                    type="button"
                    onClick={e => removeOption(val, e)}
                    className="hover:bg-primary/20 rounded-full p-0.5 shrink-0"
                    aria-label={`Remove ${label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            {values.length > maxBadges && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono px-1.5 py-0.5 bg-muted text-muted-foreground shrink-0 font-semibold"
              >
                +{values.length - maxBadges} more
              </Badge>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
        {values.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="p-1 hover:text-foreground rounded-md text-muted-foreground/70"
            title="Clear all selected"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </div>
    </div>
  )

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
              <SheetTitle className="text-sm font-semibold">{title}</SheetTitle>
              <SheetDescription className="sr-only">
                Check all applicable options
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
          className="p-0 z-[60] w-[--radix-popover-trigger-width] min-w-[320px] max-w-[460px] shadow-2xl border border-border bg-popover rounded-xl overflow-hidden"
        >
          {renderCommandContent(false)}
        </PopoverContent>
      </Popover>
    </div>
  )
}
