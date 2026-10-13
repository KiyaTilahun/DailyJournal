import { NextResponse } from "next/server"
import { getDailyBudget } from "@/lib/twelvedata"

export async function GET() {
  try {
    const budget = await getDailyBudget()
    return NextResponse.json({ budget }, { status: 200 })
  } catch (error: any) {
    console.warn("GET /api/market/budget error:", error?.message)
    return NextResponse.json(
      {
        budget: {
          dailyLimit: 8,
          creditsUsed: 8,
          creditsRemaining: 0,
          lastUpdated: new Date().toISOString(),
          isExhausted: true,
          hasApiKey: false,
        },
      },
      { status: 200 }
    )
  }
}
