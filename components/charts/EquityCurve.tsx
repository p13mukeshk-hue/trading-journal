'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EquityCurvePoint } from '@/types/trading';
import { Button } from '@/components/ui/button';
import { TrendingUp, Activity } from 'lucide-react';

interface EquityCurveProps {
  data: EquityCurvePoint[];
  loading?: boolean;
  height?: number;
}

export function EquityCurve({ data, loading = false, height = 300 }: EquityCurveProps) {
  const [showDrawdown, setShowDrawdown] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Equity Curve</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Equity Curve</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No trading data available</p>
              <p className="text-sm">Complete some trades to see your equity curve</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(new Date(label), 'short')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Balance: <span className="font-medium">{formatCurrency(data.balance)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Trade P&L: <span className={`font-medium ${data.pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {formatCurrency(data.pnl)}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Trades: <span className="font-medium">{data.trades}</span>
          </p>
          {showDrawdown && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drawdown: <span className="font-medium text-danger-600">
                -{data.drawdown.toFixed(2)}%
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const maxBalance = Math.max(...data.map(d => d.balance));
  const minBalance = Math.min(...data.map(d => d.balance));
  const totalReturn = data.length > 0 ? ((data[data.length - 1].balance - data[0].balance) / data[0].balance) * 100 : 0;
  const maxDrawdown = Math.max(...data.map(d => d.drawdown));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Equity Curve</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={showDrawdown ? "outline" : "default"}
              size="sm"
              onClick={() => setShowDrawdown(!showDrawdown)}
            >
              {showDrawdown ? 'Hide' : 'Show'} Drawdown
            </Button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Total Return</p>
            <p className={`font-semibold ${totalReturn >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {totalReturn.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Max Balance</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(maxBalance)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Min Balance</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(minBalance)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Max Drawdown</p>
            <p className="font-semibold text-danger-600">
              -{maxDrawdown.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            {showDrawdown ? (
              <div className="space-y-4">
                {/* Equity Curve */}
                <div style={{ height: height * 0.65 }}>
                  <ResponsiveContainer>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => formatDate(new Date(value), 'short')}
                        className="text-xs"
                      />
                      <YAxis
                        tickFormatter={formatCurrency}
                        className="text-xs"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, className: "fill-primary-600" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Drawdown Chart */}
                <div style={{ height: height * 0.35 }}>
                  <ResponsiveContainer>
                    <AreaChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => formatDate(new Date(value), 'short')}
                        className="text-xs"
                      />
                      <YAxis
                        tickFormatter={(value) => `-${value.toFixed(1)}%`}
                        className="text-xs"
                      />
                      <Tooltip
                        formatter={(value: number) => [`-${value.toFixed(2)}%`, 'Drawdown']}
                        labelFormatter={(value) => formatDate(new Date(value), 'short')}
                      />
                      <Area
                        type="monotone"
                        dataKey="drawdown"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(new Date(value), 'short')}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, className: "fill-primary-600" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}