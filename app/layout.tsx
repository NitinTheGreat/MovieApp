import type { Metadata } from "next"
import { Bricolage_Grotesque, Playfair_Display } from "next/font/google"
import "./globals.css"
import type React from "react"

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "Movie Search App",
  description: "Search and discover your favorite movies",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${playfair.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}

