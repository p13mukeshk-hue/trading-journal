import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// POST /api/reports/performance - Generate performance report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    
    const { format = 'pdf', dateRange, includeCharts = true } = body;

    // Get analytics data (using same demo data for now)
    const analytics = await generateReportData(dateRange);
    
    if (format === 'pdf') {
      const pdf = await generatePerformancePDF(analytics, { includeCharts });
      
      // Convert PDF to base64 for response
      const pdfBuffer = pdf.output('arraybuffer');
      const base64 = Buffer.from(pdfBuffer).toString('base64');
      
      return NextResponse.json({
        success: true,
        data: {
          filename: `performance-report-${new Date().toISOString().split('T')[0]}.pdf`,
          content: base64,
          contentType: 'application/pdf',
        },
      });
    }
    
    if (format === 'csv') {
      const csv = generatePerformanceCSV(analytics);
      
      return NextResponse.json({
        success: true,
        data: {
          filename: `performance-report-${new Date().toISOString().split('T')[0]}.csv`,
          content: Buffer.from(csv).toString('base64'),
          contentType: 'text/csv',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateReportData(dateRange?: { start: string; end: string }) {
  // For demo purposes, return the same data as analytics
  // In production, this would query the database with date filters
  return {
    totalTrades: 25,
    winningTrades: 14,
    losingTrades: 9,
    winRate: 60.87,
    totalPnl: 6000.25,
    totalPnlPercent: 24.01,
    averageWin: 815.91,
    averageLoss: -395.40,
    largestWin: 2150.30,
    largestLoss: -890.60,
    profitFactor: 2.35,
    expectancy: 261.00,
    averageRMultiple: 1.85,
    maxDrawdown: -8.45,
    startingBalance: 25000,
    currentBalance: 31000.25,
    monthlyPnl: [
      { month: '2024-07', pnl: 2450.80, trades: 8 },
      { month: '2024-08', pnl: 3890.45, trades: 15 },
      { month: '2024-09', pnl: -340.70, trades: 2 },
    ],
    setupAnalysis: [
      {
        setupName: 'Breakout Strategy',
        trades: 8,
        wins: 6,
        pnl: 3420.80,
        winRate: 75.0,
        expectancy: 427.60,
      },
      {
        setupName: 'Momentum Play',
        trades: 6,
        wins: 4,
        pnl: 1890.40,
        winRate: 66.7,
        expectancy: 315.07,
      },
      {
        setupName: 'Mean Reversion',
        trades: 5,
        wins: 2,
        pnl: -680.30,
        winRate: 40.0,
        expectancy: -136.06,
      },
    ],
    recentTrades: [
      { symbol: 'AAPL', side: 'LONG', entryDate: '2024-08-19', pnl: 750.50 },
      { symbol: 'TSLA', side: 'SHORT', entryDate: '2024-08-18', pnl: -285.60 },
      { symbol: 'NVDA', side: 'LONG', entryDate: '2024-08-17', pnl: 1240.80 },
      { symbol: 'MSFT', side: 'LONG', entryDate: '2024-08-16', pnl: 445.60 },
      { symbol: 'AMZN', side: 'LONG', entryDate: '2024-08-15', pnl: -520.40 },
    ],
  };
}

async function generatePerformancePDF(data: any, options: { includeCharts?: boolean }) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  
  // Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Trading Performance Report', margin, 25);
  
  // Date range
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 35);
  
  // Performance Summary Box
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, 45, pageWidth - 2 * margin, 60);
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Summary', margin + 5, 55);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  // Left column
  pdf.text(`Total Trades: ${data.totalTrades}`, margin + 5, 65);
  pdf.text(`Win Rate: ${data.winRate.toFixed(2)}%`, margin + 5, 72);
  pdf.text(`Profit Factor: ${data.profitFactor}`, margin + 5, 79);
  pdf.text(`Expectancy: $${data.expectancy.toFixed(2)}`, margin + 5, 86);
  
  // Right column
  const midPoint = pageWidth / 2;
  pdf.text(`Total P&L: $${data.totalPnl.toFixed(2)}`, midPoint, 65);
  pdf.text(`Return: ${data.totalPnlPercent.toFixed(2)}%`, midPoint, 72);
  pdf.text(`Max Drawdown: ${data.maxDrawdown.toFixed(2)}%`, midPoint, 79);
  pdf.text(`Average R-Multiple: ${data.averageRMultiple}`, midPoint, 86);
  
  // Win/Loss Analysis
  pdf.text(`Winning Trades: ${data.winningTrades}`, margin + 5, 93);
  pdf.text(`Losing Trades: ${data.losingTrades}`, margin + 5, 100);
  
  pdf.text(`Average Win: $${data.averageWin.toFixed(2)}`, midPoint, 93);
  pdf.text(`Average Loss: $${data.averageLoss.toFixed(2)}`, midPoint, 100);
  
  // Monthly Performance Table
  let yPos = 120;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Monthly Performance', margin, yPos);
  
  const monthlyData = data.monthlyPnl.map((month: any) => [
    month.month,
    month.trades.toString(),
    `$${month.pnl.toFixed(2)}`,
    month.pnl > 0 ? 'Profit' : 'Loss',
  ]);
  
  autoTable(pdf, {
    startY: yPos + 5,
    head: [['Month', 'Trades', 'P&L', 'Result']],
    body: monthlyData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
  });
  
  // Setup Analysis Table
  yPos = pdf.lastAutoTable.finalY + 20;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Strategy Performance', margin, yPos);
  
  const setupData = data.setupAnalysis.map((setup: any) => [
    setup.setupName,
    setup.trades.toString(),
    `${setup.winRate.toFixed(1)}%`,
    `$${setup.pnl.toFixed(2)}`,
    `$${setup.expectancy.toFixed(2)}`,
  ]);
  
  autoTable(pdf, {
    startY: yPos + 5,
    head: [['Strategy', 'Trades', 'Win Rate', 'P&L', 'Expectancy']],
    body: setupData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
  });
  
  // Recent Trades Table
  yPos = pdf.lastAutoTable.finalY + 20;
  if (yPos > 250) {
    pdf.addPage();
    yPos = 30;
  }
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Recent Trades', margin, yPos);
  
  const tradesData = data.recentTrades.map((trade: any) => [
    trade.symbol,
    trade.side,
    trade.entryDate,
    `$${trade.pnl.toFixed(2)}`,
    trade.pnl > 0 ? 'Win' : 'Loss',
  ]);
  
  autoTable(pdf, {
    startY: yPos + 5,
    head: [['Symbol', 'Side', 'Date', 'P&L', 'Result']],
    body: tradesData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
  });
  
  // Footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pdf.internal.pageSize.getHeight() - 10);
    pdf.text('Generated by Trading Journal Pro', margin, pdf.internal.pageSize.getHeight() - 10);
  }
  
  return pdf;
}

function generatePerformanceCSV(data: any): string {
  const rows = [
    ['Trading Performance Report'],
    [`Generated: ${new Date().toISOString()}`],
    [],
    ['Performance Summary'],
    ['Metric', 'Value'],
    ['Total Trades', data.totalTrades],
    ['Win Rate', `${data.winRate.toFixed(2)}%`],
    ['Total P&L', `$${data.totalPnl.toFixed(2)}`],
    ['Return %', `${data.totalPnlPercent.toFixed(2)}%`],
    ['Profit Factor', data.profitFactor],
    ['Expectancy', `$${data.expectancy.toFixed(2)}`],
    ['Max Drawdown', `${data.maxDrawdown.toFixed(2)}%`],
    ['Average R-Multiple', data.averageRMultiple],
    [],
    ['Monthly Performance'],
    ['Month', 'Trades', 'P&L'],
    ...data.monthlyPnl.map((month: any) => [month.month, month.trades, `$${month.pnl.toFixed(2)}`]),
    [],
    ['Strategy Performance'],
    ['Strategy', 'Trades', 'Win Rate', 'P&L', 'Expectancy'],
    ...data.setupAnalysis.map((setup: any) => [
      setup.setupName,
      setup.trades,
      `${setup.winRate.toFixed(1)}%`,
      `$${setup.pnl.toFixed(2)}`,
      `$${setup.expectancy.toFixed(2)}`,
    ]),
  ];
  
  return rows.map(row => row.join(',')).join('\n');
}