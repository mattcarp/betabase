# 🚀 SIAM Docker Makefile - One command to rule them all!

.PHONY: help dev prod build clean logs shell test lint format

# Default target
.DEFAULT_GOAL := help

# Colors for pretty output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

help: ## 📋 Show this help message
	@echo "$(BLUE)🚀 SIAM Docker Commands$(NC)"
	@echo "$(YELLOW)═══════════════════════════════════════$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# Development commands
dev: ## 🔥 Start development environment (hot reload)
	@echo "$(YELLOW)🔥 Starting SIAM in development mode...$(NC)"
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-bg: ## 🌙 Start development in background
	@echo "$(YELLOW)🌙 Starting SIAM in background...$(NC)"
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Production commands
prod: ## 🏭 Start production environment
	@echo "$(BLUE)🏭 Starting SIAM in production mode...$(NC)"
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up --build app-prod

prod-test: ## 🧪 Test production build locally
	@echo "$(BLUE)🧪 Testing production build...$(NC)"
	docker build -t siam-prod:test .
	docker run --rm -p 10000:10000 --env-file .env.production.local siam-prod:test

# Build commands
build: ## 🔨 Build Docker images
	@echo "$(GREEN)🔨 Building Docker images...$(NC)"
	docker compose build --no-cache

build-fast: ## ⚡ Fast build (with cache)
	@echo "$(GREEN)⚡ Fast building with cache...$(NC)"
	docker compose build

# Utility commands
logs: ## 📜 Show logs
	docker compose logs -f --tail=100

logs-prod: ## 📜 Show production logs
	docker compose --profile production logs -f app-prod --tail=100

shell: ## 🐚 Open shell in running container
	@echo "$(CYAN)🐚 Opening shell...$(NC)"
	docker compose exec app sh

shell-prod: ## 🐚 Open shell in production container
	@echo "$(CYAN)🐚 Opening production shell...$(NC)"
	docker compose --profile production exec app-prod sh

clean: ## 🧹 Clean up containers and volumes
	@echo "$(RED)🧹 Cleaning up Docker resources...$(NC)"
	docker compose down -v --remove-orphans
	docker system prune -f

nuke: ## ☢️  DESTROY EVERYTHING (containers, images, volumes)
	@echo "$(RED)☢️  NUCLEAR OPTION - Destroying everything!$(NC)"
	docker compose down -v --rmi all --remove-orphans
	docker system prune -af --volumes

# Testing commands
test: ## 🧪 Run tests in container
	@echo "$(YELLOW)🧪 Running tests...$(NC)"
	docker compose run --rm app pnpm test

test-e2e: ## 🎭 Run E2E tests
	@echo "$(YELLOW)🎭 Running E2E tests...$(NC)"
	docker compose run --rm app pnpm test:e2e

# Code quality
lint: ## 🔍 Run linter
	@echo "$(BLUE)🔍 Running linter...$(NC)"
	docker compose run --rm app pnpm lint

format: ## 💅 Format code
	@echo "$(BLUE)💅 Formatting code...$(NC)"
	docker compose run --rm app pnpm format

type-check: ## 📝 Run TypeScript type checking
	@echo "$(BLUE)📝 Checking types...$(NC)"
	docker compose run --rm app pnpm type-check

# Deployment helpers
render-build: ## 🚀 Simulate Render build
	@echo "$(YELLOW)🚀 Simulating Render deployment...$(NC)"
	docker build --platform linux/amd64 -t siam-render:latest .
	@echo "$(GREEN)✅ Build successful! Image size:$(NC)"
	@docker images siam-render:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

push: ## 📤 Push to Docker Hub (configure registry first)
	@echo "$(YELLOW)📤 Pushing to registry...$(NC)"
	docker tag siam-prod:latest your-registry/siam:latest
	docker push your-registry/siam:latest

# Status commands
ps: ## 📊 Show running containers
	@docker compose ps

stats: ## 📈 Show container stats
	@docker stats --no-stream

# Quick commands
up: dev ## 🚀 Alias for 'make dev'
down: ## 🛑 Stop all containers
	@echo "$(RED)🛑 Stopping containers...$(NC)"
	docker compose down

restart: ## 🔄 Restart containers
	@echo "$(YELLOW)🔄 Restarting containers...$(NC)"
	docker compose restart

rebuild: clean build dev ## 🏗️ Full rebuild and restart