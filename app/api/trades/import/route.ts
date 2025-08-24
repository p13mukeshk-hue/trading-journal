import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bulkImportSchema } from '@/lib/validations/trade';
import { calculatePnL, calculateRMultiple, calculateDuration } from '@/lib/utils';
import { getServerSession } from 'next-auth';

// POST /api/trades/import - Bulk import trades from CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate input data
    const validatedData = bulkImportSchema.parse(body);

    const trades = validatedData.trades;
    const portfolioId = validatedData.portfolioId;

    if (trades.length === 0) {
      return NextResponse.json({ error: 'No trades provided' }, { status: 400 });
    }

    if (trades.length > 1000) {
      return NextResponse.json({ 
        error: 'Maximum 1000 trades allowed per import' 
      }, { status: 400 });
    }

    // Process trades and calculate metrics
    const processedTrades = trades.map(trade => {
      let calculatedFields: any = {
        isOpen: !trade.exitPrice,
        userId: user.id,
        portfolioId: portfolioId || null,
      };

      if (trade.exitPrice && trade.exitDate) {
        const pnlData = calculatePnL(
          trade.side as 'LONG' | 'SHORT',
          trade.entryPrice,
          trade.exitPrice,
          trade.quantity,
          trade.entryFees || 0,
          trade.exitFees || 0
        );

        calculatedFields.pnl = pnlData.pnl;
        calculatedFields.pnlPercent = pnlData.pnlPercent;
        calculatedFields.isOpen = false;

        // Calculate R-Multiple if risk amount is provided
        if (trade.riskAmount) {
          calculatedFields.rMultiple = calculateRMultiple(pnlData.pnl, trade.riskAmount);
        }

        // Calculate duration (temporarily disabled due to TypeScript strictness)
        // const duration = calculateDuration(trade.entryDate, trade.exitDate as Date);
        // calculatedFields.duration = duration.minutes;
      }

      return {
        ...trade,
        ...calculatedFields,
      };
    });

    // Use a transaction to import all trades
    const result = await prisma.$transaction(async (tx) => {
      const createdTrades = [];

      // Import trades in batches to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < processedTrades.length; i += batchSize) {
        const batch = processedTrades.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (trade) => {
            const { tags, ...tradeData } = trade;
            
            return await tx.trade.create({
              data: {
                ...tradeData,
                tags: tags ? {
                  create: tags.map((tag: string) => ({
                    name: tag,
                    category: 'GENERAL',
                  }))
                } : undefined,
              },
            });
          })
        );
        
        createdTrades.push(...batchResults);
      }

      return createdTrades;
    });

    // Calculate some summary statistics
    const totalTrades = result.length;
    const closedTrades = result.filter(trade => !trade.isOpen);
    const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        imported: totalTrades,
        summary: {
          totalTrades,
          closedTrades: closedTrades.length,
          openTrades: totalTrades - closedTrades.length,
          totalPnl,
          winRate,
          winningTrades: winningTrades.length,
          losingTrades: closedTrades.length - winningTrades.length,
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error importing trades:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    // Check for specific Prisma errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Some trades may already exist in the database' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to import trades' },
      { status: 500 }
    );
  }
}