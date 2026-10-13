import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { getSessionUser } from "@/lib/auth-utils"

export async function GET() {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const header =
      "instrument,direction,entryTime,exitTime,entryPrice,exitPrice,lotSize,grossPnL,netPnL,strategy,session,mistakes,lessons\n"

    const trades = await Trade.find({ user: user._id }).sort({ entryTime: 1 }).lean()
    const rows = trades.map((t: any) =>
      [
        t.instrument,
        t.direction,
        new Date(t.entryTime).toISOString(),
        t.exitTime ? new Date(t.exitTime).toISOString() : "",
        t.entryPrice,
        t.exitPrice ?? "",
        t.lotSize ?? 1,
        t.grossPnL ?? 0,
        t.netPnL,
        t.strategy,
        t.session ?? "",
        `"${(t.mistakes ?? []).join("|")}"`,
        `"${(t.lessons ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    )
    const csvData = header + rows.join("\n")

    return new Response(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="forex_trades_${user.name.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("CSV Export error:", error)
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 })
  }
}
