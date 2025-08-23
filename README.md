# Professional Trading Journal 📈

A comprehensive, production-ready trading journal application built with Next.js, TypeScript, and modern web technologies. Track, analyze, and improve your trading performance with advanced analytics and professional-grade features similar to Tradezella.

![Trading Journal Dashboard](public/screenshot-dashboard.png)

## 🚀 Features

### Core Trading Journal Features
- **Trade Entry & Management**: Comprehensive trade entry form with real-time calculations
- **Multi-Asset Support**: Stocks, Forex, Crypto, Options, Futures, and Commodities
- **Advanced Risk Management**: Stop loss, take profit, position sizing, and R-Multiple tracking
- **Tag System**: Organize trades by setups, strategies, and market conditions
- **Screenshot Uploads**: Attach chart images for visual trade analysis
- **Bulk CSV Import**: Import trades from brokers or existing spreadsheets

### Advanced Analytics & Reporting
- **Performance Dashboard**: Total P&L, Win Rate, Profit Factor, Sharpe Ratio, Maximum Drawdown
- **Interactive Equity Curve**: Real-time portfolio tracking with drawdown visualization
- **Calendar Heat Maps**: Performance analysis by time periods
- **Trade Distribution Analysis**: Win/loss streaks and profit distribution charts
- **Risk Metrics**: Position sizing analysis, portfolio heat, correlation tracking
- **Setup Analysis**: Performance breakdown by trading strategies
- **Time-based Analysis**: Performance by hour, day, week, and market sessions

### Professional Charting & Visualization
- **Interactive Charts**: Built with Recharts for smooth, responsive visualizations
- **Multiple Chart Types**: Line charts, bar charts, pie charts, scatter plots, heat maps
- **Real-time Updates**: Live P&L tracking during market hours
- **Export Capabilities**: PDF reports, Excel exports, chart images

### Modern User Experience
- **Dark/Light Theme**: Customizable appearance with system theme detection
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile
- **Professional UI**: Clean, modern interface inspired by Tradezella
- **Fast Performance**: Optimized with Next.js App Router and React Server Components

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Recharts for interactive visualizations
- **Forms**: React Hook Form with Zod validation
- **File Upload**: React Dropzone with cloud storage integration
- **State Management**: React hooks with server state management

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multiple providers
- **Validation**: Zod schema validation
- **File Storage**: AWS S3 / Cloudinary integration
- **Real-time**: WebSocket support for live updates

### Infrastructure
- **Database**: PostgreSQL (production) / SQLite (development)
- **Caching**: Redis for session management and caching
- **Deployment**: Vercel, AWS, or Docker containerization
- **Monitoring**: Built-in analytics and error tracking

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Optional: Redis for caching

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/trading-journal.git
cd trading-journal
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment setup**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/trading_journal"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Market Data APIs (Optional)
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
IEX_CLOUD_API_KEY="your-iex-cloud-key"

# File Upload (Optional)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
```

4. **Database setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Seed with sample data
npx prisma db seed
```

5. **Start development server**
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to see your trading journal in action!

## 🔧 Configuration

### Database Schema
The application uses a comprehensive database schema designed for professional trading applications:

- **Users**: Profile, preferences, and risk settings
- **Trades**: Complete trade lifecycle with calculated metrics
- **Portfolios**: Multi-account support with performance tracking
- **Setups**: Trading strategy templates and analysis
- **Tags**: Flexible categorization system
- **Screenshots**: Chart image management
- **Goals**: Performance targets and milestone tracking

### API Endpoints

#### Trades API
```
GET    /api/trades              # Get trades with filtering and pagination
POST   /api/trades              # Create a new trade
GET    /api/trades/[id]         # Get specific trade
PUT    /api/trades/[id]         # Update trade
DELETE /api/trades/[id]         # Delete trade
GET    /api/trades/analytics     # Get performance analytics
POST   /api/trades/import       # Bulk import from CSV
```

#### Market Data API
```
GET    /api/market/quote/[symbol]    # Get real-time quote
GET    /api/market/chart/[symbol]    # Get historical chart data
GET    /api/market/search           # Symbol search
```

### CSV Import Format
The application supports importing trades from CSV files with the following columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| symbol | Yes | Trading symbol | AAPL, EURUSD |
| side | Yes | LONG or SHORT | LONG |
| assetClass | Yes | Asset type | STOCK, FOREX, CRYPTO |
| entryDate | Yes | Entry date/time | 2024-01-15 09:30:00 |
| entryPrice | Yes | Entry price | 150.00 |
| quantity | Yes | Position size | 100 |
| exitDate | No | Exit date/time | 2024-01-15 15:30:00 |
| exitPrice | No | Exit price | 155.00 |
| stopLoss | No | Stop loss price | 145.00 |
| takeProfit | No | Take profit price | 160.00 |
| riskAmount | No | Amount risked | 500.00 |
| notes | No | Trade notes | Breakout setup |

## 📊 Key Metrics & Calculations

The application automatically calculates comprehensive trading metrics:

### Performance Metrics
- **Total P&L**: Absolute and percentage returns
- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Ratio of total wins to total losses
- **Expectancy**: Average profit per trade
- **Sharpe Ratio**: Risk-adjusted returns
- **Maximum Drawdown**: Largest peak-to-trough decline

### Risk Metrics
- **R-Multiple**: Actual return vs. initial risk
- **Position Sizing**: Percentage of portfolio per trade
- **Portfolio Heat**: Total risk exposure
- **Correlation Analysis**: Position correlation tracking

### Time Analysis
- **Trade Duration**: Average holding periods
- **Market Session Performance**: Analysis by trading hours
- **Day of Week Analysis**: Performance patterns by day
- **Monthly Performance**: Consistency tracking

## 🎨 Customization

### Theme Customization
The application uses a custom Tailwind CSS theme that can be modified in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* Custom primary colors */ },
      success: { /* Success/profit colors */ },
      danger: { /* Error/loss colors */ },
    }
  }
}
```

### Adding Custom Metrics
Extend the analytics by modifying the metrics calculation in `/api/trades/analytics`:

```typescript
// Add custom metric calculation
const customMetric = trades.reduce((acc, trade) => {
  // Your calculation logic
  return acc;
}, 0);
```

### Custom Chart Types
Add new chart components in `/components/charts/` using the Recharts library:

```typescript
import { LineChart, Line, XAxis, YAxis } from 'recharts';

export function CustomChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Line dataKey="value" stroke="#3b82f6" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## 🔒 Security Features

- **Authentication**: Secure user authentication with NextAuth.js
- **Data Validation**: Server-side validation with Zod schemas
- **SQL Injection Protection**: Prisma ORM with prepared statements
- **CORS Protection**: Configured for production deployment
- **Environment Variables**: Sensitive data stored securely
- **Rate Limiting**: API endpoint protection (configurable)

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```bash
# Build the Docker image
docker build -t trading-journal .

# Run the container
docker run -p 3000:3000 trading-journal
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

## 📈 Performance Optimization

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Redis caching for frequently accessed data
- **Database Optimization**: Indexed queries and efficient relations
- **CDN**: Static assets served via CDN

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by professional trading platforms like Tradezella
- Built with modern React and Next.js best practices
- Uses industry-standard financial calculations and metrics
- Designed for scalability and professional use

## 📞 Support

- 📧 Email: support@trading-journal.app
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/trading-journal/issues)
- 📚 Documentation: [Wiki](https://github.com/yourusername/trading-journal/wiki)
- 💬 Discord: [Join our community](https://discord.gg/trading-journal)

---

**Start tracking your trades like a pro!** 🚀📊