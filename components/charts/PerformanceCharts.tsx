'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { PerformanceMetrics, TradeDistribution, TimeAnalysis, SetupAnalysis } from '@/types/trading';
import { BarChart3, PieChart as PieIcon, Scatter, Clock, Target, Activity } from 'lucide-react';

interface PerformanceChartsProps {
  metrics: PerformanceMetrics;
  timeAnalysis: TimeAnalysis;
  setupAnalysis: SetupAnalysis[];
  loading?: boolean;
}

export function PerformanceCharts({ metrics, timeAnalysis, setupAnalysis, loading = false }: PerformanceChartsProps) {
  const [activeChart, setActiveChart] = useState<'distribution' | 'time' | 'setups' | 'risk'>('distribution');

  // Generate P&L distribution data
  const generatePnlDistribution = (): TradeDistribution[] => {
    // This would normally come from the API with actual trade data
    // For now, we'll create sample distribution data
    return [
      { range: '< -$500', count: 2, percentage: 8, pnl: -1200 },
      { range: '-$500 to -$100', count: 5, percentage: 20, pnl: -1500 },
      { range: '-$100 to $0', count: 3, percentage: 12, pnl: -150 },
      { range: '$0 to $100', count: 4, percentage: 16, pnl: 200 },
      { range: '$100 to $500', count: 8, percentage: 32, pnl: 2400 },
      { range: '> $500', count: 3, percentage: 12, pnl: 2100 },
    ];
  };

  const pnlDistribution = generatePnlDistribution();

  // Setup performance data for pie chart
  const setupPieData = setupAnalysis.slice(0, 6).map((setup, index) => ({
    name: setup.setupName,
    value: Math.abs(setup.pnl),
    pnl: setup.pnl,
    trades: setup.trades,
    winRate: setup.winRate,
    color: `hsl(${(index * 60) % 360}, 70%, 50%)`,
  }));

  // Risk vs Reward scatter data
  const riskRewardData = setupAnalysis.map(setup => ({
    name: setup.setupName,
    risk: setup.averageRMultiple < 0 ? Math.abs(setup.averageRMultiple) : 1,
    reward: setup.averageRMultiple > 0 ? setup.averageRMultiple : 0.5,
    pnl: setup.pnl,
    trades: setup.trades,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label || data.name || data.range}
          </p>
          {data.pnl !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              P&L: <span className={`font-medium ${data.pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {formatCurrency(data.pnl)}
              </span>
            </p>
          )}
          {data.trades !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trades: <span className="font-medium">{data.trades}</span>
            </p>
          )}
          {data.winRate !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Win Rate: <span className="font-medium">{data.winRate.toFixed(1)}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Navigation */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeChart === 'distribution' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('distribution')}
          className="flex items-center space-x-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>P&L Distribution</span>
        </Button>
        <Button
          variant={activeChart === 'time' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('time')}
          className="flex items-center space-x-2"
        >
          <Clock className="w-4 h-4" />
          <span>Time Analysis</span>
        </Button>
        <Button
          variant={activeChart === 'setups' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('setups')}
          className="flex items-center space-x-2"
        >
          <PieIcon className="w-4 h-4" />
          <span>Setup Performance</span>
        </Button>
        <Button
          variant={activeChart === 'risk' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('risk')}
          className="flex items-center space-x-2"
        >
          <Target className="w-4 h-4" />
          <span>Risk Analysis</span>
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeChart === 'distribution' && (
          <>
            {/* P&L Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>P&L Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={pnlDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="range" 
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="count"
                        fill={(entry: any) => entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Win/Loss Streaks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Streak Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-success-600">
                      {metrics.longestWinStreak}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Longest Win Streak
                    </div>
                  </div>
                  <div className="text-center p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-danger-600">
                      {metrics.longestLossStreak}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Longest Loss Streak
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`text-2xl font-bold ${metrics.currentStreak >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {Math.abs(metrics.currentStreak)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Current {metrics.currentStreak >= 0 ? 'Win' : 'Loss'} Streak
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPercent(metrics.winRate)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Overall Win Rate
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeChart === 'time' && (
          <>
            {/* Hourly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Hourly Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={timeAnalysis.hourly.filter(h => h.trades > 0)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="hour" 
                        className="text-xs"
                        tickFormatter={(value) => `${value}:00`}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'pnl' ? formatCurrency(value as number) : value,
                          name === 'pnl' ? 'P&L' : name === 'trades' ? 'Trades' : 'Win Rate'
                        ]}
                        labelFormatter={(value) => `Hour: ${value}:00`}
                      />
                      <Bar
                        dataKey="pnl"
                        fill={(entry: any) => entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Daily Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Daily Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={timeAnalysis.daily.filter(d => d.trades > 0)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="dayName" 
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'pnl' ? formatCurrency(value as number) : value,
                          name === 'pnl' ? 'P&L' : 'Trades'
                        ]}
                      />
                      <Bar
                        dataKey="pnl"
                        fill={(entry: any) => entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeChart === 'setups' && (
          <>
            {/* Setup Performance Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieIcon className="w-5 h-5" />
                  <span>Setup P&L Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={setupPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${formatCurrency(entry.pnl)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {setupPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Setup Performance Bars */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Setup Win Rates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={setupAnalysis.slice(0, 6)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" domain={[0, 100]} className="text-xs" />
                      <YAxis 
                        type="category" 
                        dataKey="setupName" 
                        className="text-xs"
                        width={100}
                      />
                      <Tooltip
                        formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Win Rate']}
                      />
                      <Bar
                        dataKey="winRate"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeChart === 'risk' && (
          <>
            {/* Risk vs Reward Scatter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scatter className="w-5 h-5" />
                  <span>Risk vs Reward</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        type="number" 
                        dataKey="risk" 
                        name="Risk"
                        className="text-xs"
                        label={{ value: 'Risk', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="reward" 
                        name="Reward"
                        className="text-xs"
                        label={{ value: 'Reward', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Scatter
                        name="Setups"
                        data={riskRewardData}
                        fill="#3b82f6"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Risk Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(metrics.maxDrawdown)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Max Drawdown
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.averageRMultiple.toFixed(2)}R
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Avg R-Multiple
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Risk Assessment
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {metrics.profitFactor > 2 ? (
                        <span className="text-success-600">✓ Excellent risk management</span>
                      ) : metrics.profitFactor > 1.5 ? (
                        <span className="text-warning-600">⚠ Good risk management</span>
                      ) : (
                        <span className="text-danger-600">⚠ Risk management needs improvement</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}