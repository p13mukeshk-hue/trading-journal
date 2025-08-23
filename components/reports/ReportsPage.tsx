'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { 
  Download, 
  FileText, 
  Calendar, 
  BarChart3, 
  DollarSign,
  TrendingUp,
  Settings,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';

interface ReportConfig {
  type: 'performance' | 'tax' | 'strategy' | 'custom';
  format: 'pdf' | 'csv' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includeScreenshots: boolean;
}

export function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    type: 'performance',
    format: 'pdf',
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    includeCharts: true,
    includeScreenshots: false,
  });

  const reportTypes = [
    {
      type: 'performance' as const,
      title: 'Performance Summary',
      description: 'Comprehensive trading performance overview with key metrics',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      type: 'tax' as const,
      title: 'Tax Report',
      description: 'Realized gains/losses for tax purposes with detailed breakdowns',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      type: 'strategy' as const,
      title: 'Strategy Analysis',
      description: 'Performance breakdown by trading strategies and setups',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      type: 'custom' as const,
      title: 'Custom Report',
      description: 'Build a custom report with selected metrics and timeframes',
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const generateReport = async (reportType: string, quickFormat?: string) => {
    const format = quickFormat || config.format;
    const loadingKey = `${reportType}-${format}`;
    
    try {
      setLoading(loadingKey);
      
      const response = await fetch('/api/reports/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          format,
          dateRange: config.dateRange,
          includeCharts: config.includeCharts,
          includeScreenshots: config.includeScreenshots,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      
      if (result.success) {
        // Create download link
        const byteCharacters = atob(result.data.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.data.contentType });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(null);
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
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate and export comprehensive trading reports
          </p>
        </div>
        
        <Button
          onClick={handleExcelExport}
          disabled={exporting}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{exporting ? 'Exporting...' : 'Export All Trades (Excel)'}</span>
        </Button>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.type} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${report.bgColor}`}>
                    <Icon className={`w-5 h-5 ${report.color}`} />
                  </div>
                  <span>{report.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {report.description}
                </p>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => generateReport(report.type, 'pdf')}
                    disabled={loading === `${report.type}-pdf`}
                    className="flex items-center space-x-2"
                  >
                    {loading === `${report.type}-pdf` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>PDF</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateReport(report.type, 'csv')}
                    disabled={loading === `${report.type}-csv`}
                    className="flex items-center space-x-2"
                  >
                    {loading === `${report.type}-csv` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>CSV</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Report Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.dateRange.start}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={config.dateRange.end}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
              />
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={config.format}
              onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
            >
              <option value="pdf">PDF Report</option>
              <option value="csv">CSV Data</option>
              <option value="excel">Excel Spreadsheet</option>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Label>Report Options</Label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeCharts}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include Charts</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeScreenshots}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeScreenshots: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include Screenshots</span>
              </label>
            </div>
          </div>

          {/* Generate Custom Report */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => generateReport(config.type)}
              disabled={loading !== null}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Generate Custom Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Quick Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                setConfig(prev => ({
                  ...prev,
                  dateRange: {
                    start: lastWeek.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0],
                  }
                }));
                generateReport('performance');
              }}
              disabled={loading !== null}
              className="flex items-center space-x-2"
            >
              {loading === 'performance-pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Last 7 Days</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                setConfig(prev => ({
                  ...prev,
                  dateRange: {
                    start: lastMonth.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0],
                  }
                }));
                generateReport('performance');
              }}
              disabled={loading !== null}
              className="flex items-center space-x-2"
            >
              {loading === 'performance-pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Last 30 Days</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const today = new Date();
                const yearStart = new Date(today.getFullYear(), 0, 1);
                setConfig(prev => ({
                  ...prev,
                  dateRange: {
                    start: yearStart.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0],
                  }
                }));
                generateReport('performance');
              }}
              disabled={loading !== null}
              className="flex items-center space-x-2"
            >
              {loading === 'performance-pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Year to Date</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}