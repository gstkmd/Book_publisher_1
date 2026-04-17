#!/bin/bash
# VPS Deployment Script for Book Publisher
# ========================================

# Configuration
PROJECT_DIR="/home/ubuntu/Book_publisher" # Path on VPS
DOMAIN="publisher.connecterp.cloud"

# Ensure we are in the project directory
cd "$PROJECT_DIR" || { echo "❌ Project directory not found at $PROJECT_DIR"; exit 1; }

echo "🚀 Starting Deployment for $DOMAIN..."

# 1. Pull the latest code
# Note: Since .env is ignored, git pull will not overwrite it.
# If .env was previously tracked, this script assumes 'git rm --cached .env' was run.
echo "📥 Fetching latest code from GitHub..."
git pull origin main

# 2. Check for environment files
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found in $PROJECT_DIR."
    echo "Please create a .env using .env.example as a template before proceeding."
    exit 1
fi

# 3. Pull latest Docker images and restart services
echo "🐳 Rebuilding and restarting containers..."
docker-compose down
docker-compose up -d --build

# 4. Clean up old images
echo "🧹 Cleaning up dangling Docker images..."
docker image prune -f

# 5. Final Status
echo "✅ Deployment successful!"
docker-compose ps
