import { NextResponse } from "next/server"
import { connectDB, isDbConfigured } from "@/lib/db"
import { Trade } from "@/lib/models/Trade"
import { SAMPLE_TRADES } from "@/lib/seed-data"

export async function GET() {
  try {
    let csvData = ""
    const header =
      "instrument,direction,entryTime,exitTime,entryPrice,exitPrice,lotSize,grossPnL,netPnL,strategy,session,mistakes,lessons\n"

    if (isDbConfigured()) {
      await connectDB()
      const trades = await Trade.find().sort({ entryTime: 1 }).lean()
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
      csvData = header + rows.join("\n")
    } else {
      const rows = SAMPLE_TRADES.map(t =>
        [
          t.instrument,
          t.direction,
          t.entryDate,
          t.exitDate,
          t.entryPrice,
          t.exitPrice,
          t.lotSize,
          t.grossPnL,
          t.netPnL,
          t.strategy,
          t.session,
          `"${t.mistakeTag !== "NONE" ? t.mistakeTag : ""}"`,
          `"${(t.lessonsLearned || "").replace(/"/g, '""')}"`,
        ].join(",")
      )
      csvData = header + rows.join("\n")
    }

    return new Response(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="trades-${Date.now()}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "CSV export failed" }, { status: 500 })
  }
}
