'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  assetClass: string;
  entryDate: string;
  exitDate?: string | null;
  entryPrice: number;
  exitPrice?: number | null;
  quantity: number;
  entryFees?: number;
  exitFees?: number;
  pnl?: number | null;
  pnlPercent?: number | null;
  isOpen: boolean;
  tags?: Array<{ name: string; category: string }>;
  setup?: { name: string } | null;
}

type TimePeriod = 'week' | '2weeks' | '3weeks' | '30days' | 'quarter' | 'year' | 'all';

interface TradeHistoryProps {
  userId: string;
}

export function TradeHistory({ userId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalPnL: 0,
    avgPnL: 0,
    bestTrade: 0,
    worstTrade: 0
  });

  const timePeriods = [
    { value: 'week' as const, label: 'Last Week' },
    { value: '2weeks' as const, label: 'Last 2 Weeks' },
    { value: '3weeks' as const, label: 'Last 3 Weeks' },
    { value: '30days' as const, label: 'Last 30 Days' },
    { value: 'quarter' as const, label: 'Last Quarter' },
    { value: 'year' as const, label: 'Last Year' },
    { value: 'all' as const, label: 'All Time' }
  ];

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trades');
      if (response.ok) {
        const result = await response.json();
        // The API returns {data: trades, pagination: ...} format
        setTrades(result.data || result);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTradesByPeriod = (trades: Trade[], period: TimePeriod) => {
    if (period === 'all') return trades;

    const now = new Date();
    const cutoffDate = new Date();

    switch (period) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '2weeks':
        cutoffDate.setDate(now.getDate() - 14);
        break;
      case '3weeks':
        cutoffDate.setDate(now.getDate() - 21);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryDate);
      return tradeDate >= cutoffDate;
    });
  };

  const calculateStats = (trades: Trade[]) => {
    const closedTrades = trades.filter(t => !t.isOpen && t.pnl !== null && t.pnl !== undefined);
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: trades.length,
        winRate: 0,
        totalPnL: 0,
        avgPnL: 0,
        bestTrade: 0,
        worstTrade: 0
      };
    }

    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const pnlValues = closedTrades.map(t => t.pnl || 0);
    
    return {
      totalTrades: trades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      totalPnL: pnlValues.reduce((sum, pnl) => sum + pnl, 0),
      avgPnL: pnlValues.reduce((sum, pnl) => sum + pnl, 0) / closedTrades.length,
      bestTrade: Math.max(...pnlValues),
      worstTrade: Math.min(...pnlValues)
    };
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    const filtered = filterTradesByPeriod(trades, selectedPeriod);
    setFilteredTrades(filtered);
    setStats(calculateStats(filtered));
  }, [trades, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/trades/export/excel');
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trade-history-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trade History</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trade History</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visual overview of all your trading activity
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            <span>Export History</span>
          </Button>
        </div>
      </div>

      {/* Time Period Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {timePeriods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
                className="flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{period.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className={`w-5 h-5 ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total P&L</p>
                <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.totalPnL)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className={`w-5 h-5 ${stats.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg P&L</p>
                <p className={`text-2xl font-bold ${stats.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.avgPnL)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Best Trade</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.bestTrade)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Worst Trade</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.worstTrade)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recent Trades</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No trades found for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredTrades.map((trade) => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          trade.side === 'LONG' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                        }`}>
                          {trade.side === 'LONG' ? 
                            <TrendingUp className="w-5 h-5" /> : 
                            <TrendingDown className="w-5 h-5" />
                          }
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {trade.symbol}
                            </h3>
                            <Badge variant={trade.side === 'LONG' ? 'success' : 'destructive'}>
                              {trade.side}
                            </Badge>
                            <Badge variant="outline">
                              {trade.assetClass}
                            </Badge>
                            <Badge variant={trade.isOpen ? 'warning' : 'default'}>
                              {trade.isOpen ? 'OPEN' : 'CLOSED'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Entry: {formatDate(trade.entryDate)} • {formatCurrency(trade.entryPrice)} • {trade.quantity} units
                          </p>
                          {trade.exitDate && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Exit: {formatDate(trade.exitDate)} • {formatCurrency(trade.exitPrice || 0)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {trade.pnl !== undefined && trade.pnl !== null && (
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(trade.pnl)}
                          </p>
                          {trade.pnlPercent !== undefined && trade.pnlPercent !== null && (
                            <p className={`text-sm ${
                              trade.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ({trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}