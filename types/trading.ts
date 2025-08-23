import { 
  Trade as PrismaTrade, 
  TradeSetup, 
  Portfolio, 
  User,
  TradeType,
  AssetClass,
  EmotionLevel,
  MarketCondition,
  VolatilityLevel,
  TagCategory,
  GoalCategory,
  Broker
} from '@prisma/client';

// Enhanced Trade type with calculated fields
export interface Trade extends PrismaTrade {
  tags?: TradeTag[];
  screenshots?: Screenshot[];
  setup?: TradeSetup;
  portfolio?: Portfolio;
  
  // Calculated fields
  roi?: number;
  commission?: number;
  netPnl?: number;
  holdingPeriod?: string;
  maxAdverseExcursion?: number;
  maxFavorableExcursion?: number;
}

export interface TradeFormData {
  symbol: string;
  side: TradeType;
  assetClass: AssetClass;
  entryDate: Date;
  entryPrice: number;
  quantity: number;
  entryFees?: number;
  exitDate?: Date;
  exitPrice?: number;
  exitFees?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskAmount?: number;
  notes?: string;
  lessons?: string;
  emotionBefore?: EmotionLevel;
  emotionAfter?: EmotionLevel;
  confidence?: number;
  marketCondition?: MarketCondition;
  volatility?: VolatilityLevel;
  tags?: string[];
  setupId?: string;
  portfolioId?: string;
  screenshots?: File[];
}

export interface TradeTag {
  id: string;
  name: string;
  category: TagCategory;
  color?: string;
}

export interface Screenshot {
  id: string;
  url: string;
  caption?: string;
  type: 'CHART' | 'ENTRY' | 'EXIT' | 'ANALYSIS' | 'OTHER';
}

// Performance Metrics
export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalPnlPercent: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  averageRMultiple: number;
  expectancy: number;
  
  // Streaks
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  
  // Time-based
  averageHoldingPeriod: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  
  // Risk metrics
  riskOfRuin: number;
  kellyPercentage: number;
  recoveryFactor: number;
}

export interface EquityCurvePoint {
  date: string;
  balance: number;
  drawdown: number;
  trades: number;
  pnl: number;
}

export interface TradeDistribution {
  range: string;
  count: number;
  percentage: number;
  pnl: number;
}

export interface TimeAnalysis {
  hourly: Array<{
    hour: number;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
  daily: Array<{
    day: number; // 0 = Sunday
    dayName: string;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
  monthly: Array<{
    month: number;
    monthName: string;
    year: number;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
}

export interface SetupAnalysis {
  setupId: string;
  setupName: string;
  trades: number;
  pnl: number;
  winRate: number;
  profitFactor: number;
  averageRMultiple: number;
  expectancy: number;
}

export interface SymbolAnalysis {
  symbol: string;
  trades: number;
  pnl: number;
  winRate: number;
  averageHoldingPeriod: number;
  volatility: number;
}

// Market Data Types
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
}

export interface ChartData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Dashboard Types
export interface DashboardData {
  metrics: PerformanceMetrics;
  equityCurve: EquityCurvePoint[];
  recentTrades: Trade[];
  topPerformingSetups: SetupAnalysis[];
  monthlyPnl: Array<{
    month: string;
    pnl: number;
    trades: number;
  }>;
  riskMetrics: {
    currentRisk: number;
    riskPerTrade: number;
    portfolioHeat: number;
    correlation: number;
  };
}

// Filter Types
export interface TradeFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  symbols?: string[];
  sides?: TradeType[];
  assetClasses?: AssetClass[];
  setups?: string[];
  tags?: string[];
  minPnl?: number;
  maxPnl?: number;
  isOpen?: boolean;
  portfolios?: string[];
}

// Export Types
export interface ExportOptions {
  format: 'CSV' | 'PDF' | 'EXCEL' | 'JSON';
  includeCharts: boolean;
  includeScreenshots: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sections?: string[];
}

// Broker Integration Types
export interface BrokerConnection {
  id: string;
  broker: Broker;
  accountId: string;
  accountName: string;
  isConnected: boolean;
  lastSync?: Date;
  balance?: number;
  positions?: Position[];
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  marketValue: number;
  side: 'LONG' | 'SHORT';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Chart Configuration Types
export interface ChartConfig {
  type: 'line' | 'bar' | 'candlestick' | 'area' | 'scatter';
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  height?: number;
  colors?: string[];
  responsive?: boolean;
}

// Goal Types
export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: GoalCategory;
  targetDate?: Date;
  isCompleted: boolean;
  progress: number;
}

// Alert Types
export interface Alert {
  id: string;
  symbol: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLUME_ABOVE' | 'RSI_ABOVE' | 'RSI_BELOW';
  value: number;
  message?: string;
  isActive: boolean;
  triggered: boolean;
}