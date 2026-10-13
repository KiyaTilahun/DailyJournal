import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { Strategy } from "@/lib/models/Strategy"
import { Trade } from "@/lib/models/Trade"

export async function POST(req: Request) {
  try {
    await connectDB()
    const { name, email, password, initialBalance } = await req.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const totalUsersCount = await User.countDocuments()
    const isFirstUser = totalUsersCount === 0

    const passwordHash = await bcrypt.hash(password, 10)
    const parsedBalance = typeof initialBalance === "number" && !isNaN(initialBalance) ? initialBalance : 10000

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      accountBalance: parsedBalance,
      accountCurrency: "USD",
      preferredStrategies: [],
      balanceAdjustments: [
        {
          amount: parsedBalance,
          type: "RESET",
          note: "Initial Starting Balance",
          date: new Date(),
        },
      ],
    })

    // 5.2 Seed comprehensive standard strategies for the new user (owner = user._id)
    const defaultStrategyDefs = [
      { name: "SMC Order Block", description: "Smart Money Concepts & Order Block Retest" },
      { name: "Liquidity Sweep", description: "Asian / London High-Low Sweep & Market Shift" },
      { name: "Supply & Demand", description: "Institutional Imbalance Zones & Fresh Retests" },
      { name: "Breakout Momentum", description: "Key Level Breakout with Volume Expansion" },
      { name: "Trend Pullback", description: "Higher Timeframe Trend Retracement & Confluence" },
      { name: "Fair Value Gap (FVG)", description: "Inefficiency Fill & Algorithmic Entry" },
      { name: "Price Action", description: "Key S/R Reversal & Candlestick Confirmation" },
    ]

    const createdStrategies = await Strategy.insertMany(
      defaultStrategyDefs.map(s => ({
        owner: user._id,
        name: s.name,
        description: s.description,
        active: true,
      }))
    )

    // Pin the first two strategies as preferred
    user.preferredStrategies = [createdStrategies[0]._id, createdStrategies[1]._id]
    await user.save()

    // 5.1 Backfill existing unassigned trades to first registered user if any
    if (isFirstUser) {
      await Trade.updateMany(
        { user: { $exists: false } },
        { $set: { user: user._id, balanceAtEntry: parsedBalance } }
      )
    }

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          accountBalance: user.accountBalance,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: error.message || "Failed to register user" }, { status: 500 })
  }
}
