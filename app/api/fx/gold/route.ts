import { NextResponse } from "next/server"
import { getGoldRates, getGoldUsdPrice } from "@/lib/fx-rates"

export const revalidate = 21600 // 6 hours

export async function GET() {
  try {
    const [price, ratesData] = await Promise.all([
      getGoldUsdPrice(),
      getGoldRates(),
    ])

    return NextResponse.json(
      {
        price,
        formattedPrice: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(price),
        base: ratesData.base,
        timestamp: ratesData.timestamp,
        rates: ratesData.rates,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (error: any) {
    console.warn("GET /api/fx/gold error:", error)
    return NextResponse.json(
      {
        price: 2750.0,
        formattedPrice: "$2,750",
        base: "XAU",
        timestamp: Date.now(),
        rates: { USD: 2750.0 },
      },
      { status: 200 }
    )
  }
}
