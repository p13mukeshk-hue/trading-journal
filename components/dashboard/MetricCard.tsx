'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent, getColorForPnL } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'currency' | 'percent' | 'number';
  format?: 'currency' | 'percent' | 'number' | 'ratio';
  icon?: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'percent',
  format = 'number',
  icon: Icon,
  description,
  trend,
  loading = false,
}: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percent':
        return formatPercent(val);
      case 'ratio':
        return `${val.toFixed(2)}:1`;
      default:
        return val.toLocaleString();
    }
  };

  const formatChange = (val: number) => {
    switch (changeType) {
      case 'currency':
        return formatCurrency(val);
      case 'percent':
        return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
      default:
        return val >= 0 ? `+${val}` : val.toString();
    }
  };

  const getTrendIcon = () => {
    if (!change && change !== 0) return null;
    
    if (change > 0) return <TrendingUp className="w-4 h-4 text-success-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-danger-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getValueColor = () => {
    if (format === 'currency' && typeof value === 'number') {
      return getColorForPnL(value);
    }
    return 'text-gray-900 dark:text-white';
  };

  const getChangeColor = () => {
    if (!change && change !== 0) return 'text-gray-500';
    if (change > 0) return 'text-success-600';
    if (change < 0) return 'text-danger-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </h3>
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        </div>
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${getValueColor()}`}>
            {formatValue(value)}
          </div>
          {(change !== undefined || description) && (
            <div className="flex items-center space-x-2 text-xs">
              {change !== undefined && (
                <>
                  {getTrendIcon()}
                  <span className={getChangeColor()}>
                    {formatChange(change)}
                  </span>
                  <span className="text-gray-500">from last period</span>
                </>
              )}
              {description && !change && (
                <span className="text-gray-500">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}