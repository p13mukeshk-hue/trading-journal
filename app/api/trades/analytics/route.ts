import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET /api/trades/analytics - Get trading analytics and performance metrics
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, return mock data if no authentication is available
    const session = await getServerSession();
    
    // If no session, return demo data
    if (!session?.user?.email) {
      return NextResponse.json({
        data: generateDemoAnalytics(),
      });
    }

    // Get user (only if authenticated)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user && session?.user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use demo user ID if no real user
    const userId = user?.id || 'demo-user';

    const { searchParams } = new URL(request.url);
    const dateRange = {
      start: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      end: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    // Build where clause for date filtering
    const where: any = { 
      userId: user.id,
      isOpen: false, // Only include closed trades for analytics
    };

    if (dateRange.start && dateRange.end) {
      where.entryDate = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    // Get all closed trades for analysis
    const trades = await prisma.trade.findMany({
      where,
      include: {
        setup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { entryDate: 'asc' },
    });

    if (trades.length === 0) {
      return NextResponse.json({
        data: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnl: 0,
          totalPnlPercent: 0,
          averageWin: 0,
          averageLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          profitFactor: 0,
          expectancy: 0,
          averageRMultiple: 0,
          currentStreak: 0,
          longestWinStreak: 0,
          longestLossStreak: 0,
          averageHoldingPeriod: 0,
          equityCurve: [],
          monthlyPnl: [],
          setupAnalysis: [],
          timeAnalysis: {
            hourly: [],
            daily: [],
            monthly: [],
          },
        },
      });
    }

    // Calculate basic metrics
    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
    const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));

    const metrics = {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / trades.length) * 100,
      totalPnl,
      totalPnlPercent: trades.reduce((sum, trade) => sum + (trade.pnlPercent || 0), 0) / trades.length,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      largestWin: Math.max(...trades.map(trade => trade.pnl || 0)),
      largestLoss: Math.min(...trades.map(trade => trade.pnl || 0)),
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0,
      expectancy: totalPnl / trades.length,
      averageRMultiple: trades
        .filter(trade => trade.rMultiple !== null)
        .reduce((sum, trade, _, arr) => sum + (trade.rMultiple || 0) / arr.length, 0),
      averageHoldingPeriod: trades
        .filter(trade => trade.duration)
        .reduce((sum, trade, _, arr) => sum + (trade.duration || 0) / arr.length, 0),
    };

    // Calculate streaks
    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    for (let i = trades.length - 1; i >= 0; i--) {
      const pnl = trades[i].pnl || 0;
      
      if (i === trades.length - 1) {
        currentStreak = pnl > 0 ? 1 : pnl < 0 ? -1 : 0;
      } else {
        const prevPnl = trades[i + 1].pnl || 0;
        if ((pnl > 0 && prevPnl > 0) || (pnl < 0 && prevPnl < 0)) {
          currentStreak += pnl > 0 ? 1 : -1;
        } else {
          currentStreak = pnl > 0 ? 1 : pnl < 0 ? -1 : 0;
        }
      }

      if (pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      } else if (pnl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    }

    // Generate equity curve
    let runningBalance = user.startingCapital || 10000;
    const equityCurve = trades.map((trade, index) => {
      runningBalance += trade.pnl || 0;
      return {
        date: trade.entryDate.toISOString().split('T')[0],
        balance: runningBalance,
        trades: index + 1,
        pnl: trade.pnl || 0,
        drawdown: 0, // Will be calculated below
      };
    });

    // Calculate drawdowns
    let peak = user.startingCapital || 10000;
    equityCurve.forEach(point => {
      if (point.balance > peak) {
        peak = point.balance;
      }
      point.drawdown = ((peak - point.balance) / peak) * 100;
    });

    // Generate monthly P&L
    const monthlyPnl = trades.reduce((acc, trade) => {
      const monthKey = trade.entryDate.toISOString().substring(0, 7); // YYYY-MM
      const existing = acc.find(item => item.month === monthKey);
      
      if (existing) {
        existing.pnl += trade.pnl || 0;
        existing.trades += 1;
      } else {
        acc.push({
          month: monthKey,
          pnl: trade.pnl || 0,
          trades: 1,
        });
      }
      
      return acc;
    }, [] as Array<{ month: string; pnl: number; trades: number }>);

    // Setup analysis
    const setupAnalysis = trades.reduce((acc, trade) => {
      if (!trade.setup) return acc;
      
      const existing = acc.find(item => item.setupId === trade.setup!.id);
      const tradePnl = trade.pnl || 0;
      
      if (existing) {
        existing.trades += 1;
        existing.pnl += tradePnl;
        if (tradePnl > 0) existing.wins += 1;
        existing.winRate = (existing.wins / existing.trades) * 100;
      } else {
        acc.push({
          setupId: trade.setup.id,
          setupName: trade.setup.name,
          trades: 1,
          wins: tradePnl > 0 ? 1 : 0,
          pnl: tradePnl,
          winRate: tradePnl > 0 ? 100 : 0,
          averageRMultiple: trade.rMultiple || 0,
          expectancy: tradePnl,
        });
      }
      
      return acc;
    }, [] as Array<{
      setupId: string;
      setupName: string;
      trades: number;
      wins: number;
      pnl: number;
      winRate: number;
      averageRMultiple: number;
      expectancy: number;
    }>);

    // Time analysis
    const hourlyAnalysis = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      trades: 0,
      pnl: 0,
      wins: 0,
      winRate: 0,
    }));

    const dailyAnalysis = Array.from({ length: 7 }, (_, day) => ({
      day,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      trades: 0,
      pnl: 0,
      wins: 0,
      winRate: 0,
    }));

    trades.forEach(trade => {
      const hour = trade.entryDate.getHours();
      const day = trade.entryDate.getDay();
      const pnl = trade.pnl || 0;
      
      // Hourly
      hourlyAnalysis[hour].trades += 1;
      hourlyAnalysis[hour].pnl += pnl;
      if (pnl > 0) hourlyAnalysis[hour].wins += 1;
      hourlyAnalysis[hour].winRate = (hourlyAnalysis[hour].wins / hourlyAnalysis[hour].trades) * 100;
      
      // Daily
      dailyAnalysis[day].trades += 1;
      dailyAnalysis[day].pnl += pnl;
      if (pnl > 0) dailyAnalysis[day].wins += 1;
      dailyAnalysis[day].winRate = (dailyAnalysis[day].wins / dailyAnalysis[day].trades) * 100;
    });

    return NextResponse.json({
      data: {
        ...metrics,
        currentStreak,
        longestWinStreak,
        longestLossStreak,
        equityCurve,
        monthlyPnl: monthlyPnl.sort((a, b) => a.month.localeCompare(b.month)),
        setupAnalysis: setupAnalysis.sort((a, b) => b.pnl - a.pnl),
        timeAnalysis: {
          hourly: hourlyAnalysis,
          daily: dailyAnalysis,
          monthly: monthlyPnl.map(item => ({
            month: parseInt(item.month.split('-')[1]),
            monthName: new Date(item.month + '-01').toLocaleString('default', { month: 'long' }),
            year: parseInt(item.month.split('-')[0]),
            trades: item.trades,
            pnl: item.pnl,
            winRate: 0, // Would need to calculate from individual trades
          })),
        },
      },
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

// Generate comprehensive demo analytics data for the analytics dashboard
function generateDemoAnalytics() {
  const startBalance = 25000; // Starting with $25K account
  const currentDate = new Date();
  
  // Simulate realistic trading over 45 days with 25 trades
  const totalTrades = 25;
  const closedTrades = 23;
  const openTrades = 2;
  
  // Realistic performance metrics (60% win rate)
  const winningTrades = 14; // 60.9% win rate
  const losingTrades = 9;
  const winRate = (winningTrades / closedTrades) * 100;
  
  // Generate realistic P&L data
  const winners = [
    750.50, 1240.80, 890.25, 445.60, 1180.90, 325.75, 2150.30, 
    540.20, 875.40, 1950.60, 680.15, 1345.80, 425.90, 1080.25
  ];
  const losers = [-285.60, -445.80, -180.25, -520.40, -890.60, -125.30, -675.80, -385.90, -240.15];
  
  const totalWins = winners.reduce((sum, win) => sum + win, 0);
  const totalLosses = Math.abs(losers.reduce((sum, loss) => sum + loss, 0));
  const totalPnl = totalWins - totalLosses;
  
  const averageWin = totalWins / winningTrades;
  const averageLoss = totalLosses / losingTrades;
  const profitFactor = totalWins / totalLosses;
  const expectancy = totalPnl / closedTrades;
  
  // Generate equity curve with realistic progression
  const equityCurve = [];
  let balance = startBalance;
  let peakBalance = startBalance;
  
  // Generate 45 days of equity curve data
  for (let i = 45; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    // Add P&L from trades (not every day has trades)
    let dailyPnl = 0;
    if (Math.random() < 0.4) { // 40% chance of having a trade on any given day
      const isWin = Math.random() < 0.609; // 60.9% win rate
      if (isWin) {
        dailyPnl = winners[Math.floor(Math.random() * winners.length)] * (0.5 + Math.random() * 0.5);
      } else {
        dailyPnl = losers[Math.floor(Math.random() * losers.length)] * (0.5 + Math.random() * 0.5);
      }
    }
    
    balance += dailyPnl;
    if (balance > peakBalance) peakBalance = balance;
    
    const drawdown = ((peakBalance - balance) / peakBalance) * 100;
    
    equityCurve.push({
      date: date.toISOString().split('T')[0],
      balance: Math.round(balance * 100) / 100,
      drawdown: Math.max(0, drawdown),
      trades: Math.floor((45 - i) * (25 / 45)),
      pnl: Math.round(dailyPnl * 100) / 100,
    });
  }
  
  const maxDrawdown = Math.max(...equityCurve.map(p => p.drawdown));
  const totalReturnPercent = ((balance - startBalance) / startBalance) * 100;
  
  // Generate daily P&L data (last 45 days)
  const dailyPnl = [];
  let runningPnl = 0;
  
  for (let i = 44; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Some days have no trades
    let dayPnl = 0;
    if (Math.random() < 0.4) { // 40% chance of trading
      const isWin = Math.random() < 0.609;
      dayPnl = isWin ? 
        (Math.random() * 800 + 200) : 
        -(Math.random() * 400 + 100);
    }
    
    runningPnl += dayPnl;
    
    dailyPnl.push({
      date: date.toISOString().split('T')[0],
      pnl: Math.round(dayPnl * 100) / 100,
      cumulativePnl: Math.round(runningPnl * 100) / 100,
    });
  }
  
  // Generate trade distribution data
  const tradeDistribution = [
    { range: '$0-$500', count: 8 },
    { range: '$500-$1000', count: 7 },
    { range: '$1000-$1500', count: 4 },
    { range: '$1500+', count: 3 },
    { range: 'Losses', count: 9 },
  ];
  
  // Generate win/loss analysis
  const winLossAnalysis = [
    { type: 'Wins', count: winningTrades, averageAmount: averageWin },
    { type: 'Losses', count: losingTrades, averageAmount: -averageLoss },
  ];
  
  // Generate time analysis (trading hours)
  const timeAnalysis = Array.from({ length: 24 }, (_, hour) => {
    let trades = 0;
    let avgPnl = 0;
    
    // Market hours have more activity
    if (hour >= 9 && hour <= 16) {
      trades = Math.floor(Math.random() * 3) + 1;
      avgPnl = (Math.random() - 0.4) * 300; // Slight positive bias
    } else if (hour >= 7 && hour <= 8) {
      trades = Math.floor(Math.random() * 2);
      avgPnl = (Math.random() - 0.5) * 200;
    }
    
    return {
      hour,
      trades,
      avgPnl: Math.round(avgPnl * 100) / 100,
    };
  });
  
  // Generate drawdown data
  const drawdownData = dailyPnl.map(point => {
    const maxPnlSoFar = Math.max(...dailyPnl.slice(0, dailyPnl.indexOf(point) + 1).map(p => p.cumulativePnl));
    const drawdown = maxPnlSoFar > point.cumulativePnl ? 
      ((maxPnlSoFar - point.cumulativePnl) / (startBalance + maxPnlSoFar)) * 100 : 0;
    
    return {
      date: point.date,
      drawdown: Math.round(drawdown * 100) / 100,
    };
  });
  
  // Generate risk/reward distribution
  const riskRewardData = [
    { rMultiple: '-2R+', count: 2 },
    { rMultiple: '-1R to -2R', count: 4 },
    { rMultiple: '-0.5R to -1R', count: 3 },
    { rMultiple: '0R to 0.5R', count: 1 },
    { rMultiple: '0.5R to 1R', count: 3 },
    { rMultiple: '1R to 2R', count: 6 },
    { rMultiple: '2R to 3R', count: 4 },
    { rMultiple: '3R+', count: 2 },
  ];
  
  return {
    // Core metrics
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalPnl: Math.round(totalPnl * 100) / 100,
    totalPnlPercent: Math.round(totalReturnPercent * 100) / 100,
    averageWin: Math.round(averageWin * 100) / 100,
    averageLoss: Math.round(-averageLoss * 100) / 100,
    largestWin: Math.max(...winners),
    largestLoss: Math.min(...losers),
    profitFactor: Math.round(profitFactor * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    averageRMultiple: 1.85,
    currentStreak: 2,
    longestWinStreak: 5,
    longestLossStreak: 3,
    averageHoldingPeriod: 380,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    
    // Chart data
    dailyPnl,
    equityCurve,
    monthlyPnl: [
      { month: '2024-07', pnl: 2450.80, trades: 8 },
      { month: '2024-08', pnl: 3890.45, trades: 15 },
      { month: '2024-09', pnl: -340.70, trades: 2 },
    ],
    tradeDistribution,
    winLossAnalysis,
    timeAnalysis,
    drawdownData,
    riskRewardData,
    setupAnalysis: [
      {
        setupId: 'breakout',
        setupName: 'Breakout Strategy',
        trades: 8,
        wins: 6,
        pnl: 3420.80,
        winRate: 75.0,
        averageRMultiple: 2.1,
        expectancy: 427.60,
      },
      {
        setupId: 'momentum',
        setupName: 'Momentum Play',
        trades: 6,
        wins: 4,
        pnl: 1890.40,
        winRate: 66.7,
        averageRMultiple: 1.8,
        expectancy: 315.07,
      },
      {
        setupId: 'mean-reversion',
        setupName: 'Mean Reversion',
        trades: 5,
        wins: 2,
        pnl: -680.30,
        winRate: 40.0,
        averageRMultiple: 0.6,
        expectancy: -136.06,
      },
      {
        setupId: 'support-bounce',
        setupName: 'Support Bounce',
        trades: 4,
        wins: 2,
        pnl: 1370.25,
        winRate: 50.0,
        averageRMultiple: 1.9,
        expectancy: 342.56,
      },
    ],
    timeAnalysis: {
      // Best performance during market open and close
      hourly: Array.from({ length: 24 }, (_, hour) => {
        let basePerformance = 0;
        // Market open (9:30-11:00 AM EST)
        if (hour >= 9 && hour <= 11) basePerformance = 200 + Math.random() * 300;
        // Market close (3:00-4:00 PM EST)  
        else if (hour >= 15 && hour <= 16) basePerformance = 150 + Math.random() * 250;
        // Regular trading hours
        else if (hour >= 9 && hour <= 16) basePerformance = 50 + Math.random() * 150;
        // After hours
        else basePerformance = Math.random() * 50;
        
        const trades = hour >= 9 && hour <= 16 ? Math.floor(Math.random() * 4) + 1 : 0;
        const pnl = basePerformance - Math.random() * 100;
        
        return {
          hour,
          trades,
          pnl: Math.round(pnl * 100) / 100,
          wins: Math.floor(trades * 0.6),
          winRate: trades > 0 ? 60 + (Math.random() - 0.5) * 30 : 0,
        };
      }),
      daily: [
        { day: 0, dayName: 'Sunday', trades: 0, pnl: 0, wins: 0, winRate: 0 },
        { day: 1, dayName: 'Monday', trades: 6, pnl: 890.50, wins: 4, winRate: 66.7 },
        { day: 2, dayName: 'Tuesday', trades: 5, pnl: 1240.20, wins: 3, winRate: 60.0 },
        { day: 3, dayName: 'Wednesday', trades: 4, pnl: -285.30, wins: 2, winRate: 50.0 },
        { day: 4, dayName: 'Thursday', trades: 5, pnl: 1580.90, wins: 3, winRate: 60.0 },
        { day: 5, dayName: 'Friday', trades: 3, pnl: 2490.80, wins: 2, winRate: 66.7 },
        { day: 6, dayName: 'Saturday', trades: 0, pnl: 0, wins: 0, winRate: 0 },
      ],
      monthly: [
        { month: 7, monthName: 'July', year: 2024, trades: 8, pnl: 2450.80, winRate: 62.5 },
        { month: 8, monthName: 'August', year: 2024, trades: 15, pnl: 3890.45, winRate: 60.0 },
        { month: 9, monthName: 'September', year: 2024, trades: 2, pnl: -340.70, winRate: 50.0 },
      ],
    },
  };
}