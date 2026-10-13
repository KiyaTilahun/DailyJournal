"use client"

import * as React from "react"
import {
  Target,
  Plus,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Layers,
  Sparkles,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

export interface StrategyItem {
  _id: string
  name: string
  description: string
  active: boolean
  isPinned: boolean
  tradeCount: number
  createdAt?: string
  updatedAt?: string
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = React.useState<StrategyItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [successMsg, setSuccessMsg] = React.useState("")

  // Create / Edit modal state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingStrategy, setEditingStrategy] = React.useState<StrategyItem | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formDesc, setFormDesc] = React.useState("")
  const [formSaving, setFormSaving] = React.useState(false)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = React.useState<StrategyItem | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const fetchStrategies = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/strategies")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setStrategies(data)
        }
      } else {
        const err = await res.json()
        setError(err.error || "Failed to load strategies")
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch strategies")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchStrategies()
  }, [fetchStrategies])

  const openCreateDialog = () => {
    setEditingStrategy(null)
    setFormName("")
    setFormDesc("")
    setError("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (strat: StrategyItem) => {
    setEditingStrategy(strat)
    setFormName(strat.name)
    setFormDesc(strat.description || "")
    setError("")
    setIsDialogOpen(true)
  }

  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    setFormSaving(true)
    setError("")
    try {
      if (editingStrategy) {
        // Edit
        const res = await fetch(`/api/strategies/${editingStrategy._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim(),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Failed to update strategy")
          setFormSaving(false)
          return
        }
        setSuccessMsg(`Strategy "${formName}" updated successfully`)
      } else {
        // Create
        const res = await fetch("/api/strategies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim(),
            active: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Failed to create strategy")
          setFormSaving(false)
          return
        }
        setSuccessMsg(`Strategy "${formName}" created successfully`)
      }

      setIsDialogOpen(false)
      await fetchStrategies()
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setFormSaving(false)
    }
  }

  const handleToggleActive = async (strat: StrategyItem) => {
    const nextState = !strat.active
    // Optimistic update
    setStrategies(prev =>
      prev.map(s => (s._id === strat._id ? { ...s, active: nextState } : s))
    )

    try {
      const res = await fetch(`/api/strategies/${strat._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextState }),
      })
      if (!res.ok) {
        fetchStrategies()
      }
    } catch {
      fetchStrategies()
    }
  }

  const handleTogglePin = async (strat: StrategyItem) => {
    const nextPin = !strat.isPinned
    setStrategies(prev =>
      prev.map(s => (s._id === strat._id ? { ...s, isPinned: nextPin } : s))
    )

    try {
      const res = await fetch(`/api/strategies/${strat._id}/pin`, {
        method: "POST",
      })
      if (!res.ok) {
        fetchStrategies()
      }
    } catch {
      fetchStrategies()
    }
  }

  const handleDeleteStrategy = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/strategies/${deleteTarget._id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setDeleteError(data.error)
        } else {
          setDeleteError(data.error || "Failed to delete strategy")
        }
        setDeleting(false)
        return
      }

      setDeleteTarget(null)
      await fetchStrategies()
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred")
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = strategies.filter(s => s.active).length
  const pinnedCount = strategies.filter(s => s.isPinned).length
  const totalTradesRef = strategies.reduce((acc, s) => acc + s.tradeCount, 0)

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Trading Strategy Playbook</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage your edge, soft-disable stale models, and pin go-to setups to the trade logger.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={openCreateDialog} className="shadow-xs font-semibold gap-2 h-10">
          <Plus className="h-4 w-4" />
          New Strategy
        </Button>
      </div>

      {/* Toast Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && !isDialogOpen && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs">
          <span className="text-xs font-semibold uppercase text-muted-foreground block">Total Setups</span>
          <span className="text-2xl font-bold tracking-tight font-mono">{strategies.length}</span>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] shadow-xs">
          <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 block">Active Models</span>
          <span className="text-2xl font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">{activeCount}</span>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] shadow-xs">
          <span className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400 block">Pinned to Dialog</span>
          <span className="text-2xl font-bold tracking-tight font-mono text-amber-600 dark:text-amber-400">{pinnedCount}</span>
        </div>
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] shadow-xs">
          <span className="text-xs font-semibold uppercase text-primary block">Referenced Trades</span>
          <span className="text-2xl font-bold tracking-tight font-mono text-primary">{totalTradesRef}</span>
        </div>
      </div>

      {/* Strategies List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">Loading strategies...</div>
      ) : strategies.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">No strategies yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create your first trading model (e.g., Breakout, SMC, Supply & Demand) to start cataloging your setups.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Strategy
          </Button>
        </div>
      ) : (
        /* Strategy Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {strategies.map(strat => (
            <div
              key={strat._id}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs ${
                strat.active
                  ? "bg-card border-border/80 hover:border-border"
                  : "bg-muted/30 border-border/40 opacity-70"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base tracking-tight truncate">{strat.name}</h3>
                      {strat.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Pin className="h-2.5 w-2.5 fill-current" />
                          Pinned
                        </span>
                      )}
                      {!strat.active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {strat.description || "No description provided."}
                    </p>
                  </div>

                  {/* Pin Toggle Button */}
                  <button
                    onClick={() => handleTogglePin(strat)}
                    title={strat.isPinned ? "Unpin from trade entry dialog" : "Pin to top of trade entry dialog"}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      strat.isPinned
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25"
                        : "bg-background border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {strat.isPinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
                  </button>
                </div>

                {/* Trade count badge */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">Logged Trades:</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                    {strat.tradeCount} trade{strat.tradeCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Bottom controls */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={strat.active}
                    onCheckedChange={() => handleToggleActive(strat)}
                    id={`active-${strat._id}`}
                  />
                  <Label
                    htmlFor={`active-${strat._id}`}
                    className="text-xs text-muted-foreground cursor-pointer font-medium select-none"
                  >
                    {strat.active ? "Active" : "Disabled"}
                  </Label>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(strat)}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget(strat)
                      setDeleteError(null)
                    }}
                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStrategy ? "Edit Strategy Model" : "Create New Strategy"}</DialogTitle>
            <DialogDescription>
              {editingStrategy
                ? "Update your strategy name and execution criteria."
                : "Add a new setup playbook to track execution and win rates."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSaveStrategy} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="stratName" className="text-xs font-semibold">
                Strategy Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stratName"
                placeholder="e.g. SMC Order Block, Liquidity Sweep, Asian Range Breakout"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
                className="h-10 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stratDesc" className="text-xs font-semibold">
                Setup Model & Confluence Description
              </Label>
              <Textarea
                id="stratDesc"
                rows={3}
                placeholder="Briefly describe the execution edge, entry triggers, HTF alignment rules..."
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                className="bg-background text-xs leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={formSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formSaving || !formName.trim()}>
                {formSaving ? "Saving..." : editingStrategy ? "Save Changes" : "Create Strategy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog with 409 guard */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
              Delete &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs sm:text-sm">
              {deleteError ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
                  {deleteError}
                </div>
              ) : (
                <p>
                  Are you sure you want to delete this strategy? This action cannot be undone. Strategies with
                  existing trade logs cannot be deleted and should instead be toggled to Inactive.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleting}>
              {deleteError ? "Close" : "Cancel"}
            </AlertDialogCancel>

            {deleteError ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (deleteTarget) {
                    handleToggleActive(deleteTarget)
                  }
                  setDeleteTarget(null)
                }}
              >
                Disable Strategy Instead
              </Button>
            ) : (
              <AlertDialogAction
                onClick={handleDeleteStrategy}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
