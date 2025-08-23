'use client';

import { useState } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { TradeForm } from '@/components/forms/TradeForm';
import { MultiTradeForm } from '@/components/forms/MultiTradeForm';
import { PerformanceCharts } from '@/components/charts/PerformanceCharts';
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { PriceTicker } from '@/components/ticker/PriceTicker';
import { NewsScroller } from '@/components/news/NewsScroller';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Plus, 
  BarChart3, 
  FileText, 
  Settings, 
  Download,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

// Mock user - in real app this would come from authentication
const mockUser = {
  id: 'user-1',
  name: 'John Trader',
  email: 'john@example.com',
  startingCapital: 10000,
};

type ActiveView = 'dashboard' | 'new-trade' | 'analytics' | 'reports' | 'settings';

export default function HomePage() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const navigation = [
    {
      name: 'Dashboard',
      key: 'dashboard' as const,
      icon: LayoutDashboard,
    },
    {
      name: 'New Trade',
      key: 'new-trade' as const,
      icon: Plus,
    },
    {
      name: 'Analytics',
      key: 'analytics' as const,
      icon: BarChart3,
    },
    {
      name: 'Reports',
      key: 'reports' as const,
      icon: FileText,
    },
    {
      name: 'Settings',
      key: 'settings' as const,
      icon: Settings,
    },
  ];

  const handleTradeSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create trade');
      }

      // Switch back to dashboard after successful submission
      setActiveView('dashboard');
    } catch (error) {
      console.error('Error creating trade:', error);
      // Handle error (show toast, etc.)
    }
  };

  const handleMultiTradeSubmit = async (trades: any[]) => {
    try {
      const promises = trades.map(trade => 
        fetch('/api/trades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trade),
        })
      );

      const responses = await Promise.all(promises);
      
      const failedTrades = responses.filter(response => !response.ok);
      if (failedTrades.length > 0) {
        throw new Error(`Failed to create ${failedTrades.length} trade(s)`);
      }

      // Switch back to dashboard after successful submission
      setActiveView('dashboard');
    } catch (error) {
      console.error('Error creating trades:', error);
      // Handle error (show toast, etc.)
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard userId={mockUser.id} />;
      case 'new-trade':
        return (
          <MultiTradeForm
            onSubmit={handleMultiTradeSubmit}
            onCancel={() => setActiveView('dashboard')}
          />
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Customize your trading journal preferences
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-gray-600 dark:text-gray-400">{mockUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-gray-600 dark:text-gray-400">{mockUser.email}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Dark Mode</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleDarkMode}
                      className="flex items-center space-x-2"
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{darkMode ? 'Light' : 'Dark'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Trading Journal
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveView(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeView === item.key
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {mockUser.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {mockUser.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {mockUser.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-4 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="flex items-center space-x-2"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Price Ticker */}
        <PriceTicker />

        {/* Financial News Scroller */}
        <NewsScroller />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}