# Educational Publishing Platform ("Trojan Horse")

A modern, SaaS-ready educational publishing platform built with FastAPI, Next.js, and MongoDB.

## Features
- **SaaS Architecture**: Multi-tenancy, Organization Management, Billing logic.
- **Content Creation**: Rich Text Editor, Version History, Media Library (S3/Wasabi).
- **Collaboration**: Real-time Co-editing (WebSockets), Comments, Task Management.
- **Publishing**: PDF/EPUB Export, Workflow (Kanban), Rights Management.
- **Educational Tools**: Lesson Plan Generator, Standards Alignment (CCSS/NGSS).
- **Integrations**: Gmail, WhatsApp, SSO (Google/Microsoft), LMS Webhooks.
- **AI Ready**: MCP Server for AI extensions.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Environment Setup
Create a `.env` file in `backend/` with the following:
```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=publishing_platform
SECRET_KEY=your_super_secret_key_here
WASABI_ACCESS_KEY=your_key
WASABI_SECRET_KEY=your_secret
WASABI_REGION=us-east-1
WASABI_BUCKET=your_bucket
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 2. Run Backend (Docker)
```bash
docker-compose up -d --build
```
This starts:
- FastAPI Backend (http://localhost:8000)
- MongoDB
- Redis
- Celery Worker

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

## Documentation
- **API Docs**: http://localhost:8000/docs
- **Walkthrough**: See `walkthrough.md` in your artifacts folder.
