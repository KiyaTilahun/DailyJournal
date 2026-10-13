"use client"

import * as React from "react"
import { DollarSign, ArrowDownRight, ArrowUpRight, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useTrades } from "@/lib/trade-context"

interface AdjustBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdjustBalanceDialog({ open, onOpenChange }: AdjustBalanceDialogProps) {
  const { userProfile, adjustBalance } = useTrades()

  const currentBalance = userProfile?.accountBalance ?? 10000

  const [amount, setAmount] = React.useState("")
  const [type, setType] = React.useState<"DEPOSIT" | "WITHDRAWAL" | "RESET">("DEPOSIT")
  const [note, setNote] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const parsedAmount = parseFloat(amount) || 0

  let projectedBalance = currentBalance
  if (type === "DEPOSIT") projectedBalance = currentBalance + parsedAmount
  else if (type === "WITHDRAWAL") projectedBalance = currentBalance - parsedAmount
  else if (type === "RESET") projectedBalance = parsedAmount

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0")
      return
    }

    if (type === "WITHDRAWAL" && parsedAmount > currentBalance) {
      setError(`Cannot withdraw more than current balance ($${currentBalance.toFixed(2)})`)
      return
    }

    setLoading(true)
    setError("")

    const res = await adjustBalance(parsedAmount, type, note.trim())
    setLoading(false)

    if (res.success) {
      setAmount("")
      setNote("")
      onOpenChange(false)
    } else {
      setError(res.error || "Failed to adjust balance")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Adjust Account Balance
          </DialogTitle>
          <DialogDescription>
            Record deposits, capital withdrawals, or reset your baseline starting balance.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdjust} className="space-y-4 py-2">
          {/* Current Balance Display */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Current Balance:</span>
            <span className="font-mono text-base font-bold text-foreground">
              ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Adjustment Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Adjustment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("DEPOSIT")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === "DEPOSIT"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Deposit (+)
              </button>
              <button
                type="button"
                onClick={() => setType("WITHDRAWAL")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === "WITHDRAWAL"
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" />
                Withdrawal (-)
              </button>
              <button
                type="button"
                onClick={() => setType("RESET")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === "RESET"
                    ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <RefreshCw className="h-3 w-3" />
                Reset (=)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold">
              Amount ($ USD)
            </Label>
            <Input
              id="amount"
              type="number"
              step="any"
              min="0.01"
              placeholder="e.g. 5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="h-10 font-mono text-sm bg-background"
            />
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs font-semibold">
              Description / Transaction Memo
            </Label>
            <Input
              id="note"
              placeholder="e.g. Monthly Capital Injection, Funded Account payout, Broker deposit"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="h-10 text-xs bg-background"
            />
          </div>

          {/* Projected Balance Preview */}
          {parsedAmount > 0 && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Projected Balance:</span>
              <span className="font-mono font-bold text-primary text-sm">
                ${projectedBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || parsedAmount <= 0}>
              {loading ? "Updating..." : "Confirm Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
