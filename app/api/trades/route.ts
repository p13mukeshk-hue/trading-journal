import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tradeSchema, tradeFilterSchema } from '@/lib/validations/trade';
import { calculatePnL, calculateRMultiple, calculateDuration } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { TradeType } from '@prisma/client';

// GET /api/trades - Get all trades with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      // Return demo data if no authentication
      return NextResponse.json({
        data: generateDemoTrades(),
        pagination: {
          page: 1,
          limit: 20,
          total: 5,
          pages: 1,
        },
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters = tradeFilterSchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      symbols: searchParams.get('symbols')?.split(','),
      sides: searchParams.get('sides')?.split(','),
      assetClasses: searchParams.get('assetClasses')?.split(','),
      setups: searchParams.get('setups')?.split(','),
      tags: searchParams.get('tags')?.split(','),
      isOpen: searchParams.get('isOpen') ? searchParams.get('isOpen') === 'true' : undefined,
      minPnl: searchParams.get('minPnl') ? parseFloat(searchParams.get('minPnl')!) : undefined,
      maxPnl: searchParams.get('maxPnl') ? parseFloat(searchParams.get('maxPnl')!) : undefined,
      dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
        start: new Date(searchParams.get('startDate')!),
        end: new Date(searchParams.get('endDate')!)
      } : undefined,
    });

    // Build where clause
    const where: any = { userId: user.id };

    if (filters.symbols?.length) {
      where.symbol = { in: filters.symbols };
    }

    if (filters.sides?.length) {
      where.side = { in: filters.sides };
    }

    if (filters.assetClasses?.length) {
      where.assetClass = { in: filters.assetClasses };
    }

    if (filters.isOpen !== undefined) {
      where.isOpen = filters.isOpen;
    }

    if (filters.dateRange) {
      where.entryDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    if (filters.minPnl !== undefined || filters.maxPnl !== undefined) {
      where.pnl = {};
      if (filters.minPnl !== undefined) where.pnl.gte = filters.minPnl;
      if (filters.maxPnl !== undefined) where.pnl.lte = filters.maxPnl;
    }

    if (filters.setups?.length) {
      where.setupId = { in: filters.setups };
    }

    // Get total count for pagination
    const total = await prisma.trade.count({ where });

    // Get trades with relations
    const trades = await prisma.trade.findMany({
      where,
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
      orderBy: { entryDate: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });

    return NextResponse.json({
      data: trades,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST /api/trades - Create a new trade
export async function POST(request: NextRequest) {
  let body: any;
  try {
    const session = await getServerSession();
    let user = null;
    
    // If we have a session, get the user
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }
    
    // If no user (demo mode), we'll return success without actually saving to DB

    body = await request.json();
    
    // Convert date strings to Date objects and combine with time safely
    const processedBody = { ...body };
    
    // Process entry date
    if (body.entryDate) {
      try {
        let entryDate: Date;
        
        if (body.entryDate instanceof Date) {
          entryDate = body.entryDate;
        } else if (typeof body.entryDate === 'string') {
          // If it's already a full ISO string, use it directly
          if (body.entryDate.includes('T')) {
            entryDate = new Date(body.entryDate);
          } else {
            // If it's just a date string (YYYY-MM-DD), add time
            const entryDateStr = body.entryDate + 'T' + (body.entryTime || '12:00') + ':00';
            entryDate = new Date(entryDateStr);
          }
        } else {
          throw new Error('Invalid entry date type');
        }
        
        if (isNaN(entryDate.getTime())) {
          throw new Error('Invalid entry date');
        }
        processedBody.entryDate = entryDate;
      } catch (error) {
        console.error('Entry date processing error:', error, 'Input:', body.entryDate);
        return NextResponse.json(
          { error: 'Invalid entry date format' },
          { status: 400 }
        );
      }
    }
    
    // Process exit date
    if (body.exitDate) {
      try {
        let exitDate: Date;
        
        if (body.exitDate instanceof Date) {
          exitDate = body.exitDate;
        } else if (typeof body.exitDate === 'string') {
          // If it's already a full ISO string, use it directly
          if (body.exitDate.includes('T')) {
            exitDate = new Date(body.exitDate);
          } else {
            // If it's just a date string (YYYY-MM-DD), add time
            const exitDateStr = body.exitDate + 'T' + (body.exitTime || '16:00') + ':00';
            exitDate = new Date(exitDateStr);
          }
        } else {
          throw new Error('Invalid exit date type');
        }
        
        if (isNaN(exitDate.getTime())) {
          throw new Error('Invalid exit date');
        }
        processedBody.exitDate = exitDate;
      } catch (error) {
        console.error('Exit date processing error:', error, 'Input:', body.exitDate);
        return NextResponse.json(
          { error: 'Invalid exit date format' },
          { status: 400 }
        );
      }
    }
    
    // Remove time fields from processed data as they're not part of the schema
    delete processedBody.entryTime;
    delete processedBody.exitTime;
    
    // Validate input data
    console.log('Validating data:', JSON.stringify(processedBody, null, 2));
    let validatedData;
    try {
      validatedData = tradeSchema.parse(processedBody);
    } catch (zodError: any) {
      console.error('Zod validation error:', zodError);
      if (zodError.errors) {
        console.error('Specific errors:', zodError.errors);
      }
      throw zodError;
    }

    // Calculate P&L and other metrics if trade is closed
    let calculatedFields: any = {
      isOpen: !validatedData.exitPrice,
    };

    if (validatedData.exitPrice && validatedData.exitDate) {
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

      // Calculate duration (temporarily disabled due to TypeScript strictness)
      // const duration = calculateDuration(validatedData.entryDate, validatedData.exitDate!);
      // calculatedFields.duration = duration.minutes;
    }

    // Create the trade (if user exists) or return demo response
    if (user) {
      // Authenticated user - save to database
      const trade = await prisma.trade.create({
        data: {
          ...validatedData,
          ...calculatedFields,
          userId: user.id,
          tags: validatedData.tags ? {
            create: validatedData.tags.map(tag => ({
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
      
      return NextResponse.json({ data: trade }, { status: 201 });
    } else {
      // Demo mode - return success response without saving
      const demoTrade = {
        id: `demo-${Date.now()}`,
        ...validatedData,
        ...calculatedFields,
        userId: 'demo-user',
        tags: validatedData.tags ? validatedData.tags.map(tag => ({
          id: `tag-${Date.now()}-${tag}`,
          name: tag,
          category: 'GENERAL'
        })) : [],
        screenshots: [],
        setup: null,
        portfolio: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({ data: demoTrade }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating trade:', error);
    console.error('Request body:', JSON.stringify(body, null, 2));
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        console.error('Validation error details:', error.message);
        return NextResponse.json(
          { error: 'Invalid input data', details: error.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create trade', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create trade', details: 'Unknown error' },
      { status: 500 }
    );
  }
}

// Generate demo trades data - 25 realistic sample trades
function generateDemoTrades() {
  const currentDate = new Date();
  const symbols = ['BTC', 'ETH', 'ARB', 'AAVE', 'SOL', 'AAPL', 'NVDA', 'MSFT', 'TSLA', 'NIFTY'];
  const setups = ['Breakout Strategy', 'Mean Reversion', 'Momentum Play', 'Support Bounce', 'Resistance Break', 'Gap Fill', 'Earnings Play', 'Technical Bounce', 'DeFi Momentum', 'Layer 2 Play'];
  const sides = ['LONG', 'SHORT'];
  
  const trades = [];
  
  // Generate 23 closed trades + 2 open trades
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 45) + 1; // 1-45 days ago
    const entryDate = new Date(currentDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const side = sides[Math.floor(Math.random() * sides.length)];
    const setup = setups[Math.floor(Math.random() * setups.length)];
    
    // Generate realistic prices based on symbol
    let basePrice = 100;
    if (symbol === 'BTC') basePrice = 45000; // Bitcoin price range
    if (symbol === 'ETH') basePrice = 2500;  // Ethereum price
    if (symbol === 'ARB') basePrice = 0.8;   // Arbitrum price
    if (symbol === 'AAVE') basePrice = 300;  // Aave price
    if (symbol === 'SOL') basePrice = 100;   // Solana price
    if (symbol === 'AAPL') basePrice = 180;  // Apple stock price
    if (symbol === 'NVDA') basePrice = 900;  // NVIDIA stock price
    if (symbol === 'MSFT') basePrice = 420;  // Microsoft stock price
    if (symbol === 'TSLA') basePrice = 250;  // Tesla stock price
    if (symbol === 'NIFTY') basePrice = 19500; // Nifty 50 index level
    
    const entryPrice = basePrice + (Math.random() - 0.5) * (basePrice * 0.1);
    
    // Generate realistic quantities based on asset type
    let quantity;
    if (symbol === 'BTC') {
      quantity = Math.random() * 2 + 0.1; // 0.1 to 2.1 BTC
    } else if (symbol === 'ETH') {
      quantity = Math.random() * 10 + 1; // 1 to 11 ETH
    } else if (symbol === 'ARB') {
      quantity = Math.floor(Math.random() * 5000) + 500; // 500 to 5500 ARB
    } else if (symbol === 'AAVE') {
      quantity = Math.random() * 50 + 5; // 5 to 55 AAVE
    } else if (symbol === 'SOL') {
      quantity = Math.floor(Math.random() * 100) + 10; // 10 to 110 SOL
    } else if (symbol === 'NIFTY') {
      quantity = Math.floor(Math.random() * 50) + 25; // 25-75 lots
    } else {
      quantity = Math.floor(Math.random() * 200) + 10; // 10-210 shares for stocks
    }
    
    const isOpen = i < 2; // First 2 trades are open
    let exitDate, exitPrice, pnl, pnlPercent;
    
    if (!isOpen) {
      // Generate exit 1-10 days after entry
      const holdingDays = Math.floor(Math.random() * 10) + 1;
      exitDate = new Date(entryDate.getTime() + holdingDays * 24 * 60 * 60 * 1000);
      
      // Generate realistic P&L - 60% win rate
      const isWinner = Math.random() < 0.60;
      const priceChangePercent = isWinner ? 
        (Math.random() * 0.08 + 0.005) : // Winners: 0.5% to 8.5%
        -(Math.random() * 0.06 + 0.01);   // Losers: -1% to -7%
      
      if (side === 'LONG') {
        exitPrice = entryPrice * (1 + priceChangePercent);
      } else {
        exitPrice = entryPrice * (1 - priceChangePercent);
      }
      
      // Calculate P&L
      const grossPnl = side === 'LONG' ? 
        (exitPrice - entryPrice) * quantity :
        (entryPrice - exitPrice) * quantity;
      
      const fees = Math.random() * 10 + 2; // $2-12 fees
      pnl = grossPnl - fees;
      pnlPercent = (pnl / (entryPrice * quantity)) * 100;
    }
    
    trades.push({
      id: `demo-${i + 1}`,
      symbol,
      side,
      assetClass: ['BTC', 'ETH', 'ARB', 'AAVE', 'SOL'].includes(symbol) ? 'CRYPTO' : 
                 symbol === 'NIFTY' ? 'INDEX' : 'STOCK',
      entryDate,
      entryPrice: Math.round(entryPrice * 100) / 100,
      quantity: symbol === 'BTC' ? Math.round(quantity * 10000) / 10000 : 
               symbol === 'ETH' ? Math.round(quantity * 1000) / 1000 :
               symbol === 'AAVE' ? Math.round(quantity * 100) / 100 : quantity,
      exitDate,
      exitPrice: exitPrice ? Math.round(exitPrice * 100) / 100 : null,
      pnl: pnl ? Math.round(pnl * 100) / 100 : null,
      pnlPercent: pnlPercent ? Math.round(pnlPercent * 100) / 100 : null,
      isOpen,
      tags: [{ 
        name: isOpen ? 'Open Position' : ((pnl || 0) > 0 ? 'Winner' : 'Loser'), 
        category: 'GENERAL' 
      }],
      setup: { name: setup },
    });
  }
  
  // Sort by entry date (newest first)
  return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}