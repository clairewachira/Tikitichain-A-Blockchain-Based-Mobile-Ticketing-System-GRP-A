#!/bin/bash

# Tikiti Chain Admin Dashboard - Quick Setup Script

echo "🎯 Tikiti Chain Admin Dashboard - Setup"
echo "======================================="
echo ""

# Check if bun is installed
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    echo "✅ Using Bun package manager"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo "✅ Using npm package manager"
else
    echo "❌ Error: Neither bun nor npm is installed"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
$PKG_MANAGER install

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "✅ .env.local created from example"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local with your Supabase credentials"
    echo ""
    read -p "Enter your Supabase URL: " SUPABASE_URL
    read -p "Enter your Supabase Anon Key: " SUPABASE_KEY

    # Update .env.local
    sed -i "" "s|your_supabase_url|$SUPABASE_URL|g" .env.local 2>/dev/null || sed -i "s|your_supabase_url|$SUPABASE_URL|g" .env.local
    sed -i "" "s|your_supabase_anon_key|$SUPABASE_KEY|g" .env.local 2>/dev/null || sed -i "s|your_supabase_anon_key|$SUPABASE_KEY|g" .env.local

    echo "✅ Environment variables configured"
else
    echo "ℹ️  .env.local already exists - skipping creation"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📖 Next Steps:"
echo ""
echo "1. Start the development server:"
echo "   $PKG_MANAGER dev"
echo ""
echo "2. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "3. For production deployment:"
echo "   - Vercel: vercel --prod"
echo "   - Netlify: netlify deploy --prod"
echo "   - Railway: railway up"
echo ""
echo "📚 Full documentation: README.md"
echo ""
