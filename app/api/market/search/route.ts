import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/market-data';

// GET /api/market/search - Search for symbols
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (query.length < 1) {
      return NextResponse.json(
        { error: 'Query must be at least 1 character long' },
        { status: 400 }
      );
    }

    if (query.length > 50) {
      return NextResponse.json(
        { error: 'Query must be less than 50 characters' },
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

    // Search for symbols
    const results = await marketDataService.searchSymbols(query.trim());

    // Filter and enhance results
    const filteredResults = results
      .filter(result => result.symbol && result.name)
      .slice(0, 20) // Limit to 20 results
      .map(result => ({
        symbol: result.symbol.toUpperCase(),
        name: result.name,
        type: result.type || 'Unknown',
        displayName: `${result.symbol.toUpperCase()} - ${result.name}`,
      }));

    return NextResponse.json({
      success: true,
      data: {
        query: query.trim(),
        results: filteredResults,
        count: filteredResults.length,
      },
    });

  } catch (error) {
    console.error('Error searching symbols:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to search symbols' },
      { status: 500 }
    );
  }
}