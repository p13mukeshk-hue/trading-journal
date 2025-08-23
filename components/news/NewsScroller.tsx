'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Zap, 
  Globe, 
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: 'crypto' | 'stocks' | 'forex' | 'commodities' | 'macro' | 'earnings';
  impact: 'high' | 'medium' | 'low';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
  affectedAssets: string[];
  source: string;
}

export function NewsScroller() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/news');
        
        if (response.ok) {
          const data = await response.json();
          setNews(data.news || []);
        } else {
          // Fallback to demo data
          setNews(getDemoNews());
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews(getDemoNews());
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchNews();

    // Update news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <Zap className="w-3 h-3" />;
      case 'medium': return <AlertTriangle className="w-3 h-3" />;
      case 'low': return <Clock className="w-3 h-3" />;
      default: return <Globe className="w-3 h-3" />;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-3 h-3" />;
      case 'bearish': return <TrendingDown className="w-3 h-3" />;
      default: return <ArrowRight className="w-3 h-3" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'crypto': return 'bg-orange-600';
      case 'stocks': return 'bg-blue-600';
      case 'forex': return 'bg-green-600';
      case 'commodities': return 'bg-yellow-600';
      case 'macro': return 'bg-purple-600';
      case 'earnings': return 'bg-pink-600';
      default: return 'bg-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-4">
          <div className="animate-pulse flex space-x-6">
            <div className="flex items-center space-x-2">
              <div className="h-3 bg-gray-700 rounded w-8"></div>
              <div className="h-3 bg-gray-700 rounded w-32"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 bg-gray-700 rounded w-8"></div>
              <div className="h-3 bg-gray-700 rounded w-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700 overflow-hidden">
      <div className="news-container">
        <div className="news-content">
          {/* Render news items twice for seamless loop */}
          {[...news, ...news].map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              className="news-item"
            >
              {/* Time badge */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(item.timestamp)}
                </span>
              </div>

              {/* Category badge */}
              <div className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getCategoryColor(item.category)}`}>
                {item.category.toUpperCase()}
              </div>

              {/* Impact indicator */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(item.impact)}`}>
                {getImpactIcon(item.impact)}
                <span>{item.impact.toUpperCase()}</span>
              </div>

              {/* Sentiment indicator */}
              <div className={`flex items-center space-x-1 ${getSentimentColor(item.sentiment)}`}>
                {getSentimentIcon(item.sentiment)}
              </div>

              {/* Headline */}
              <div className="text-white font-medium text-sm">
                {item.headline}
              </div>

              {/* Affected assets */}
              {item.affectedAssets.length > 0 && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-300">
                    {item.affectedAssets.slice(0, 3).join(', ')}
                    {item.affectedAssets.length > 3 && `+${item.affectedAssets.length - 3}`}
                  </span>
                </div>
              )}

              {/* Source */}
              <span className="text-xs text-gray-500">
                — {item.source}
              </span>

              {/* Separator */}
              <div className="news-separator">•</div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .news-container {
          white-space: nowrap;
          overflow: hidden;
          padding: 12px 0;
        }
        
        .news-content {
          display: inline-block;
          animation: scroll-news 180s linear infinite;
          will-change: transform;
        }
        
        .news-item {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-right: 40px;
          min-width: fit-content;
          padding: 0 8px;
        }
        
        .news-separator {
          color: #6b7280;
          margin-left: 8px;
          margin-right: 8px;
          user-select: none;
        }
        
        @keyframes scroll-news {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .news-content:hover {
          animation-play-state: paused;
        }
        
        @media (max-width: 768px) {
          .news-item {
            gap: 8px;
            margin-right: 32px;
          }
          
          .news-item > div,
          .news-item > span {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

// Demo news data with realistic market-moving events
function getDemoNews(): NewsItem[] {
  const baseTime = new Date();
  
  return [
    {
      id: '1',
      headline: 'Fed Chair Powell hints at potential rate cut in December meeting',
      summary: 'Federal Reserve Chairman suggests monetary policy may become less restrictive',
      category: 'macro',
      impact: 'high',
      sentiment: 'bullish',
      timestamp: new Date(baseTime.getTime() - 15 * 60 * 1000).toISOString(),
      affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD'],
      source: 'Reuters'
    },
    {
      id: '2',
      headline: 'Apple reports stronger than expected iPhone sales in China',
      summary: 'Q4 revenue from Greater China region up 15% year-over-year',
      category: 'earnings',
      impact: 'medium',
      sentiment: 'bullish',
      timestamp: new Date(baseTime.getTime() - 32 * 60 * 1000).toISOString(),
      affectedAssets: ['AAPL'],
      source: 'Bloomberg'
    },
    {
      id: '3',
      headline: 'Bitcoin ETF sees record $2.1B inflow as institutional adoption grows',
      summary: 'Major asset managers increasing crypto allocations amid regulatory clarity',
      category: 'crypto',
      impact: 'high',
      sentiment: 'bullish',
      timestamp: new Date(baseTime.getTime() - 45 * 60 * 1000).toISOString(),
      affectedAssets: ['BTC', 'ETH'],
      source: 'CoinDesk'
    },
    {
      id: '4',
      headline: 'Oil prices surge 3% on unexpected inventory draw and geopolitical tensions',
      summary: 'Crude oil inventories fall by 5.2M barrels vs expected build of 1.8M',
      category: 'commodities',
      impact: 'medium',
      sentiment: 'bullish',
      timestamp: new Date(baseTime.getTime() - 67 * 60 * 1000).toISOString(),
      affectedAssets: ['OIL', 'USO'],
      source: 'MarketWatch'
    },
    {
      id: '5',
      headline: 'Nifty 50 reaches new all-time high on strong Q3 earnings and FII inflows',
      summary: 'Index gains 2.1% as foreign institutional investors return to Indian markets',
      category: 'stocks',
      impact: 'medium',
      sentiment: 'bullish',
      timestamp: new Date(baseTime.getTime() - 89 * 60 * 1000).toISOString(),
      affectedAssets: ['NIFTY', 'SENSEX'],
      source: 'Economic Times'
    },
    {
      id: '6',
      headline: 'NVIDIA beats Q4 earnings expectations, guides higher for AI chip demand',
      summary: 'Data center revenue up 206% YoY, company raises forward guidance',
      category: 'earnings',
      impact: 'high',
      sentiment: 'bullish',
      timestamp: new Date(baseTime.getTime() - 112 * 60 * 1000).toISOString(),
      affectedAssets: ['NVDA', 'AMD', 'TSM'],
      source: 'CNBC'
    },
    {
      id: '7',
      headline: 'Treasury yields fall as inflation data comes in below expectations',
      summary: 'Core CPI rises 0.2% MoM vs 0.3% expected, annual rate slows to 3.8%',
      category: 'macro',
      impact: 'high',
      sentiment: 'bullish',
      timestamp: new Date(baseTime.getTime() - 134 * 60 * 1000).toISOString(),
      affectedAssets: ['TLT', 'SPY', 'QQQ'],
      source: 'Financial Times'
    },
    {
      id: '8',
      headline: 'Gold hits $2,100/oz on safe-haven demand amid banking sector concerns',
      summary: 'Precious metals rally as investors seek refuge from financial instability',
      category: 'commodities',
      impact: 'medium',
      sentiment: 'neutral',
      timestamp: new Date(baseTime.getTime() - 156 * 60 * 1000).toISOString(),
      affectedAssets: ['GOLD', 'SILVER', 'GLD'],
      source: 'Kitco News'
    },
    {
      id: '9',
      headline: 'Tesla stock down 4% on production miss and delivery concerns',
      summary: 'Q4 vehicle deliveries fall short of analyst estimates by 8%',
      category: 'earnings',
      impact: 'medium',
      sentiment: 'bearish',
      timestamp: new Date(baseTime.getTime() - 178 * 60 * 1000).toISOString(),
      affectedAssets: ['TSLA', 'EV sector'],
      source: 'TechCrunch'
    },
    {
      id: '10',
      headline: 'Dollar strengthens on hawkish Fed comments, emerging markets under pressure',
      summary: 'DXY index rises 0.8% as rate cut expectations pushed back to Q2 2024',
      category: 'forex',
      impact: 'medium',
      sentiment: 'bearish',
      timestamp: new Date(baseTime.getTime() - 201 * 60 * 1000).toISOString(),
      affectedAssets: ['DXY', 'EUR/USD', 'GBP/USD'],
      source: 'FX Street'
    }
  ];
}