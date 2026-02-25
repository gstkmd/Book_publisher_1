#!/bin/bash

# Start the Backend (FastAPI)
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# Start the Frontend (Next.js Standalone)
cd /app/frontend
PORT=3000 hostname=0.0.0.0 node server.js &

# Start Nginx
nginx -g "daemon off;"
