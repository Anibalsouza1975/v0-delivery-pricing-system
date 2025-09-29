import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { PricingProvider } from "@/components/pricing-context-supabase"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Sistema de Precificação Delivery",
  description: "Sistema completo para precificação de delivery e restaurantes",
  generator: "v0.app",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <PricingProvider>{children}</PricingProvider>
        </Suspense>
      </body>
    </html>
  )
}
