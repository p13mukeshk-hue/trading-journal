import { MarketData, ChartData } from '@/types/trading';

// Market data provider interface
interface MarketDataProvider {
  getQuote(symbol: string): Promise<MarketData>;
  getChart(symbol: string, timeframe: string): Promise<ChartData[]>;
  searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; type: string }>>;
}

// Alpha Vantage provider
class AlphaVantageProvider implements MarketDataProvider {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(symbol: string): Promise<MarketData> {
    const response = await fetch(
      `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote) {
      throw new Error(`No quote data found for ${symbol}`);
    }
    
    return {
      symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      timestamp: new Date(),
    };
  }

  async getChart(symbol: string, timeframe: string = 'daily'): Promise<ChartData[]> {
    let func = 'TIME_SERIES_DAILY';
    
    switch (timeframe) {
      case 'intraday':
        func = 'TIME_SERIES_INTRADAY';
        break;
      case 'weekly':
        func = 'TIME_SERIES_WEEKLY';
        break;
      case 'monthly':
        func = 'TIME_SERIES_MONTHLY';
        break;
    }
    
    const response = await fetch(
      `${this.baseUrl}?function=${func}&symbol=${symbol}&apikey=${this.apiKey}${
        func === 'TIME_SERIES_INTRADAY' ? '&interval=5min' : ''
      }`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chart data for ${symbol}`);
    }
    
    const data = await response.json();
    let timeSeries;
    
    if (func === 'TIME_SERIES_INTRADAY') {
      timeSeries = data['Time Series (5min)'];
    } else if (func === 'TIME_SERIES_WEEKLY') {
      timeSeries = data['Weekly Time Series'];
    } else if (func === 'TIME_SERIES_MONTHLY') {
      timeSeries = data['Monthly Time Series'];
    } else {
      timeSeries = data['Time Series (Daily)'];
    }
    
    if (!timeSeries) {
      throw new Error(`No chart data found for ${symbol}`);
    }
    
    return Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
      timestamp: new Date(timestamp),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    const response = await fetch(
      `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to search symbols for ${query}`);
    }
    
    const data = await response.json();
    const matches = data.bestMatches || [];
    
    return matches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
    }));
  }
}

// IEX Cloud provider
class IEXCloudProvider implements MarketDataProvider {
  private apiKey: string;
  private baseUrl: 'https://cloud.iexapis.com/stable';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://cloud.iexapis.com/stable';
  }

  async getQuote(symbol: string): Promise<MarketData> {
    const response = await fetch(
      `${this.baseUrl}/stock/${symbol}/quote?token=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    
    const data = await response.json();
    
    return {
      symbol: data.symbol,
      price: data.latestPrice,
      change: data.change,
      changePercent: data.changePercent * 100,
      volume: data.latestVolume,
      high: data.high,
      low: data.low,
      open: data.open,
      previousClose: data.previousClose,
      timestamp: new Date(data.latestUpdate),
    };
  }

  async getChart(symbol: string, timeframe: string = '1m'): Promise<ChartData[]> {
    const response = await fetch(
      `${this.baseUrl}/stock/${symbol}/chart/${timeframe}?token=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chart data for ${symbol}`);
    }
    
    const data = await response.json();
    
    return data.map((point: any) => ({
      timestamp: new Date(point.date + (point.minute ? ` ${point.minute}` : '')),
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
    }));
  }

  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    const response = await fetch(
      `${this.baseUrl}/search/${query}?token=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to search symbols for ${query}`);
    }
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      symbol: item.symbol,
      name: item.securityName,
      type: item.securityType,
    }));
  }
}

// Finnhub provider for additional data
class FinnhubProvider implements MarketDataProvider {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(symbol: string): Promise<MarketData> {
    const response = await fetch(
      `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    
    const data = await response.json();
    
    return {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      volume: 0, // Not provided in basic quote
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: new Date(data.t * 1000),
    };
  }

  async getChart(symbol: string, resolution: string = 'D'): Promise<ChartData[]> {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (365 * 24 * 60 * 60); // 1 year ago
    
    const response = await fetch(
      `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chart data for ${symbol}`);
    }
    
    const data = await response.json();
    
    if (data.s !== 'ok') {
      throw new Error(`No chart data available for ${symbol}`);
    }
    
    return data.t.map((timestamp: number, index: number) => ({
      timestamp: new Date(timestamp * 1000),
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index],
    }));
  }

  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    const response = await fetch(
      `${this.baseUrl}/search?q=${query}&token=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to search symbols for ${query}`);
    }
    
    const data = await response.json();
    
    return data.result.map((item: any) => ({
      symbol: item.symbol,
      name: item.description,
      type: item.type,
    }));
  }
}

// Market data service with fallback providers
export class MarketDataService {
  private providers: MarketDataProvider[] = [];

  constructor() {
    // Initialize providers based on available API keys
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      this.providers.push(new AlphaVantageProvider(process.env.ALPHA_VANTAGE_API_KEY));
    }
    
    if (process.env.IEX_CLOUD_API_KEY) {
      this.providers.push(new IEXCloudProvider(process.env.IEX_CLOUD_API_KEY));
    }
    
    if (process.env.FINNHUB_API_KEY) {
      this.providers.push(new FinnhubProvider(process.env.FINNHUB_API_KEY));
    }
  }

  async getQuote(symbol: string): Promise<MarketData> {
    const errors: Error[] = [];
    
    for (const provider of this.providers) {
      try {
        return await provider.getQuote(symbol);
      } catch (error) {
        errors.push(error as Error);
        continue;
      }
    }
    
    throw new Error(`Failed to fetch quote for ${symbol} from all providers: ${errors.map(e => e.message).join(', ')}`);
  }

  async getChart(symbol: string, timeframe: string = 'daily'): Promise<ChartData[]> {
    const errors: Error[] = [];
    
    for (const provider of this.providers) {
      try {
        return await provider.getChart(symbol, timeframe);
      } catch (error) {
        errors.push(error as Error);
        continue;
      }
    }
    
    throw new Error(`Failed to fetch chart data for ${symbol} from all providers: ${errors.map(e => e.message).join(', ')}`);
  }

  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    const errors: Error[] = [];
    
    for (const provider of this.providers) {
      try {
        return await provider.searchSymbols(query);
      } catch (error) {
        errors.push(error as Error);
        continue;
      }
    }
    
    throw new Error(`Failed to search symbols for ${query} from all providers: ${errors.map(e => e.message).join(', ')}`);
  }

  async getMultipleQuotes(symbols: string[]): Promise<MarketData[]> {
    const quotes = await Promise.allSettled(
      symbols.map(symbol => this.getQuote(symbol))
    );
    
    return quotes
      .filter((result): result is PromiseFulfilledResult<MarketData> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  isAvailable(): boolean {
    return this.providers.length > 0;
  }
}

export const marketDataService = new MarketDataService();

// WebSocket service for real-time updates
export class RealTimeMarketData {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private listeners = new Map<string, ((data: MarketData) => void)[]>();

  connect() {
    if (!process.env.FINNHUB_API_KEY) return;

    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Re-subscribe to all symbols
      this.subscriptions.forEach(symbol => {
        this.subscribeToSymbol(symbol);
      });
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'trade') {
          data.data.forEach((trade: any) => {
            const marketData: MarketData = {
              symbol: trade.s,
              price: trade.p,
              change: 0, // Would need to calculate
              changePercent: 0, // Would need to calculate
              volume: trade.v,
              high: 0, // Not available in real-time trade data
              low: 0,
              open: 0,
              previousClose: 0,
              timestamp: new Date(trade.t),
            };
            
            this.notifyListeners(trade.s, marketData);
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(() => this.connect(), 5000);
    };
  }

  subscribeToSymbol(symbol: string) {
    if (!this.ws) return;
    
    this.subscriptions.add(symbol);
    this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
  }

  unsubscribeFromSymbol(symbol: string) {
    if (!this.ws) return;
    
    this.subscriptions.delete(symbol);
    this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
  }

  addListener(symbol: string, callback: (data: MarketData) => void) {
    if (!this.listeners.has(symbol)) {
      this.listeners.set(symbol, []);
    }
    this.listeners.get(symbol)!.push(callback);
  }

  removeListener(symbol: string, callback: (data: MarketData) => void) {
    const listeners = this.listeners.get(symbol);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(symbol: string, data: MarketData) {
    const listeners = this.listeners.get(symbol);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realTimeMarketData = new RealTimeMarketData();