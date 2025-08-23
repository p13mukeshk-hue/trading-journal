# Trading Journal - Complete Setup Guide 🚀

This guide will walk you through setting up your professional trading journal application from scratch to production deployment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Market Data APIs](#market-data-apis)
6. [Authentication Setup](#authentication-setup)
7. [File Storage Configuration](#file-storage-configuration)
8. [Email Configuration](#email-configuration)
9. [Development Commands](#development-commands)
10. [Production Deployment](#production-deployment)
11. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js 18.0 or later
- npm 9.0 or later (or yarn 1.22+)
- Git
- PostgreSQL 13+ (for production) or SQLite (for development)

### Optional but Recommended
- Redis 6.0+ (for caching and sessions)
- Docker Desktop (for containerized deployment)

### Development Tools
- Visual Studio Code with recommended extensions:
  - TypeScript
  - Tailwind CSS IntelliSense
  - Prisma
  - ES7+ React/Redux/React-Native snippets

## Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/trading-journal.git
cd trading-journal
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Install Recommended VS Code Extensions
```bash
code --install-extension bradlc.vscode-tailwindcss
code --install-extension Prisma.prisma
code --install-extension ms-vscode.vscode-typescript-next
```

## Database Configuration

### Option 1: SQLite (Development - Easiest)
For quick development setup, SQLite is included and requires no additional configuration.

```bash
# Your .env.local file
DATABASE_URL="file:./dev.db"
```

### Option 2: PostgreSQL (Recommended for Production)

#### Local PostgreSQL
1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. Create database and user:
   ```bash
   sudo -u postgres createuser --interactive --pwprompt tradingjournal
   sudo -u postgres createdb -O tradingjournal trading_journal
   ```

3. Update `.env.local`:
   ```env
   DATABASE_URL="postgresql://tradingjournal:yourpassword@localhost:5432/trading_journal"
   ```

#### Cloud PostgreSQL (Production)
Popular options:
- **Supabase** (Free tier available)
- **PlanetScale** (Excellent for scalability)
- **Railway** (Simple deployment)
- **AWS RDS** (Enterprise)
- **Google Cloud SQL** (Enterprise)

Example Supabase setup:
```env
DATABASE_URL="postgresql://postgres:yourpassword@db.yourproject.supabase.co:5432/postgres"
```

### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Push database schema (development)
npx prisma db push

# Or run migrations (production)
npx prisma migrate deploy

# Seed database with sample data (optional)
npm run db:seed
```

## Environment Variables

Create `.env.local` file in your project root:

```env
# Core Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars-long"

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/trading_journal"

# Market Data APIs (Choose at least one)
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-api-key"
IEX_CLOUD_API_KEY="your-iex-cloud-api-key"
FINNHUB_API_KEY="your-finnhub-api-key"

# File Upload (Optional)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
# OR
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="trading-journal-uploads"

# Email Service (Optional)
SENDGRID_API_KEY="your-sendgrid-api-key"
# OR
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Caching (Optional)
REDIS_URL="redis://localhost:6379"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Analytics (Optional)
GOOGLE_ANALYTICS_ID="GA_MEASUREMENT_ID"
MIXPANEL_PROJECT_TOKEN="your-mixpanel-token"
```

## Market Data APIs

### Alpha Vantage (Free tier: 5 requests/minute, 500/day)
1. Sign up at https://www.alphavantage.co/support/#api-key
2. Get your free API key
3. Add to `.env.local`:
   ```env
   ALPHA_VANTAGE_API_KEY="your-api-key-here"
   ```

### IEX Cloud (Free tier: 50,000 requests/month)
1. Sign up at https://iexcloud.io/
2. Get your API token
3. Add to `.env.local`:
   ```env
   IEX_CLOUD_API_KEY="pk_your-publishable-key"
   ```

### Finnhub (Free tier: 60 requests/minute)
1. Sign up at https://finnhub.io/
2. Get your API key
3. Add to `.env.local`:
   ```env
   FINNHUB_API_KEY="your-api-key-here"
   ```

### Testing Market Data
```bash
# Test API endpoints
curl "http://localhost:3000/api/market/quote/AAPL"
curl "http://localhost:3000/api/market/search?q=Apple"
curl "http://localhost:3000/api/market/chart/AAPL?timeframe=daily&period=1m"
```

## Authentication Setup

### NextAuth.js Configuration
The app uses NextAuth.js for authentication with multiple provider support.

#### Email/Password (Default)
No additional setup required - works out of the box.

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Add to `.env.local`:
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Add to `.env.local`:
   ```env
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   ```

## File Storage Configuration

### Option 1: Cloudinary (Recommended - Free tier available)
1. Sign up at https://cloudinary.com/
2. Get your cloud name, API key, and API secret
3. Add to `.env.local`:
   ```env
   CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
   ```

### Option 2: AWS S3
1. Create AWS account and S3 bucket
2. Create IAM user with S3 permissions
3. Add to `.env.local`:
   ```env
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="us-east-1"
   S3_BUCKET_NAME="your-bucket-name"
   ```

### Option 3: Local Storage (Development only)
No configuration needed - files stored in `public/uploads/`

## Email Configuration

### Option 1: SendGrid (Recommended)
1. Sign up at https://sendgrid.com/
2. Create API key with Mail Send permissions
3. Add to `.env.local`:
   ```env
   SENDGRID_API_KEY="SG.your-api-key"
   ```

### Option 2: Gmail SMTP
1. Enable 2-Factor Authentication on your Google account
2. Generate App Password for "Mail"
3. Add to `.env.local`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-character-app-password"
   ```

## Development Commands

### Start Development Server
```bash
npm run dev
# or
yarn dev
```
Visit http://localhost:3000

### Database Operations
```bash
# View database in browser
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset

# Generate new migration
npx prisma migrate dev --name add-new-feature

# View database schema
npx prisma db pull
```

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Build and Production
```bash
# Build for production
npm run build

# Start production server
npm run start

# Analyze bundle size
npm run analyze
```

## Production Deployment

### Option 1: Vercel (Recommended - Easiest)
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Add environment variables in Vercel dashboard

4. Connect your domain (optional)

### Option 2: Railway
1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

### Option 3: Docker + Any Provider
1. Build Docker image:
   ```bash
   docker build -t trading-journal .
   ```

2. Run locally:
   ```bash
   docker run -p 3000:3000 --env-file .env.local trading-journal
   ```

3. Deploy to any Docker hosting service

### Option 4: Self-hosted (VPS)
1. Set up Node.js, PostgreSQL, and Redis on your server
2. Clone repository and install dependencies
3. Set up reverse proxy (Nginx)
4. Configure SSL certificate (Let's Encrypt)
5. Set up PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics configured
- [ ] Backup strategy implemented
- [ ] CDN configured for static assets

## Troubleshooting

### Common Issues

#### "Database connection failed"
- Check DATABASE_URL format
- Ensure database server is running
- Verify credentials and network access
- Run `npx prisma db push` to sync schema

#### "API key errors with market data"
- Verify API keys are correct and active
- Check API rate limits
- Ensure environment variables are loaded
- Test API keys with curl commands

#### "Build fails with TypeScript errors"
- Run `npm run type-check` for detailed errors
- Ensure all dependencies are installed
- Clear `.next` folder and rebuild

#### "Styles not loading correctly"
- Ensure Tailwind CSS is properly configured
- Check for conflicting CSS
- Clear browser cache

#### "Authentication not working"
- Verify NEXTAUTH_SECRET is set and secure
- Check OAuth provider configuration
- Ensure callback URLs match exactly

### Debug Mode
Enable debug logging by adding to `.env.local`:
```env
DEBUG=1
NEXTAUTH_DEBUG=true
```

### Performance Issues
- Enable Redis caching
- Optimize database queries
- Use CDN for static assets
- Enable Next.js image optimization
- Monitor Core Web Vitals

### Getting Help
- Check the [GitHub Issues](https://github.com/yourusername/trading-journal/issues)
- Join our [Discord Community](https://discord.gg/trading-journal)
- Review the [API Documentation](./API.md)
- Search [Stack Overflow](https://stackoverflow.com/questions/tagged/trading-journal)

### Monitoring and Alerts
Set up monitoring for:
- Database performance
- API response times
- Error rates
- User activity
- Server resources

Recommended tools:
- Sentry (error tracking)
- Vercel Analytics (web vitals)
- Mixpanel (user analytics)
- Uptime Robot (uptime monitoring)

## Next Steps

After successful setup:
1. Create your first trade entries
2. Import historical data via CSV
3. Explore the analytics dashboard
4. Set up performance goals
5. Customize the interface to your needs
6. Connect broker APIs (if available)
7. Set up automated backups
8. Invite team members (if applicable)

## Support

Need help? Here are your options:
- 📧 Email: support@trading-journal.app
- 💬 Discord: [Join Community](https://discord.gg/trading-journal)
- 🐛 GitHub Issues: Report bugs and feature requests
- 📚 Documentation: Full API and component docs
- 🎥 Video Tutorials: Step-by-step setup guides

---

**Happy Trading!** 📈💰