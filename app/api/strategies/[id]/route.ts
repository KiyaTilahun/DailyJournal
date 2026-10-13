import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Strategy } from "@/lib/models/Strategy"
import { Trade } from "@/lib/models/Trade"
import { getSessionUser } from "@/lib/auth-utils"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, context: RouteContext) {
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

    const body = await req.json()
    const oldName = strategy.name

    if (body.name !== undefined) {
      const trimmedName = String(body.name).trim()
      if (!trimmedName) {
        return NextResponse.json({ error: "Strategy name cannot be empty" }, { status: 400 })
      }

      // Check uniqueness if name changed
      if (trimmedName !== strategy.name) {
        const clash = await Strategy.findOne({
          owner: user._id,
          name: trimmedName,
          _id: { $ne: strategy._id },
        })
        if (clash) {
          return NextResponse.json(
            { error: `You already have a strategy named "${trimmedName}"` },
            { status: 409 }
          )
        }
        strategy.name = trimmedName

        // Update trade records if strategy name changed so historical logs stay synced
        await Trade.updateMany(
          { user: user._id, strategy: oldName },
          { $set: { strategy: trimmedName } }
        )
      }
    }

    if (body.description !== undefined) {
      strategy.description = String(body.description)
    }

    if (body.active !== undefined) {
      strategy.active = Boolean(body.active)
    }

    await strategy.save()

    return NextResponse.json({
      _id: strategy._id.toString(),
      name: strategy.name,
      description: strategy.description,
      active: strategy.active,
    })
  } catch (error: any) {
    console.error("PATCH /api/strategies/[id] error:", error)
    return NextResponse.json({ error: error.message || "Failed to update strategy" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
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

    // Check if any trades by this user reference this strategy
    const tradeCount = await Trade.countDocuments({
      user: user._id,
      strategy: strategy.name,
    })

    if (tradeCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete strategy "${strategy.name}". It is referenced by ${tradeCount} trade${
            tradeCount > 1 ? "s" : ""
          }. Consider toggling it to Inactive instead to preserve your historical logs.`,
          tradeCount,
          suggestSoftDisable: true,
        },
        { status: 409 }
      )
    }

    await Strategy.deleteOne({ _id: strategy._id })

    // Also remove from user preferredStrategies if pinned
    user.preferredStrategies = (user.preferredStrategies || []).filter(
      pId => pId.toString() !== strategy._id.toString()
    )
    await user.save()

    return NextResponse.json({ success: true, deletedId: id, name: strategy.name })
  } catch (error: any) {
    console.error("DELETE /api/strategies/[id] error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete strategy" }, { status: 500 })
  }
}
