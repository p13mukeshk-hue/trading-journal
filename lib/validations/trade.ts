import { z } from 'zod';
import { TradeType, AssetClass, EmotionLevel, MarketCondition, VolatilityLevel } from '@prisma/client';

export const tradeSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be 10 characters or less')
    .toUpperCase(),
  
  side: z.nativeEnum(TradeType, {
    errorMap: () => ({ message: 'Please select Long or Short' })
  }),
  
  assetClass: z.nativeEnum(AssetClass, {
    errorMap: () => ({ message: 'Please select an asset class' })
  }),
  
  entryDate: z.date({
    required_error: 'Entry date is required',
    invalid_type_error: 'Please enter a valid date'
  }),
  
  entryPrice: z.number()
    .positive('Entry price must be positive')
    .finite('Entry price must be a valid number'),
  
  quantity: z.number()
    .positive('Quantity must be positive')
    .finite('Quantity must be a valid number'),
  
  entryFees: z.number()
    .min(0, 'Entry fees cannot be negative')
    .finite('Entry fees must be a valid number')
    .optional(),
  
  exitDate: z.date({
    invalid_type_error: 'Please enter a valid exit date'
  }).optional(),
  
  exitPrice: z.number()
    .positive('Exit price must be positive')
    .finite('Exit price must be a valid number')
    .optional(),
  
  exitFees: z.number()
    .min(0, 'Exit fees cannot be negative')
    .finite('Exit fees must be a valid number')
    .optional(),
  
  stopLoss: z.number()
    .positive('Stop loss must be positive')
    .finite('Stop loss must be a valid number')
    .optional(),
  
  takeProfit: z.number()
    .positive('Take profit must be positive')
    .finite('Take profit must be a valid number')
    .optional(),
  
  riskAmount: z.number()
    .positive('Risk amount must be positive')
    .finite('Risk amount must be a valid number')
    .optional(),
  
  notes: z.string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional(),
  
  lessons: z.string()
    .max(2000, 'Lessons must be 2000 characters or less')
    .optional(),
  
  emotionBefore: z.nativeEnum(EmotionLevel).optional(),
  emotionAfter: z.nativeEnum(EmotionLevel).optional(),
  
  confidence: z.number()
    .min(1, 'Confidence must be between 1 and 10')
    .max(10, 'Confidence must be between 1 and 10')
    .int('Confidence must be a whole number')
    .optional(),
  
  marketCondition: z.nativeEnum(MarketCondition).optional(),
  volatility: z.nativeEnum(VolatilityLevel).optional(),
  
  tags: z.array(z.string()).optional(),
  setupId: z.string().cuid().optional(),
  portfolioId: z.string().cuid().optional(),
}).refine(
  (data) => {
    // If exit date is provided, exit price should also be provided
    if (data.exitDate && !data.exitPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Exit price is required when exit date is provided',
    path: ['exitPrice']
  }
).refine(
  (data) => {
    // Exit date should not be before entry date
    if (data.exitDate && data.entryDate && data.exitDate < data.entryDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Exit date cannot be before entry date',
    path: ['exitDate']
  }
).refine(
  (data) => {
    // For long positions, stop loss should be below entry price
    if (data.side === TradeType.LONG && data.stopLoss && data.stopLoss >= data.entryPrice) {
      return false;
    }
    // For short positions, stop loss should be above entry price
    if (data.side === TradeType.SHORT && data.stopLoss && data.stopLoss <= data.entryPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Stop loss should be on the opposite side of entry price based on trade direction',
    path: ['stopLoss']
  }
).refine(
  (data) => {
    // For long positions, take profit should be above entry price
    if (data.side === TradeType.LONG && data.takeProfit && data.takeProfit <= data.entryPrice) {
      return false;
    }
    // For short positions, take profit should be below entry price
    if (data.side === TradeType.SHORT && data.takeProfit && data.takeProfit >= data.entryPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Take profit should be in the profitable direction based on trade direction',
    path: ['takeProfit']
  }
);

// Create a base schema without refinements for partial updates
const baseTradeSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be 10 characters or less')
    .toUpperCase(),
  
  side: z.nativeEnum(TradeType, {
    errorMap: () => ({ message: 'Please select Long or Short' })
  }),
  
  assetClass: z.nativeEnum(AssetClass, {
    errorMap: () => ({ message: 'Please select an asset class' })
  }),
  
  entryDate: z.date({
    required_error: 'Entry date is required',
    invalid_type_error: 'Please enter a valid date'
  }),
  
  entryPrice: z.number()
    .positive('Entry price must be positive')
    .finite('Entry price must be a valid number'),
  
  quantity: z.number()
    .positive('Quantity must be positive')
    .finite('Quantity must be a valid number'),
  
  entryFees: z.number()
    .min(0, 'Entry fees cannot be negative')
    .finite('Entry fees must be a valid number')
    .optional(),
  
  exitDate: z.date({
    invalid_type_error: 'Please enter a valid exit date'
  }).optional(),
  
  exitPrice: z.number()
    .positive('Exit price must be positive')
    .finite('Exit price must be a valid number')
    .optional(),
  
  exitFees: z.number()
    .min(0, 'Exit fees cannot be negative')
    .finite('Exit fees must be a valid number')
    .optional(),
  
  stopLoss: z.number()
    .positive('Stop loss must be positive')
    .finite('Stop loss must be a valid number')
    .optional(),
  
  takeProfit: z.number()
    .positive('Take profit must be positive')
    .finite('Take profit must be a valid number')
    .optional(),
  
  riskAmount: z.number()
    .positive('Risk amount must be positive')
    .finite('Risk amount must be a valid number')
    .optional(),
  
  notes: z.string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional(),
  
  lessons: z.string()
    .max(2000, 'Lessons must be 2000 characters or less')
    .optional(),
  
  emotionBefore: z.nativeEnum(EmotionLevel).optional(),
  emotionAfter: z.nativeEnum(EmotionLevel).optional(),
  
  confidence: z.number()
    .min(1, 'Confidence must be between 1 and 10')
    .max(10, 'Confidence must be between 1 and 10')
    .int('Confidence must be a whole number')
    .optional(),
  
  marketCondition: z.nativeEnum(MarketCondition).optional(),
  volatility: z.nativeEnum(VolatilityLevel).optional(),
  
  tags: z.array(z.string()).optional(),
  setupId: z.string().cuid().optional(),
  portfolioId: z.string().cuid().optional(),
});

export const tradeUpdateSchema = baseTradeSchema.partial().extend({
  id: z.string().cuid()
});

export const tradeFilterSchema = z.object({
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional(),
  symbols: z.array(z.string()).optional(),
  sides: z.array(z.nativeEnum(TradeType)).optional(),
  assetClasses: z.array(z.nativeEnum(AssetClass)).optional(),
  setups: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  minPnl: z.number().optional(),
  maxPnl: z.number().optional(),
  isOpen: z.boolean().optional(),
  portfolios: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

export const bulkImportSchema = z.object({
  trades: z.array(tradeSchema),
  portfolioId: z.string().cuid().optional()
});

export type TradeInput = z.infer<typeof tradeSchema>;
export type TradeUpdateInput = z.infer<typeof tradeUpdateSchema>;
export type TradeFilter = z.infer<typeof tradeFilterSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;