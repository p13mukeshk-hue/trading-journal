import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tradeUpdateSchema } from '@/lib/validations/trade';
import { calculatePnL, calculateRMultiple, calculateDuration } from '@/lib/utils';
import { getServerSession } from 'next-auth';

// GET /api/trades/[id] - Get a single trade
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const trade = await prisma.trade.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        tags: true,
        screenshots: true,
        setup: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json({ data: trade });
  } catch (error) {
    console.error('Error fetching trade:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade' },
      { status: 500 }
    );
  }
}

// PUT /api/trades/[id] - Update a trade
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingTrade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate input data
    const validatedData = tradeUpdateSchema.parse({ ...body, id: params.id });

    // Calculate P&L and other metrics if trade is closed
    let calculatedFields: any = {};

    if (validatedData.exitPrice && validatedData.exitDate && validatedData.entryPrice && validatedData.quantity && validatedData.side) {
      const pnlData = calculatePnL(
        validatedData.side as 'LONG' | 'SHORT',
        validatedData.entryPrice,
        validatedData.exitPrice,
        validatedData.quantity,
        validatedData.entryFees || 0,
        validatedData.exitFees || 0
      );

      calculatedFields.pnl = pnlData.pnl;
      calculatedFields.pnlPercent = pnlData.pnlPercent;
      calculatedFields.isOpen = false;

      // Calculate R-Multiple if risk amount is provided
      if (validatedData.riskAmount) {
        calculatedFields.rMultiple = calculateRMultiple(pnlData.pnl, validatedData.riskAmount);
      }

      // Calculate duration
      if (validatedData.entryDate) {
        const duration = calculateDuration(validatedData.entryDate, validatedData.exitDate);
        calculatedFields.duration = duration.minutes;
      }
    } else if (!validatedData.exitPrice) {
      calculatedFields.isOpen = true;
      calculatedFields.pnl = null;
      calculatedFields.pnlPercent = null;
      calculatedFields.rMultiple = null;
      calculatedFields.duration = null;
    }

    // Separate tags from the main data
    const { tags, ...tradeData } = validatedData;

    // Update the trade
    const trade = await prisma.trade.update({
      where: { id: params.id },
      data: {
        ...tradeData,
        ...calculatedFields,
        tags: tags ? {
          deleteMany: {},
          create: tags.map(tag => ({
            name: tag,
            category: 'GENERAL',
          }))
        } : undefined,
      },
      include: {
        tags: true,
        screenshots: true,
        setup: {
          select: {
            id: true,
            name: true,
          },
        },
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ data: trade });
  } catch (error) {
    console.error('Error updating trade:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}

// DELETE /api/trades/[id] - Delete a trade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingTrade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Delete the trade (cascade will handle related records)
    await prisma.trade.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}