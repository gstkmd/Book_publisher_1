# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
# Use relative API path for single-service deployment
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN npm run build

# --- Stage 2: Build Backend ---
FROM python:3.11-slim AS backend-builder
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && rm -rf /var/lib/apt/lists/*
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"
COPY backend/pyproject.toml backend/poetry.lock* ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-root --only main

# --- Stage 3: Final Production Image ---
FROM python:3.11-slim
WORKDIR /app

# Install Node.js for Next.js standalone and Nginx
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl nginx gnupg \
    libpango-1.0-0 libpangoft2-1.0-0 libglib2.0-0 && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy backend packages from builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend code
COPY backend/app ./backend/app

# Copy frontend standalone build
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 80
ENV PORT 80

CMD ["./start.sh"]
