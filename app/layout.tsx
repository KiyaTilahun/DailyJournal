import { Geist_Mono, Inter } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TradeProvider } from "@/lib/trade-context"
import { AppShell } from "@/components/app-shell"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Forex Trading Journal — Discipline & Analytics",
  description: "Personal Forex trading journal tracking execution, psychology, risk-to-reward, and mistake cost analysis."
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <TradeProvider>
            <AppShell>{children}</AppShell>
          </TradeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
