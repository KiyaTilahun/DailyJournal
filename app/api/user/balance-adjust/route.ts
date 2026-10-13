import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-utils"

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, type, note } = await req.json()
    const numericAmount = Number(amount)

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "A valid positive amount is required" }, { status: 400 })
    }

    if (!["DEPOSIT", "WITHDRAWAL", "RESET"].includes(type)) {
      return NextResponse.json({ error: "Type must be DEPOSIT, WITHDRAWAL, or RESET" }, { status: 400 })
    }

    if (type === "WITHDRAWAL" && user.accountBalance < numericAmount) {
      return NextResponse.json(
        { error: `Insufficient account balance ($${user.accountBalance.toFixed(2)}) for withdrawal` },
        { status: 400 }
      )
    }

    if (type === "DEPOSIT") {
      user.accountBalance += numericAmount
    } else if (type === "WITHDRAWAL") {
      user.accountBalance -= numericAmount
    } else if (type === "RESET") {
      user.accountBalance = numericAmount
    }

    const adjustmentRecord = {
      amount: numericAmount,
      type: type as "DEPOSIT" | "WITHDRAWAL" | "RESET",
      note: note || (type === "DEPOSIT" ? "Manual Deposit" : type === "WITHDRAWAL" ? "Manual Withdrawal" : "Balance Reset"),
      date: new Date(),
    }

    user.balanceAdjustments = user.balanceAdjustments || []
    user.balanceAdjustments.push(adjustmentRecord as any)

    await user.save()

    return NextResponse.json({
      message: "Balance updated successfully",
      accountBalance: user.accountBalance,
      adjustment: adjustmentRecord,
      balanceAdjustments: user.balanceAdjustments,
    })
  } catch (error: any) {
    console.error("Balance adjustment error:", error)
    return NextResponse.json({ error: error.message || "Failed to adjust balance" }, { status: 500 })
  }
}
