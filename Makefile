.PHONY: help setup install dev build backend-dev backend-build docker-up docker-down docker-build clean

help:
	@echo "MedFlow - Medical Records Management System"
	@echo ""
	@echo "Available commands:"
	@echo "  make setup           - Initial setup (install dependencies)"
	@echo "  make install         - Install dependencies"
	@echo "  make dev             - Start frontend development server"
	@echo "  make build           - Build frontend for production"
	@echo "  make backend-dev     - Start backend development server"
	@echo "  make backend-build   - Build backend for production"
	@echo "  make docker-up       - Start all services with Docker"
	@echo "  make docker-down     - Stop all Docker services"
	@echo "  make docker-build    - Build Docker images"
	@echo "  make clean           - Clean build artifacts and node_modules"
	@echo "  make db-migrate      - Run database migrations"
	@echo "  make db-studio       - Open Drizzle Studio"

setup:
	@echo "Setting up MedFlow..."
	@cp -n .env.example .env.local || true
	@cp -n backend/.env.example backend/.env.local || true
	@npm install
	@cd backend && npm install && cd ..
	@echo "Setup complete!"

install:
	@echo "Installing dependencies..."
	@npm install
	@cd backend && npm install && cd ..

dev:
	@npm run dev

build:
	@npm run build

backend-dev:
	@cd backend && npm run dev

backend-build:
	@cd backend && npm run build

docker-up:
	@docker-compose up -d
	@echo "MedFlow is running!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:3001"

docker-down:
	@docker-compose down

docker-build:
	@docker-compose build

db-migrate:
	@cd backend && npm run drizzle:generate && npm run drizzle:push

db-studio:
	@cd backend && npm run drizzle:studio

clean:
	@echo "Cleaning up..."
	@rm -rf dist
	@rm -rf backend/dist
	@rm -rf node_modules
	@rm -rf backend/node_modules
	@echo "Clean complete!"

.DEFAULT_GOAL := help
