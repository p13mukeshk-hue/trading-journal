import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/market-data';

// GET /api/market/chart/[symbol] - Get chart data for a symbol
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const { searchParams } = new URL(request.url);
    
    const timeframe = searchParams.get('timeframe') || 'daily';
    const period = searchParams.get('period') || '1y';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Validate timeframe
    const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', 'daily', 'weekly', 'monthly'];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { error: `Invalid timeframe. Valid options: ${validTimeframes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if market data service is available
    if (!marketDataService.isAvailable()) {
      return NextResponse.json(
        { error: 'Market data service is not configured. Please set up API keys.' },
        { status: 503 }
      );
    }

    // Get chart data from market data service
    const chartData = await marketDataService.getChart(symbol.toUpperCase(), timeframe);

    // Filter data based on period
    let filteredData = chartData;
    const now = new Date();
    
    switch (period) {
      case '1d':
        filteredData = chartData.filter(point => 
          (now.getTime() - point.timestamp.getTime()) <= 24 * 60 * 60 * 1000
        );
        break;
      case '1w':
        filteredData = chartData.filter(point => 
          (now.getTime() - point.timestamp.getTime()) <= 7 * 24 * 60 * 60 * 1000
        );
        break;
      case '1m':
        filteredData = chartData.filter(point => 
          (now.getTime() - point.timestamp.getTime()) <= 30 * 24 * 60 * 60 * 1000
        );
        break;
      case '3m':
        filteredData = chartData.filter(point => 
          (now.getTime() - point.timestamp.getTime()) <= 90 * 24 * 60 * 60 * 1000
        );
        break;
      case '6m':
        filteredData = chartData.filter(point => 
          (now.getTime() - point.timestamp.getTime()) <= 180 * 24 * 60 * 60 * 1000
        );
        break;
      case '1y':
        filteredData = chartData.filter(point => 
          (now.getTime() - point.timestamp.getTime()) <= 365 * 24 * 60 * 60 * 1000
        );
        break;
      case '2y':
        filteredData = chartData.filter(point => 
          (now.getTime() - point.timestamp.getTime()) <= 2 * 365 * 24 * 60 * 60 * 1000
        );
        break;
      case '5y':
        filteredData = chartData.filter(point => 
          (now.getTime() - point.timestamp.getTime()) <= 5 * 365 * 24 * 60 * 60 * 1000
        );
        break;
      // 'all' or 'max' returns all available data
    }

    // Sort by timestamp
    filteredData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate some basic statistics
    const prices = filteredData.map(point => point.close);
    const volumes = filteredData.map(point => point.volume);
    
    const stats = {
      dataPoints: filteredData.length,
      periodHigh: Math.max(...prices),
      periodLow: Math.min(...prices),
      averageVolume: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length,
      priceChange: filteredData.length > 1 ? 
        filteredData[filteredData.length - 1].close - filteredData[0].close : 0,
      priceChangePercent: filteredData.length > 1 ? 
        ((filteredData[filteredData.length - 1].close - filteredData[0].close) / filteredData[0].close) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        timeframe,
        period,
        chart: filteredData,
        stats,
      },
    });

  } catch (error) {
    console.error(`Error fetching chart data for ${params.symbol}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('invalid symbol')) {
        return NextResponse.json(
          { error: `Symbol ${params.symbol} not found` },
          { status: 404 }
        );
      }
      
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}