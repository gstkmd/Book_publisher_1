from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime, timedelta
import shutil
import os
import sqlite3
import uuid
from typing import List, Optional
from pathlib import Path
from contextlib import contextmanager

router = APIRouter()

# ============ DATABASE SETUP ============
DB_PATH = 'monitoring.db'

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        # Agents table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                computer_name TEXT,
                os_version TEXT,
                last_seen TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Screenshots table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS screenshots (
                id TEXT PRIMARY KEY,
                agent_id TEXT,
                filename TEXT,
                filepath TEXT,
                timestamp TIMESTAMP,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agent_id) REFERENCES agents (id)
            )
        ''')
        
        # App usage table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS app_usage (
                id TEXT PRIMARY KEY,
                agent_id TEXT,
                app_name TEXT,
                app_open_at TIMESTAMP,
                app_close_at TIMESTAMP,
                keys_pressed INTEGER DEFAULT 0,
                mouse_clicks INTEGER DEFAULT 0,
                duration_seconds INTEGER,
                FOREIGN KEY (agent_id) REFERENCES agents (id)
            )
        ''')
        
        # Idle time table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS idle_time (
                id TEXT PRIMARY KEY,
                agent_id TEXT,
                idle_from TIMESTAMP,
                idle_to TIMESTAMP,
                duration_seconds INTEGER,
                FOREIGN KEY (agent_id) REFERENCES agents (id)
            )
        ''')
        
        # Daily summary table (for quick dashboard loading)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS daily_summary (
                agent_id TEXT,
                date TEXT,
                total_active_minutes INTEGER,
                total_idle_minutes INTEGER,
                productive_score REAL,
                screenshot_count INTEGER,
                PRIMARY KEY (agent_id, date)
            )
        ''')
        
        conn.commit()

# Create directories for file storage
os.makedirs("storage/screenshots", exist_ok=True)
os.makedirs("storage/thumbnails", exist_ok=True)

init_db()

@router.get("/health")
async def health_check():
    """Health check for monitoring system"""
    return {"status": "healthy", "database": "connected", "timestamp": datetime.now()}

# ============ API ENDPOINTS FOR AGENT ============

@router.post("/agent/register")
async def register_agent(
    computer_name: str = Form(...),
    os_version: str = Form(...)
):
    """Register a new monitoring agent"""
    agent_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            "INSERT INTO agents (id, computer_name, os_version, last_seen) VALUES (?, ?, ?, ?)",
            (agent_id, computer_name, os_version, datetime.now())
        )
        conn.commit()
    return {"agent_id": agent_id, "status": "registered"}

@router.post("/screenshots/upload")
async def upload_screenshot(
    agent_id: str = Form(...),
    screenshot: UploadFile = File(...),
    timestamp: str = Form(...)
):
    """Receive screenshot from agent"""
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(screenshot.filename)[1] or ".png"
        filename = f"{file_id}{file_extension}"
        filepath = f"storage/screenshots/{filename}"
        
        # Save file
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(screenshot.file, buffer)
        
        # Save to database
        with get_db() as conn:
            conn.execute(
                """INSERT INTO screenshots 
                   (id, agent_id, filename, filepath, timestamp) 
                   VALUES (?, ?, ?, ?, ?)""",
                (file_id, agent_id, filename, filepath, timestamp)
            )
            
            # Update agent last seen
            conn.execute(
                "UPDATE agents SET last_seen = ? WHERE id = ?",
                (datetime.now(), agent_id)
            )
            conn.commit()
        
        return {"status": "success", "screenshot_id": file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agent-working-apps/set")
async def track_app_usage(data: dict):
    """Track application usage from agent"""
    try:
        app_id = str(uuid.uuid4())
        agent_id = data.get("agentId")
        app_data = data.get("appData", {})
        
        # Calculate duration
        open_time = datetime.fromisoformat(app_data.get("appOpenAt").replace('Z', '+00:00'))
        close_time = datetime.fromisoformat(app_data.get("appCloseAt").replace('Z', '+00:00'))
        duration = int((close_time - open_time).total_seconds())
        
        with get_db() as conn:
            conn.execute(
                """INSERT INTO app_usage 
                   (id, agent_id, app_name, app_open_at, app_close_at, 
                    keys_pressed, mouse_clicks, duration_seconds)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    app_id, agent_id, 
                    app_data.get("appName", "Unknown"),
                    app_data.get("appOpenAt"),
                    app_data.get("appCloseAt"),
                    app_data.get("keysPressed", 0),
                    app_data.get("mouseClicks", 0),
                    duration
                )
            )
            conn.commit()
        
        return {"status": "success", "app_id": app_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agent-idle-time/add")
async def track_idle_time(data: dict):
    """Track idle time periods"""
    try:
        idle_id = str(uuid.uuid4())
        agent_id = data.get("agentId")
        idle_from = data.get("from")
        idle_to = data.get("to")
        
        # Calculate duration
        from_time = datetime.fromisoformat(idle_from.replace('Z', '+00:00'))
        to_time = datetime.fromisoformat(idle_to.replace('Z', '+00:00'))
        duration = int((to_time - from_time).total_seconds())
        
        with get_db() as conn:
            conn.execute(
                """INSERT INTO idle_time 
                   (id, agent_id, idle_from, idle_to, duration_seconds)
                   VALUES (?, ?, ?, ?, ?)""",
                (idle_id, agent_id, idle_from, idle_to, duration)
            )
            conn.commit()
        
        return {"status": "success", "idle_id": idle_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ API ENDPOINTS FOR DASHBOARD ============

@router.get("/dashboard/summary")
async def get_dashboard_summary():
    """Get summary data for dashboard"""
    with get_db() as conn:
        # Total active agents today
        today = datetime.now().date()
        active_agents = conn.execute(
            "SELECT COUNT(*) as count FROM agents WHERE date(last_seen) = ?",
            (today,)
        ).fetchone()["count"]
        
        # Total screenshots today
        screenshots_today = conn.execute(
            "SELECT COUNT(*) as count FROM screenshots WHERE date(timestamp) = ?",
            (today,)
        ).fetchone()["count"]
        
        # Total active minutes today
        active_minutes = conn.execute(
            """SELECT SUM(duration_seconds)/60.0 as minutes 
               FROM app_usage WHERE date(app_open_at) = ?""",
            (today,)
        ).fetchone()["minutes"] or 0
        
        # Productivity score
        productive_score = 75  # Example calculation
        
        return {
            "active_agents": active_agents,
            "screenshots_today": screenshots_today,
            "total_active_minutes": round(active_minutes, 1),
            "productivity_score": productive_score
        }

@router.get("/dashboard/agents")
async def get_agents():
    """Get list of all agents with latest activity"""
    with get_db() as conn:
        agents = conn.execute("""
            SELECT 
                a.*,
                (SELECT COUNT(*) FROM screenshots s WHERE s.agent_id = a.id) as screenshot_count,
                (SELECT timestamp FROM screenshots s WHERE s.agent_id = a.id ORDER BY timestamp DESC LIMIT 1) as last_screenshot
            FROM agents a
            ORDER BY a.last_seen DESC
        """).fetchall()
        
        return [dict(agent) for agent in agents]

@router.get("/dashboard/screenshots")
async def get_screenshots(
    agent_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get recent screenshots with pagination"""
    with get_db() as conn:
        if agent_id:
            screenshots = conn.execute("""
                SELECT s.*, a.computer_name 
                FROM screenshots s
                JOIN agents a ON s.agent_id = a.id
                WHERE s.agent_id = ?
                ORDER BY s.timestamp DESC
                LIMIT ? OFFSET ?
            """, (agent_id, limit, offset)).fetchall()
        else:
            screenshots = conn.execute("""
                SELECT s.*, a.computer_name 
                FROM screenshots s
                JOIN agents a ON s.agent_id = a.id
                ORDER BY s.timestamp DESC
                LIMIT ? OFFSET ?
            """, (limit, offset)).fetchall()
        
        return [dict(shot) for shot in screenshots]

@router.get("/dashboard/agent/{agent_id}/activity")
async def get_agent_activity(agent_id: str, date: Optional[str] = None):
    """Get detailed activity for a specific agent"""
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    with get_db() as conn:
        # App usage for the day
        apps = conn.execute("""
            SELECT 
                app_name,
                SUM(duration_seconds) as total_seconds,
                SUM(keys_pressed) as total_keys,
                SUM(mouse_clicks) as total_clicks
            FROM app_usage
            WHERE agent_id = ? AND date(app_open_at) = ?
            GROUP BY app_name
            ORDER BY total_seconds DESC
        """, (agent_id, date)).fetchall()
        
        # Hourly activity breakdown
        hourly = conn.execute("""
            SELECT 
                strftime('%H', app_open_at) as hour,
                SUM(duration_seconds) as active_seconds
            FROM app_usage
            WHERE agent_id = ? AND date(app_open_at) = ?
            GROUP BY hour
            ORDER BY hour
        """, (agent_id, date)).fetchall()
        
        return {
            "app_usage": [dict(app) for app in apps],
            "hourly_activity": [dict(h) for h in hourly]
        }

@router.get("/dashboard/screenshot/{screenshot_id}")
async def get_screenshot(screenshot_id: str):
    """Serve screenshot file"""
    with get_db() as conn:
        result = conn.execute(
            "SELECT filepath FROM screenshots WHERE id = ?",
            (screenshot_id,)
        ).fetchone()
        
        if result and os.path.exists(result["filepath"]):
            return FileResponse(result["filepath"])
        raise HTTPException(status_code=404, detail="Screenshot not found")
