import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trading Journal - Professional Trade Tracking & Analytics',
  description: 'Track, analyze, and improve your trading performance with comprehensive analytics, risk management tools, and detailed reporting.',
  keywords: [
    'trading journal',
    'trade tracking',
    'trading analytics',
    'risk management',
    'performance metrics',
    'trading dashboard'
  ],
  authors: [{ name: 'Trading Journal Team' }],
  creator: 'Trading Journal',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trading-journal.app',
    title: 'Trading Journal - Professional Trade Tracking',
    description: 'Professional trading journal with advanced analytics and performance tracking.',
    siteName: 'Trading Journal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Journal - Professional Trade Tracking',
    description: 'Professional trading journal with advanced analytics and performance tracking.',
    creator: '@tradingjournal',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={cn(
        inter.className,
        "h-full bg-white dark:bg-gray-900 antialiased"
      )}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
}