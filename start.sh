#!/bin/bash

# Replace PORT_PLACEHOLDER in nginx.conf with Railway's PORT env var
# Default to 80 if PORT is not set
LISTENING_PORT=${PORT:-80}
sed -i "s/PORT_PLACEHOLDER/$LISTENING_PORT/g" /etc/nginx/nginx.conf

echo "🚀 Starting Unified Services on port $LISTENING_PORT..."

# Start the Backend (FastAPI)
echo "📡 Starting Backend on 0.0.0.0:8000..."
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Start the Frontend (Next.js Standalone)
# Use HOSTNAME (all caps) to correctly bind in standalone mode
echo "🌐 Starting Frontend on 0.0.0.0:3000..."
cd /app/frontend
PORT=3000 HOSTNAME=0.0.0.0 node server.js &

# Wait for services to fully initialize
echo "⏱️ Waiting 10 seconds for services to warm up..."
sleep 10

# Final check of processes
echo "🔍 Current processes:"
ps aux

# Start Nginx in foreground
echo "⚙️ Starting Nginx Gateway..."
nginx -g "daemon off;"
