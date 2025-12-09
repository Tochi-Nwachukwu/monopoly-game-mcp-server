# Backend Dockerfile - Python with UV package manager
FROM python:3.12-slim

# Install uv and curl for healthcheck
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Create data directory for game persistence
RUN mkdir -p /app/game_data

# Expose ports
# 8000 - MCP Server (SSE)
# 8001 - FastAPI REST/WebSocket
EXPOSE 8000 8001

# Environment variables (can be overridden)
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/state || exit 1

# Run the server
CMD ["uv", "run", "python", "mcp_server.py"]

