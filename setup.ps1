# MedFlow Setup Script for Windows
Write-Host "🏥 MedFlow Setup Script" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
    Write-Host "⚠️  Docker is not installed. Some features will not work." -ForegroundColor Yellow
}

Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Create env files if they don't exist
Write-Host "Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ Created .env.local" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env.local already exists" -ForegroundColor Cyan
}

if (-not (Test-Path "backend/.env.local")) {
    Copy-Item "backend/.env.example" "backend/.env.local"
    Write-Host "✅ Created backend/.env.local" -ForegroundColor Green
} else {
    Write-Host "ℹ️  backend/.env.local already exists" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Cyan
npm install

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
Push-Location backend
npm install
Pop-Location

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update environment variables in .env.local and backend/.env.local"
Write-Host "2. Start with Docker: npm run docker:up"
Write-Host "   OR start locally:"
Write-Host "   - Terminal 1: npm run backend:dev"
Write-Host "   - Terminal 2: npm run dev"
Write-Host ""
Write-Host "Frontend will be available at http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API will be available at http://localhost:3001" -ForegroundColor Cyan
