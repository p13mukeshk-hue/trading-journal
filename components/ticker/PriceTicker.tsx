'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'crypto' | 'stock' | 'commodity';
}

export function PriceTicker() {
  const [assets, setAssets] = useState<TickerAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Fetch real-time prices from our API
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/prices');
        
        if (response.ok) {
          const data = await response.json();
          setAssets(data.data || []);
          setLastUpdated(data.lastUpdated || new Date().toISOString());
        } else {
          console.error('Failed to fetch prices:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    fetchPrices();

    // Update prices every 60 seconds (to respect API rate limits)
    const interval = setInterval(fetchPrices, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, category: string) => {
    if (category === 'crypto') {
      if (price >= 1000) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      }
      return `$${price.toFixed(2)}`;
    }
    if (category === 'commodity') {
      return `$${price.toFixed(2)}`;
    }
    // Stocks
    return `$${price.toFixed(2)}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'crypto': return 'text-orange-400';
      case 'stock': return 'text-blue-400';
      case 'commodity': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center space-x-4">
          <div className="animate-pulse flex space-x-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="h-4 bg-gray-700 rounded w-12"></div>
                <div className="h-4 bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border-b border-gray-700 overflow-hidden">
      <div className="ticker-container">
        <div className="ticker-content">
          {/* Render the assets twice for seamless looping */}
          {[...assets, ...assets].map((asset, index) => (
            <div key={`${asset.symbol}-${index}`} className="ticker-item">
              <span className={`font-semibold ${getCategoryColor(asset.category)}`}>
                {asset.symbol}
              </span>
              <span className="text-white font-medium">
                {formatPrice(asset.price, asset.category)}
              </span>
              <div className={`flex items-center space-x-1 ${
                asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {asset.changePercent >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-sm font-medium">
                  {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="ticker-separator">•</div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .ticker-container {
          white-space: nowrap;
          overflow: hidden;
          padding: 8px 0;
          position: relative;
        }
        
        .ticker-content {
          display: inline-block;
          animation: scroll-left 120s linear infinite;
          will-change: transform;
        }
        
        .ticker-item {
          display: inline-flex;
          align-items: center;
          margin-right: 32px;
          gap: 8px;
          min-width: fit-content;
        }
        
        .ticker-separator {
          color: #6b7280;
          margin-left: 8px;
          margin-right: 8px;
          user-select: none;
        }
        
        @keyframes scroll-left {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .ticker-content:hover {
          animation-play-state: paused;
        }
        
        @media (max-width: 768px) {
          .ticker-item {
            margin-right: 24px;
            gap: 6px;
          }
          
          .ticker-item span {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}