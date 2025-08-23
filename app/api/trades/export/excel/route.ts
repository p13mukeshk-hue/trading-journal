import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as XLSX from 'xlsx';

// GET /api/trades/export/excel - Export all trades to Excel format
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // For demo purposes, generate comprehensive trade data
    // In production, this would fetch from the database
    const trades = generateComprehensiveTradeData();
    
    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Complete Trade Data
    const tradeData = trades.map(trade => ({
      'Trade ID': trade.id,
      'Symbol': trade.symbol,
      'Asset Class': trade.assetClass,
      'Side': trade.side,
      'Entry Date': formatDate(trade.entryDate),
      'Entry Time': formatTime(trade.entryDate),
      'Entry Price': trade.entryPrice,
      'Quantity': trade.quantity,
      'Position Size': trade.entryPrice * trade.quantity,
      'Exit Date': trade.exitDate ? formatDate(trade.exitDate) : '',
      'Exit Time': trade.exitDate ? formatTime(trade.exitDate) : '',
      'Exit Price': trade.exitPrice || '',
      'Stop Loss': trade.stopLoss || '',
      'Take Profit': trade.takeProfit || '',
      'Entry Fees': trade.entryFees || 0,
      'Exit Fees': trade.exitFees || 0,
      'Total Fees': (trade.entryFees || 0) + (trade.exitFees || 0),
      'Gross P&L': trade.grossPnl || '',
      'Net P&L': trade.pnl || '',
      'P&L %': trade.pnlPercent || '',
      'R-Multiple': trade.rMultiple || '',
      'Risk Amount': trade.riskAmount || '',
      'Risk %': trade.riskPercent || '',
      'Reward Amount': trade.rewardAmount || '',
      'Risk/Reward Ratio': trade.riskRewardRatio || '',
      'Duration (Minutes)': trade.duration || '',
      'Duration (Hours)': trade.duration ? (trade.duration / 60).toFixed(2) : '',
      'Trade Status': trade.isOpen ? 'Open' : 'Closed',
      'Strategy/Setup': trade.setup || '',
      'Market Condition': trade.marketCondition || '',
      'Volatility': trade.volatility || '',
      'Pre-Trade Emotion': trade.preTradeEmotion || '',
      'Post-Trade Emotion': trade.postTradeEmotion || '',
      'Confidence Level': trade.confidenceLevel || '',
      'Trade Quality': trade.tradeQuality || '',
      'Mistakes Made': trade.mistakes || '',
      'Lessons Learned': trade.lessonsLearned || '',
      'Notes': trade.notes || '',
      'Tags': Array.isArray(trade.tags) ? trade.tags.join(', ') : (trade.tags || ''),
      'Portfolio': trade.portfolio || '',
      'Broker': trade.broker || '',
      'Execution Venue': trade.executionVenue || '',
      'Slippage': trade.slippage || '',
      'Commission': trade.commission || '',
      'Swap/Overnight': trade.swapFee || '',
      'Currency': trade.currency || 'USD',
      'Created At': formatDateTime(trade.createdAt),
      'Updated At': formatDateTime(trade.updatedAt),
    }));
    
    const tradeSheet = XLSX.utils.json_to_sheet(tradeData);
    
    // Auto-size columns
    const tradeColWidths = Object.keys(tradeData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    tradeSheet['!cols'] = tradeColWidths;
    
    XLSX.utils.book_append_sheet(workbook, tradeSheet, 'All Trades');
    
    // Sheet 2: Performance Summary
    const summary = generatePerformanceSummary(trades);
    const summaryData = [
      { Metric: 'Total Trades', Value: summary.totalTrades },
      { Metric: 'Winning Trades', Value: summary.winningTrades },
      { Metric: 'Losing Trades', Value: summary.losingTrades },
      { Metric: 'Win Rate %', Value: summary.winRate.toFixed(2) },
      { Metric: 'Total P&L', Value: summary.totalPnl.toFixed(2) },
      { Metric: 'Total P&L %', Value: summary.totalPnlPercent.toFixed(2) },
      { Metric: 'Average Win', Value: summary.averageWin.toFixed(2) },
      { Metric: 'Average Loss', Value: summary.averageLoss.toFixed(2) },
      { Metric: 'Largest Win', Value: summary.largestWin.toFixed(2) },
      { Metric: 'Largest Loss', Value: summary.largestLoss.toFixed(2) },
      { Metric: 'Profit Factor', Value: summary.profitFactor.toFixed(2) },
      { Metric: 'Expectancy', Value: summary.expectancy.toFixed(2) },
      { Metric: 'Average R-Multiple', Value: summary.averageRMultiple.toFixed(2) },
      { Metric: 'Max Drawdown %', Value: summary.maxDrawdown.toFixed(2) },
      { Metric: 'Average Holding Period (Hours)', Value: summary.averageHoldingPeriod.toFixed(2) },
      { Metric: 'Total Fees Paid', Value: summary.totalFees.toFixed(2) },
      { Metric: 'Best Performing Symbol', Value: summary.bestSymbol },
      { Metric: 'Most Traded Symbol', Value: summary.mostTradedSymbol },
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Performance Summary');
    
    // Sheet 3: Monthly Breakdown
    const monthlyData = generateMonthlyBreakdown(trades);
    const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
    monthlySheet['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, 
      { wch: 10 }, { wch: 12 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Breakdown');
    
    // Sheet 4: Strategy Analysis
    const strategyData = generateStrategyAnalysis(trades);
    const strategySheet = XLSX.utils.json_to_sheet(strategyData);
    strategySheet['!cols'] = [
      { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, 
      { wch: 10 }, { wch: 12 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, strategySheet, 'Strategy Analysis');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });
    
    // Create filename with current date
    const filename = `trading-journal-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Return file as download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Error generating Excel export:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel export' },
      { status: 500 }
    );
  }
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US');
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US');
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US');
}

function generateComprehensiveTradeData() {
  const symbols = ['BTC', 'AAPL', 'NIFTY'];
  const setups = ['Breakout Strategy', 'Mean Reversion', 'Momentum Play', 'Support Bounce', 'Resistance Break'];
  const marketConditions = ['Trending Up', 'Trending Down', 'Sideways', 'Volatile', 'Low Volume'];
  const emotions = ['Confident', 'Nervous', 'Excited', 'Calm', 'Uncertain'];
  const trades = [];
  
  for (let i = 1; i <= 25; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const isOpen = i <= 2; // First 2 trades are open
    const entryDate = new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000);
    const exitDate = isOpen ? null : new Date(entryDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000);
    
    // Generate realistic prices
    let basePrice = 100;
    if (symbol === 'BTC') basePrice = 45000;
    if (symbol === 'AAPL') basePrice = 180;
    if (symbol === 'NIFTY') basePrice = 19500;
    
    const entryPrice = basePrice + (Math.random() - 0.5) * (basePrice * 0.1);
    const quantity = symbol === 'BTC' ? Math.random() * 2 + 0.1 : 
                    symbol === 'NIFTY' ? Math.floor(Math.random() * 50) + 25 :
                    Math.floor(Math.random() * 200) + 10;
    
    const isWinner = Math.random() < 0.6; // 60% win rate
    const side = Math.random() < 0.5 ? 'LONG' : 'SHORT';
    
    let exitPrice, pnl, pnlPercent, grossPnl;
    if (!isOpen) {
      const priceChange = isWinner ? 
        (Math.random() * 0.08 + 0.005) : 
        -(Math.random() * 0.06 + 0.01);
      
      exitPrice = side === 'LONG' ? 
        entryPrice * (1 + priceChange) : 
        entryPrice * (1 - priceChange);
      
      grossPnl = side === 'LONG' ? 
        (exitPrice - entryPrice) * quantity :
        (entryPrice - exitPrice) * quantity;
      
      const fees = Math.random() * 20 + 5;
      pnl = grossPnl - fees;
      pnlPercent = (pnl / (entryPrice * quantity)) * 100;
    }
    
    const riskAmount = (entryPrice * quantity) * (0.01 + Math.random() * 0.02); // 1-3% risk
    const stopLoss = side === 'LONG' ? 
      entryPrice * (1 - (0.01 + Math.random() * 0.02)) :
      entryPrice * (1 + (0.01 + Math.random() * 0.02));
    
    const takeProfit = side === 'LONG' ? 
      entryPrice * (1 + (0.02 + Math.random() * 0.06)) :
      entryPrice * (1 - (0.02 + Math.random() * 0.06));
    
    trades.push({
      id: `T${i.toString().padStart(3, '0')}`,
      symbol,
      assetClass: symbol === 'BTC' ? 'CRYPTO' : symbol === 'NIFTY' ? 'INDEX' : 'STOCK',
      side,
      entryDate,
      exitDate,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: exitPrice ? Math.round(exitPrice * 100) / 100 : null,
      quantity: symbol === 'BTC' ? Math.round(quantity * 10000) / 10000 : quantity,
      stopLoss: Math.round(stopLoss * 100) / 100,
      takeProfit: Math.round(takeProfit * 100) / 100,
      entryFees: Math.random() * 10 + 2,
      exitFees: isOpen ? null : Math.random() * 10 + 2,
      grossPnl: grossPnl ? Math.round(grossPnl * 100) / 100 : null,
      pnl: pnl ? Math.round(pnl * 100) / 100 : null,
      pnlPercent: pnlPercent ? Math.round(pnlPercent * 100) / 100 : null,
      rMultiple: pnl ? Math.round((pnl / riskAmount) * 100) / 100 : null,
      riskAmount: Math.round(riskAmount * 100) / 100,
      riskPercent: Math.round(((riskAmount / (entryPrice * quantity)) * 100) * 100) / 100,
      rewardAmount: takeProfit ? Math.abs((takeProfit - entryPrice) * quantity) : null,
      riskRewardRatio: takeProfit ? Math.round((Math.abs(takeProfit - entryPrice) / Math.abs(stopLoss - entryPrice)) * 100) / 100 : null,
      duration: exitDate ? Math.round((exitDate.getTime() - entryDate.getTime()) / (1000 * 60)) : null,
      isOpen,
      setup: setups[Math.floor(Math.random() * setups.length)],
      marketCondition: marketConditions[Math.floor(Math.random() * marketConditions.length)],
      volatility: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      preTradeEmotion: emotions[Math.floor(Math.random() * emotions.length)],
      postTradeEmotion: isOpen ? null : emotions[Math.floor(Math.random() * emotions.length)],
      confidenceLevel: Math.floor(Math.random() * 5) + 1, // 1-5 scale
      tradeQuality: isOpen ? null : ['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)],
      mistakes: isOpen || isWinner ? null : ['Moved stop loss', 'Held too long', 'Poor timing', 'FOMO entry'][Math.floor(Math.random() * 4)],
      lessonsLearned: isOpen ? null : 'Trade analysis and key takeaways',
      notes: `Trade notes for ${symbol} position`,
      tags: Math.random() < 0.5 ? ['Analysis', 'Breakout'] : ['Swing', 'Technical'],
      portfolio: 'Main Portfolio',
      broker: 'Demo Broker',
      executionVenue: 'Electronic',
      slippage: Math.random() * 0.1,
      commission: Math.random() * 5 + 1,
      swapFee: isOpen ? null : Math.random() * 2,
      currency: 'USD',
      createdAt: entryDate,
      updatedAt: exitDate || entryDate,
    });
  }
  
  return trades;
}

function generatePerformanceSummary(trades: any[]) {
  const closedTrades = trades.filter(t => !t.isOpen);
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
  
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
  const totalFees = trades.reduce((sum, t) => sum + (t.entryFees || 0) + (t.exitFees || 0), 0);
  
  // Group by symbol for analysis
  const symbolStats = trades.reduce((acc: any, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { pnl: 0, trades: 0 };
    }
    acc[trade.symbol].pnl += trade.pnl || 0;
    acc[trade.symbol].trades += 1;
    return acc;
  }, {});
  
  const bestSymbol = Object.keys(symbolStats).reduce((a, b) => 
    symbolStats[a].pnl > symbolStats[b].pnl ? a : b
  );
  
  const mostTradedSymbol = Object.keys(symbolStats).reduce((a, b) => 
    symbolStats[a].trades > symbolStats[b].trades ? a : b
  );
  
  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: (winningTrades.length / closedTrades.length) * 100,
    totalPnl,
    totalPnlPercent: (totalPnl / 25000) * 100, // Assuming 25k starting capital
    averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
    averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
    largestWin: Math.max(...closedTrades.map(t => t.pnl || 0)),
    largestLoss: Math.min(...closedTrades.map(t => t.pnl || 0)),
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0,
    expectancy: closedTrades.length > 0 ? totalPnl / closedTrades.length : 0,
    averageRMultiple: closedTrades.filter(t => t.rMultiple).reduce((sum, t) => sum + t.rMultiple, 0) / closedTrades.filter(t => t.rMultiple).length || 0,
    maxDrawdown: 8.5, // Placeholder
    averageHoldingPeriod: closedTrades.filter(t => t.duration).reduce((sum, t) => sum + t.duration, 0) / closedTrades.filter(t => t.duration).length / 60 || 0,
    totalFees,
    bestSymbol,
    mostTradedSymbol,
  };
}

function generateMonthlyBreakdown(trades: any[]) {
  const monthly = trades.reduce((acc: any, trade) => {
    const month = trade.entryDate.toISOString().substring(0, 7);
    if (!acc[month]) {
      acc[month] = { trades: 0, wins: 0, pnl: 0, fees: 0 };
    }
    acc[month].trades += 1;
    if ((trade.pnl || 0) > 0) acc[month].wins += 1;
    acc[month].pnl += trade.pnl || 0;
    acc[month].fees += (trade.entryFees || 0) + (trade.exitFees || 0);
    return acc;
  }, {});
  
  return Object.keys(monthly).map(month => ({
    Month: month,
    Trades: monthly[month].trades,
    'Win Rate %': ((monthly[month].wins / monthly[month].trades) * 100).toFixed(2),
    'P&L': monthly[month].pnl.toFixed(2),
    'Avg P&L': (monthly[month].pnl / monthly[month].trades).toFixed(2),
    'Total Fees': monthly[month].fees.toFixed(2),
    'Net Return %': ((monthly[month].pnl / 25000) * 100).toFixed(2),
  }));
}

function generateStrategyAnalysis(trades: any[]) {
  const strategies = trades.reduce((acc: any, trade) => {
    const strategy = trade.setup;
    if (!acc[strategy]) {
      acc[strategy] = { trades: 0, wins: 0, pnl: 0, rMultiples: [] };
    }
    acc[strategy].trades += 1;
    if ((trade.pnl || 0) > 0) acc[strategy].wins += 1;
    acc[strategy].pnl += trade.pnl || 0;
    if (trade.rMultiple) acc[strategy].rMultiples.push(trade.rMultiple);
    return acc;
  }, {});
  
  return Object.keys(strategies).map(strategy => ({
    Strategy: strategy,
    Trades: strategies[strategy].trades,
    'Win Rate %': ((strategies[strategy].wins / strategies[strategy].trades) * 100).toFixed(2),
    'Total P&L': strategies[strategy].pnl.toFixed(2),
    'Avg P&L': (strategies[strategy].pnl / strategies[strategy].trades).toFixed(2),
    'Expectancy': (strategies[strategy].pnl / strategies[strategy].trades).toFixed(2),
    'Avg R-Multiple': strategies[strategy].rMultiples.length > 0 ? 
      (strategies[strategy].rMultiples.reduce((a: number, b: number) => a + b, 0) / strategies[strategy].rMultiples.length).toFixed(2) : 'N/A',
  }));
}