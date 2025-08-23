import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/market-data';

// GET /api/market/quote/[symbol] - Get real-time quote for a symbol
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
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

    // Get quote from market data service
    const quote = await marketDataService.getQuote(symbol.toUpperCase());

    return NextResponse.json({
      success: true,
      data: quote,
    });

  } catch (error) {
    console.error(`Error fetching quote for ${params.symbol}:`, error);
    
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
      { error: 'Failed to fetch quote data' },
      { status: 500 }
    );
  }
}