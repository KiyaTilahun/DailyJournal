import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Strategy } from "@/lib/models/Strategy"
import { getSessionUser } from "@/lib/auth-utils"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, context: RouteContext) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { id } = await context.params
    const strategy = await Strategy.findOne({ _id: id, owner: user._id })

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    const currentPins = (user.preferredStrategies || []).map(pId => pId.toString())
    const isCurrentlyPinned = currentPins.includes(id)

    let updatedPins: any[]
    let isPinned: boolean

    if (isCurrentlyPinned) {
      updatedPins = currentPins.filter(pId => pId !== id)
      isPinned = false
    } else {
      updatedPins = [...currentPins, strategy._id]
      isPinned = true
    }

    user.preferredStrategies = updatedPins as any
    await user.save()

    return NextResponse.json({
      success: true,
      strategyId: id,
      isPinned,
      preferredStrategies: user.preferredStrategies,
    })
  } catch (error: any) {
    console.error("POST /api/strategies/[id]/pin error:", error)
    return NextResponse.json({ error: error.message || "Failed to toggle pin" }, { status: 500 })
  }
}
