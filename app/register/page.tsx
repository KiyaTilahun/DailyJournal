"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CandlestickChart,
  Lock,
  Mail,
  User,
  DollarSign,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [initialBalance, setInitialBalance] = React.useState("10000")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          initialBalance: parseFloat(initialBalance) || 10000,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create account")
        setLoading(false)
        return
      }

      // Automatically sign in the user
      const loginRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (loginRes?.error) {
        router.push("/login?registered=true")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during registration.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-card border border-border/80 rounded-2xl shadow-xl animate-in fade-in-50 duration-200">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
          <CandlestickChart className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create your Trading Account</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Track your capital, manage personal strategies, and eliminate psychological leaks.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            Full Name / Trader Alias
          </Label>
          <Input
            id="name"
            placeholder="Alex Trader"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="h-10 bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="trader@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-10 bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Password (min 6 characters)
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="h-10 bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="initialBalance" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            Starting Account Balance ($ USD)
          </Label>
          <Input
            id="initialBalance"
            type="number"
            step="100"
            min="0"
            placeholder="10000"
            value={initialBalance}
            onChange={e => setInitialBalance(e.target.value)}
            className="h-10 bg-background"
          />
          <p className="text-[11px] text-muted-foreground">
            Default balance snapshot used for risk calculations and equity curve tracking.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Automatic Strategy Starter Pack</span>
          </div>
          <p>
            Your account will be provisioned with 4 default strategies: <strong>SMC, Supply & Demand, Breakout, and Price Action</strong>.
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 font-semibold text-sm shadow-sm gap-2"
        >
          {loading ? "Creating Account..." : "Create Account & Start Journaling"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="text-center text-xs sm:text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  )
}
