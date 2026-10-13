"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CandlestickChart, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Invalid email or password. Please verify your credentials.")
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = () => {
    setEmail("pro.trader@forex.local")
    setPassword("TraderPass123!")
  }

  return (
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-card border border-border/80 rounded-2xl shadow-xl animate-in fade-in-50 duration-200">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
          <CandlestickChart className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in to your Journal</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Log trades, track execution discipline, and inspect your edge.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-10 bg-background"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 font-semibold text-sm shadow-sm gap-2"
        >
          {loading ? "Authenticating..." : "Sign In"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Quick Demo Credentials Fill Button */}
      <div className="pt-2 border-t border-border/50 text-center">
        <button
          type="button"
          onClick={fillDemoAccount}
          className="text-xs text-muted-foreground hover:text-primary transition-colors underline cursor-pointer"
        >
          Use demo credentials (pro.trader@forex.local)
        </button>
      </div>

      <div className="text-center text-xs sm:text-sm text-muted-foreground">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create account
        </Link>
      </div>
    </div>
  )
}
