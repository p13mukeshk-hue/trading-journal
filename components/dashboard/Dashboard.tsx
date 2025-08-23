'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { EquityCurve } from '../charts/EquityCurve';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Target, 
  Activity, 
  Calendar,
  BarChart3,
  PieChart,
  Clock,
  Trophy,
  AlertTriangle,
  Download
} from 'lucide-react';
import { DashboardData, PerformanceMetrics } from '@/types/trading';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface DashboardProps {
  userId: string;
}

export function Dashboard({ userId }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      let startDate: string | undefined;
      const endDate = new Date().toISOString();

      switch (dateRange) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          startDate = undefined;
      }

      // Fetch analytics data
      const analyticsUrl = `/api/trades/analytics${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`;
      const analyticsResponse = await fetch(analyticsUrl);
      
      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const analyticsData = await analyticsResponse.json();
      const metrics: PerformanceMetrics = analyticsData.data;

      // Fetch recent trades
      const tradesResponse = await fetch('/api/trades?limit=5');
      if (!tradesResponse.ok) {
        throw new Error('Failed to fetch recent trades');
      }
      
      const tradesData = await tradesResponse.json();

      setData({
        metrics,
        equityCurve: metrics.equityCurve || [],
        recentTrades: tradesData.data || [],
        topPerformingSetups: metrics.setupAnalysis || [],
        monthlyPnl: metrics.monthlyPnl || [],
        riskMetrics: {
          currentRisk: 0,
          riskPerTrade: 2,
          portfolioHeat: 0,
          correlation: 0,
        },
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/trades/export/excel');
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trading-journal-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-danger-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your trading performance and analyze your results
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleExcelExport}
            disabled={exporting}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
          </Button>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total P&L"
          value={data?.metrics.totalPnl || 0}
          format="currency"
          icon={DollarSign}
          loading={loading}
        />
        <MetricCard
          title="Win Rate"
          value={data?.metrics.winRate || 0}
          format="percent"
          icon={Target}
          loading={loading}
        />
        <MetricCard
          title="Profit Factor"
          value={data?.metrics.profitFactor || 0}
          format="ratio"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Total Trades"
          value={data?.metrics.totalTrades || 0}
          icon={Activity}
          loading={loading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Average Win"
          value={data?.metrics.averageWin || 0}
          format="currency"
          icon={Trophy}
          loading={loading}
        />
        <MetricCard
          title="Average Loss"
          value={-(data?.metrics.averageLoss || 0)}
          format="currency"
          icon={AlertTriangle}
          loading={loading}
        />
        <MetricCard
          title="Max Drawdown"
          value={-(data?.metrics.maxDrawdown || 0)}
          format="percent"
          icon={TrendingDown}
          loading={loading}
        />
        <MetricCard
          title="Expectancy"
          value={data?.metrics.expectancy || 0}
          format="currency"
          icon={BarChart3}
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <div className="lg:col-span-2">
          <EquityCurve
            data={data?.equityCurve || []}
            loading={loading}
            height={400}
          />
        </div>

        {/* Monthly P&L */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Monthly P&L</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.monthlyPnl?.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No monthly data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data?.monthlyPnl?.slice(-6).map((month) => (
                  <div key={month.month} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {month.trades} trades
                      </span>
                    </div>
                    <span className={`font-semibold ${month.pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {formatCurrency(month.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades and Setup Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Trades</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.recentTrades?.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent trades</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data?.recentTrades?.map((trade) => (
                  <div key={trade.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {trade.symbol}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {trade.side} • {new Date(trade.entryDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${(trade.pnl || 0) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {trade.pnl ? formatCurrency(trade.pnl) : 'Open'}
                      </div>
                      {trade.pnlPercent && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {trade.pnlPercent.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Setups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Top Setups</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.topPerformingSetups?.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No setup data available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data?.topPerformingSetups?.slice(0, 5).map((setup) => (
                  <div key={setup.setupId} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {setup.setupName}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {setup.trades} trades • {setup.winRate.toFixed(1)}% win rate
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${setup.pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {formatCurrency(setup.pnl)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {setup.averageRMultiple.toFixed(2)}R avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}