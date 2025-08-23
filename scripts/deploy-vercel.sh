#!/bin/bash

echo "🚀 Trading Journal - Vercel Deployment Script"
echo "=============================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the application to check for errors
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Generate NextAuth secret if not exists
if [ ! -f .env.local ]; then
    echo "🔐 Generating NextAuth secret..."
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" > .env.local
    echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
    echo "📝 Created .env.local - Update NEXTAUTH_URL after deployment!"
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set NEXTAUTH_URL to your deployed URL in Vercel dashboard"
echo "2. Add DATABASE_URL if using a database"
echo "3. Test your deployed application"
echo ""
echo "🔗 Manage your deployment: https://vercel.com/dashboard"