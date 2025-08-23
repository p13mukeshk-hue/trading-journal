import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  // Handle invalid amount values
  if (typeof amount !== 'number' || !isFinite(amount)) {
    amount = 0;
  }
  
  // Ensure currency is a valid string, fallback to USD if not
  const validCurrency = typeof currency === 'string' && currency.length === 3 ? currency : 'USD';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: validCurrency,
  }).format(amount)
}

export function formatPercent(
  value: number,
  locale = 'en-US',
  decimals = 2
): string {
  // Handle invalid values
  if (typeof value !== 'number' || !isFinite(value)) {
    return '0.00%';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

export function formatNumber(
  value: number,
  locale = 'en-US',
  decimals = 2
): string {
  // Handle invalid values
  if (typeof value !== 'number' || !isFinite(value)) {
    return '0.00';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(date: Date, format = 'short'): string {
  const options: Intl.DateTimeFormatOptions = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    time: { hour: '2-digit', minute: '2-digit' },
  }[format] || { year: 'numeric', month: 'short', day: 'numeric' }

  return new Intl.DateTimeFormat('en-US', options).format(date)
}

export function calculatePnL(
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  entryFees = 0,
  exitFees = 0
): { pnl: number; pnlPercent: number } {
  let pnl: number
  
  if (side === 'LONG') {
    pnl = (exitPrice - entryPrice) * quantity - entryFees - exitFees
  } else {
    pnl = (entryPrice - exitPrice) * quantity - entryFees - exitFees
  }
  
  const investment = entryPrice * quantity + entryFees
  const pnlPercent = (pnl / investment) * 100
  
  return { pnl, pnlPercent }
}

export function calculateRMultiple(
  pnl: number,
  riskAmount: number
): number | null {
  if (!riskAmount || riskAmount === 0) return null
  return pnl / riskAmount
}

export function calculateDuration(
  entryDate: Date,
  exitDate: Date
): { 
  minutes: number
  hours: number
  days: number
  readable: string
} {
  const diffMs = exitDate.getTime() - entryDate.getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  let readable: string
  if (days > 0) {
    readable = `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    readable = `${hours}h ${minutes % 60}m`
  } else {
    readable = `${minutes}m`
  }
  
  return { minutes, hours, days, readable }
}

export function getColorForPnL(pnl: number): string {
  if (pnl > 0) return 'text-success-600'
  if (pnl < 0) return 'text-danger-600'
  return 'text-gray-600'
}

export function getColorForPercent(percent: number): string {
  if (percent > 0) return 'text-success-600'
  if (percent < 0) return 'text-danger-600'
  return 'text-gray-600'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function generateRandomId(length = 8): string {
  return Math.random().toString(36).substring(2, length + 2)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n')
  const result: string[][] = []
  
  for (const line of lines) {
    if (line.trim()) {
      result.push(line.split(',').map(cell => cell.trim().replace(/"/g, '')))
    }
  }
  
  return result
}

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}