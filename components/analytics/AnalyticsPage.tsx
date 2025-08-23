'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  DollarSign,
  Percent,
  Award,
  AlertTriangle
} from 'lucide-react';

interface AnalyticsData {
  dailyPnl: Array<{ date: string; pnl: number; cumulativePnl: number; }>;
  monthlyPnl: Array<{ month: string; pnl: number; trades: number; }>;
  setupAnalysis: Array<{ setupName: string; trades: number; wins: number; pnl: number; winRate: number; }>;
  tradeDistribution: Array<{ range: string; count: number; }>;
  winLossAnalysis: Array<{ type: string; count: number; averageAmount: number; }>;
  timeAnalysis: Array<{ hour: number; trades: number; avgPnl: number; }>;
  drawdownData: Array<{ date: string; drawdown: number; }>;
  riskRewardData: Array<{ rMultiple: string; count: number; }>;
}

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/trades/analytics?timeframe=${timeframe}`);
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center text-gray-500 py-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Failed to load analytics data</p>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed performance analysis and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </Select>
        </div>
      </div>

      {/* P&L Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily P&L Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="w-5 h-5 text-blue-600" />
              <span>Daily P&L Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.dailyPnl || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'P&L']} />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative P&L Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Cumulative P&L</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.dailyPnl || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cumulative P&L']} />
                <Line 
                  type="monotone" 
                  dataKey="cumulativePnl" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Strategy Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.setupAnalysis || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="setupName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'P&L']} />
                <Bar dataKey="pnl" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win Rate by Strategy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span>Win Rate by Strategy</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.setupAnalysis || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="setupName" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Win Rate']} />
                <Bar dataKey="winRate" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              <span>Trade Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.tradeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="range"
                >
                  {analyticsData.tradeDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span>Win/Loss Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.winLossAnalysis || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk/Reward Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-red-600" />
              <span>Risk/Reward (R-Multiple)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.riskRewardData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rMultiple" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Monthly Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.monthlyPnl || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'P&L']} 
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar 
                dataKey="pnl" 
                fill="#3B82F6"
                name="Monthly P&L"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Drawdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span>Drawdown Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.drawdownData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Drawdown']} />
              <Area 
                type="monotone" 
                dataKey="drawdown" 
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trading Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <span>Trading Time Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.timeAnalysis || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis yAxisId="trades" orientation="left" />
              <YAxis yAxisId="pnl" orientation="right" />
              <Tooltip 
                labelFormatter={(hour) => `${hour}:00`}
                formatter={(value, name) => [
                  name === 'trades' ? value : `$${value}`,
                  name === 'trades' ? 'Trades' : 'Avg P&L'
                ]}
              />
              <Legend />
              <Bar yAxisId="trades" dataKey="trades" fill="#3B82F6" name="Trades" />
              <Line 
                yAxisId="pnl" 
                type="monotone" 
                dataKey="avgPnl" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Avg P&L"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}