"use client"

import * as React from "react"
import { ExternalLink, Globe, Newspaper } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "cn"

export interface MarketauxSentiment {
  label: "positive" | "negative" | "neutral"
  score: number
}

export interface MarketNewsItem {
  id?: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  sentiment: MarketauxSentiment
  entities: string[]
}

interface MarketNewsCardProps {
  userSymbols?: string[]
}

function getTimeAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMins = Math.floor(diffMs / (60 * 1000))
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return "recent"
  }
}

export function MarketNewsCard({ userSymbols = [] }: MarketNewsCardProps) {
  const [news, setNews] = React.useState<MarketNewsItem[]>([])
  const [loading, setLoading] = React.useState(true)

  // Normalize user open symbols for fast matching
  const normalizedUserSymbols = React.useMemo(() => {
    const set = new Set<string>()
    for (const s of userSymbols) {
      if (!s) continue
      set.add(s.toUpperCase().trim())
      set.add(s.replace(/[\/\-_\s]/g, "").toUpperCase().trim())
    }
    return set
  }, [userSymbols])

  React.useEffect(() => {
    let isMounted = true

    // Pass user's open instruments if available
    const query = userSymbols.length > 0 ? `?symbols=${encodeURIComponent(userSymbols.join(","))}` : ""

    fetch(`/api/market/news${query}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return
        const articles: MarketNewsItem[] = Array.isArray(data) ? data : data?.news || []
        setNews(articles.slice(0, 5))
      })
      .catch(err => {
        console.warn("MarketNewsCard fetch error:", err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [userSymbols.join(",")])

  return (
    <Card className="border-border/80 shadow-xs flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Newspaper className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Market News</CardTitle>
            <CardDescription className="text-xs">
              Macro headlines & sentiment intelligence
            </CardDescription>
          </div>
        </div>

        <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono text-muted-foreground border-border/70">
          Marketaux
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {news.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            News feed paused
          </div>
        ) : (
          <TooltipProvider delay={150}>
            {news.map((item, idx) => {
              const hasMatchingSymbol = item.entities.some(e =>
                normalizedUserSymbols.has(e.toUpperCase().trim()) ||
                normalizedUserSymbols.has(e.replace(/[\/\-_\s]/g, "").toUpperCase().trim())
              )

              const sentimentLabel = item.sentiment?.label || "neutral"
              const sentimentBadgeClass =
                sentimentLabel === "positive"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : sentimentLabel === "negative"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : "bg-muted text-muted-foreground border-border/60"

              return (
                <div key={item.id || item.url || idx} className="space-y-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "group block p-2.5 rounded-xl border transition-all text-left",
                            hasMatchingSymbol
                              ? "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60"
                              : "border-border/60 bg-card hover:bg-muted/40 hover:border-border"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                              {item.title}
                            </h4>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity mt-0.5" />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground/80">{item.source}</span>
                              <span>•</span>
                              <span>{getTimeAgo(item.publishedAt)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Sentiment badge */}
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize",
                                  sentimentBadgeClass
                                )}
                              >
                                {sentimentLabel}
                              </span>
                            </div>
                          </div>

                          {/* Symbol entity chips */}
                          {item.entities && item.entities.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-2">
                              {item.entities.map(sym => {
                                const isUserOpen =
                                  normalizedUserSymbols.has(sym.toUpperCase().trim()) ||
                                  normalizedUserSymbols.has(sym.replace(/[\/\-_\s]/g, "").toUpperCase().trim())

                                return (
                                  <span
                                    key={sym}
                                    className={cn(
                                      "text-[10px] font-mono px-1.5 py-0.2 rounded border transition-colors",
                                      isUserOpen
                                        ? "bg-primary/20 text-primary border-primary/50 font-bold shadow-xs"
                                        : "bg-muted/50 text-muted-foreground border-border/40 font-medium"
                                    )}
                                  >
                                    {sym}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </a>
                      }
                    />
                    {item.description && (
                      <TooltipContent side="top" className="max-w-xs text-xs p-2.5 leading-relaxed">
                        {item.description}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              )
            })}
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
