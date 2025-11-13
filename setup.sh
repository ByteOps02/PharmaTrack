#!/bin/bash

# MedFlow Setup Script
set -e

echo "🏥 MedFlow Setup Script"
echo "====================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Some features will not work."
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Create env files if they don't exist
echo "Setting up environment files..."
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local"
else
    echo "ℹ️  .env.local already exists"
fi

if [ ! -f "backend/.env.local" ]; then
    cp backend/.env.example backend/.env.local
    echo "✅ Created backend/.env.local"
else
    echo "ℹ️  backend/.env.local already exists"
fi

echo ""
echo "Installing dependencies..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in .env.local and backend/.env.local"
echo "2. Start with Docker: npm run docker:up"
echo "   OR start locally:"
echo "   - Terminal 1: npm run backend:dev"
echo "   - Terminal 2: npm run dev"
echo ""
echo "Frontend will be available at http://localhost:5173"
echo "Backend API will be available at http://localhost:3001"
