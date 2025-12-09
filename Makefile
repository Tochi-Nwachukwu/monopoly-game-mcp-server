# Monopoly Game - Makefile
# Convenience commands for development and deployment

.PHONY: help dev dev-backend dev-frontend docker-build docker-start docker-stop docker-logs clean

help:
	@echo "Monopoly Game - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start both backend and frontend in dev mode"
	@echo "  make dev-backend    - Start backend only"
	@echo "  make dev-frontend   - Start frontend only"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build   - Build Docker images"
	@echo "  make docker-start   - Start containers"
	@echo "  make docker-stop    - Stop containers"
	@echo "  make docker-logs    - View container logs"
	@echo "  make docker-clean   - Remove containers and images"
	@echo ""
	@echo "Utility:"
	@echo "  make clean          - Clean build artifacts"

# ===========================================
# Development Commands
# ===========================================

dev:
	@echo "Starting development servers..."
	@echo "Backend will run on http://localhost:8001"
	@echo "Frontend will run on http://localhost:3000"
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && uv run python mcp_server.py

dev-frontend:
	cd frontend && npm run dev

# ===========================================
# Docker Commands
# ===========================================

docker-build:
	docker compose build

docker-start:
	docker compose up -d
	@echo ""
	@echo "✅ Monopoly Game started!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:8001"

docker-stop:
	docker compose down

docker-logs:
	docker compose logs -f

docker-clean:
	docker compose down --rmi all --volumes --remove-orphans

# ===========================================
# Utility Commands
# ===========================================

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/.venv 2>/dev/null || true

