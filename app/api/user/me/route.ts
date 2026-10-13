import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-utils"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      accountBalance: user.accountBalance,
      accountCurrency: user.accountCurrency,
      preferredStrategies: user.preferredStrategies || [],
      balanceAdjustments: user.balanceAdjustments || [],
      createdAt: user.createdAt,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch user" }, { status: 500 })
  }
}
