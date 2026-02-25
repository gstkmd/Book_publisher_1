#!/bin/bash

# Replace PORT_PLACEHOLDER in nginx.conf with Railway's PORT env var
# Default to 80 if PORT is not set
LISTENING_PORT=${PORT:-80}
sed -i "s/PORT_PLACEHOLDER/$LISTENING_PORT/g" /etc/nginx/nginx.conf

echo "Starting services on port $LISTENING_PORT..."

# Start the Backend (FastAPI)
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# Start the Frontend (Next.js Standalone)
cd /app/frontend
PORT=3000 hostname=127.0.0.1 node server.js &

# Wait a few seconds for services to warm up
sleep 5

# Start Nginx in foreground
nginx -g "daemon off;"
