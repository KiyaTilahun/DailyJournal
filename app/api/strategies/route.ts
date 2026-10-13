import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Strategy } from "@/lib/models/Strategy"
import { Trade } from "@/lib/models/Trade"
import { getSessionUser } from "@/lib/auth-utils"

export async function GET(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("active") === "true"

    const filter: Record<string, any> = { owner: user._id }
    if (activeOnly) {
      filter.active = true
    }

    // Fetch user's strategies: active first, alphabetical sort
    const strategies = await Strategy.find(filter)
      .sort({ active: -1, name: 1 })
      .lean()

    // Aggregate trade counts per strategy for this user
    const tradeCounts = await Trade.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: "$strategy", count: { $sum: 1 } } },
    ])

    const countMap: Record<string, number> = {}
    tradeCounts.forEach(tc => {
      if (tc._id) {
        const raw = String(tc._id)
        const norm = raw.toLowerCase().replace(/[_\-\s]+/g, "")
        countMap[raw] = (countMap[raw] || 0) + tc.count
        countMap[norm] = (countMap[norm] || 0) + tc.count
      }
    })

    const preferredSet = new Set((user.preferredStrategies || []).map(id => id.toString()))

    const enriched = strategies.map((s: any) => {
      const normName = s.name.toLowerCase().replace(/[_\-\s]+/g, "")
      const count = countMap[s.name] || countMap[normName] || 0
      return {
        _id: s._id.toString(),
        name: s.name,
        description: s.description || "",
        active: s.active,
        isPinned: preferredSet.has(s._id.toString()),
        tradeCount: count,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }
    })

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("GET /api/strategies error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch strategies" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { name, description, active } = await req.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Strategy name is required" }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Check uniqueness per user
    const existing = await Strategy.findOne({ owner: user._id, name: trimmedName })
    if (existing) {
      return NextResponse.json(
        { error: `You already have a strategy named "${trimmedName}"` },
        { status: 409 }
      )
    }

    const created = await Strategy.create({
      owner: user._id,
      name: trimmedName,
      description: description || "",
      active: active !== undefined ? Boolean(active) : true,
    })

    return NextResponse.json(
      {
        _id: created._id.toString(),
        name: created.name,
        description: created.description,
        active: created.active,
        isPinned: false,
        tradeCount: 0,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("POST /api/strategies error:", error)
    return NextResponse.json({ error: error.message || "Failed to create strategy" }, { status: 500 })
  }
}
