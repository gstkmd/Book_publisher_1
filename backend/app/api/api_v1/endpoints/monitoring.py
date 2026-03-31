from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime, timezone, timedelta
import shutil
import os
import sqlite3
import uuid
from typing import List, Optional
from pathlib import Path
from contextlib import contextmanager
import mimetypes

from app.api import deps
from app.modules.core.models import User
from app.modules.generic.monitoring_models import MonitoringActivity, MonitoringScreenshot, MonitoringAgent

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
                user_id TEXT,
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
        
        # App usage table - UPDATED with enriched fields
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
                app_category TEXT,
                activity_type TEXT,
                web_title TEXT,
                web_domain TEXT,
                web_category TEXT,
                file_name TEXT,
                file_extension TEXT,
                FOREIGN KEY (agent_id) REFERENCES agents (id)
            )
        ''')

        # Migrations for existing databases
        columns = [
            ("app_category", "TEXT"),
            ("activity_type", "TEXT"),
            ("web_title", "TEXT"),
            ("web_domain", "TEXT"),
            ("web_category", "TEXT"),
            ("file_name", "TEXT"),
            ("file_extension", "TEXT")
        ]
        
        cursor = conn.cursor()
        
        # Agents table migration
        cursor.execute("PRAGMA table_info(agents)")
        agent_columns = [row[1] for row in cursor.fetchall()]
        if "user_id" not in agent_columns:
            try:
                conn.execute("ALTER TABLE agents ADD COLUMN user_id TEXT")
            except Exception as e:
                print(f"Migration error for agents.user_id: {e}")

        # App usage table migration
        cursor.execute("PRAGMA table_info(app_usage)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        for col_name, col_type in columns:
            if col_name not in existing_columns:
                try:
                    conn.execute(f"ALTER TABLE app_usage ADD COLUMN {col_name} {col_type}")
                except Exception as e:
                    print(f"Migration error for {col_name}: {e}")
        
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
    return {"status": "healthy", "database": "connected", "timestamp": datetime.now(timezone.utc)}

# ============ API ENDPOINTS FOR AGENT ============

@router.post("/agent/register")
async def register_agent(
    computer_name: str = Form(...),
    os_version: str = Form(...),
    platform: Optional[str] = Form(None),
    arch: Optional[str] = Form(None),
    nickname: Optional[str] = Form(None),
    current_user: User = Depends(deps.get_current_user)
):
    """Register a new monitoring agent"""
    if not current_user.organization_id:
        # If user isn't in an org, we can't create the agent properly, but we can fallback for local testing
        agent_id = str(uuid.uuid4())
        return {"agent_id": agent_id, "status": "registered"}

    agent = MonitoringAgent(
        user=current_user,
        organization_id=current_user.organization_id,
        computer_name=computer_name,
        os_version=os_version,
        last_seen=datetime.now(timezone.utc)
    )
    await agent.create()
    print(f"DEBUG: Agent registered for user {current_user.email}, ID: {agent.id}")
    return {"agent_id": str(agent.id), "status": "registered"}

@router.post("/screenshots/upload")
async def upload_screenshot(
    agent_id: Optional[str] = Form(None),
    agentId: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
    files: Optional[UploadFile] = File(None),
    timestamp: Optional[str] = Form(None),
    current_user: User = Depends(deps.get_current_user)
):
    """Receive screenshot from agent"""
    # Robustly handle different field names
    agent_id = agent_id or agentId
    screenshot = screenshot or files
    timestamp = timestamp or datetime.now().isoformat()

    if not agent_id:
        raise HTTPException(status_code=422, detail="agent_id or agentId is required")
    if not screenshot:
        raise HTTPException(status_code=422, detail="screenshot or files is required")

    try:

        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(screenshot.filename)[1] or ".png"
        filename = f"{file_id}{file_extension}"
        filepath = f"storage/screenshots/{filename}"
        
        # Save file
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(screenshot.file, buffer)
        
        # Save to database (MongoDB)
        ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00')) if timestamp else datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
            
        screenshot_doc = MonitoringScreenshot(
            user=current_user,
            organization_id=current_user.organization_id,
            agent_id=agent_id,
            timestamp=ts,
            file_url=filepath, # Store local path for internal use
            app_name="Agent Upload",
            window_title="N/A"
        )
        await screenshot_doc.create()
        
        return {"status": "success", "screenshot_id": str(screenshot_doc.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agent-working-apps/set")
async def track_app_usage(
    data: dict,
    current_user: User = Depends(deps.get_current_user)
):
    """Track application usage from agent (MongoDB)"""
    try:
        if not current_user.organization_id:
            raise HTTPException(status_code=400, detail="User not part of an organization")

        agent_id = data.get("agent_id") or data.get("agentId")
        app_data = data.get("app_data") or data.get("appData", {})
        
        # Calculate duration
        open_time_str = app_data.get("app_open_at") or app_data.get("appOpenAt")
        close_time_str = app_data.get("app_close_at") or app_data.get("appCloseAt")
        
        if not open_time_str or not close_time_str:
            open_time = datetime.now(timezone.utc)
            close_time = open_time 
            duration = 0
        else:
            open_time = datetime.fromisoformat(open_time_str.replace('Z', '+00:00'))
            close_time = datetime.fromisoformat(close_time_str.replace('Z', '+00:00'))
            if open_time.tzinfo is None: open_time = open_time.replace(tzinfo=timezone.utc)
            if close_time.tzinfo is None: close_time = close_time.replace(tzinfo=timezone.utc)
            duration = int((close_time - open_time).total_seconds())
        
        activity = MonitoringActivity(
            user=current_user,
            organization_id=current_user.organization_id,
            agent_id=agent_id,
            timestamp=open_time,
            app_name=app_data.get("app_name") or app_data.get("appName") or "Unknown",
            window_title=app_data.get("window_title") or app_data.get("windowTitle") or "N/A",
            activity_type=app_data.get("activity_type") or app_data.get("activityType") or "active",
            duration=duration,
            keys_pressed=app_data.get("keys_pressed") or app_data.get("keysPressed") or 0,
            mouse_clicks=app_data.get("mouse_clicks") or app_data.get("mouseClicks") or 0,
            web_url=app_data.get("web_url") or app_data.get("webUrl"),
            web_title=app_data.get("web_title") or app_data.get("webTitle"),
            web_domain=app_data.get("web_domain") or app_data.get("webDomain"),
            file_path=app_data.get("file_path") or app_data.get("filePath"),
            file_name=app_data.get("file_name") or app_data.get("fileName"),
            file_extension=app_data.get("file_extension") or app_data.get("fileExtension")
        )
        await activity.create()
        return {"status": "success", "id": str(activity.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agent-idle-time/add")
async def track_idle_time(
    data: dict,
    current_user: User = Depends(deps.get_current_user)
):
    """Track idle time periods (MongoDB)"""
    try:
        if not current_user.organization_id:
            raise HTTPException(status_code=400, detail="User not part of an organization")

        agent_id = data.get("agent_id") or data.get("agentId")
        # Calculate duration
        from_time_str = data.get("from") or data.get("idle_from")
        to_time_str = data.get("to") or data.get("idle_to")
        
        if not from_time_str or not to_time_str:
            duration = 0
            ts = datetime.now(timezone.utc)
        else:
            from_time = datetime.fromisoformat(from_time_str.replace('Z', '+00:00'))
            to_time = datetime.fromisoformat(to_time_str.replace('Z', '+00:00'))
            if from_time.tzinfo is None: from_time = from_time.replace(tzinfo=timezone.utc)
            if to_time.tzinfo is None: to_time = to_time.replace(tzinfo=timezone.utc)
            duration = int((to_time - from_time).total_seconds())
            ts = from_time
        
        activity = MonitoringActivity(
            user=current_user,
            organization_id=current_user.organization_id,
            agent_id=agent_id,
            timestamp=ts,
            activity_type="idle",
            duration=duration,
            idle_duration=duration
        )
        await activity.create()
        return {"status": "success", "id": str(activity.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ API ENDPOINTS FOR DASHBOARD ============

@router.get("/dashboard/summary")
async def get_dashboard_summary(current_user: User = Depends(deps.get_current_user)):
    """Get summary data for dashboard from MongoDB"""
    # Start of day UTC (Ensure 'today' is UTC aware for consistent comparison)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Total active agents today (unique users with activity)
    # Use aggregation to get unique user IDs efficiently
    active_agents_pipeline = [
        {
            "$match": {
                "organization_id": current_user.organization_id,
                "timestamp": {"$gte": today}
            }
        },
        {
            "$group": {"_id": "$user"}
        },
        {
            "$count": "count"
        }
    ]
    agents_result = await MonitoringActivity.aggregate(active_agents_pipeline).to_list()
    active_agents = agents_result[0]["count"] if agents_result else 0
    
    # 2. Total screenshots today
    screenshots_today = await MonitoringScreenshot.find(
        MonitoringScreenshot.organization_id == current_user.organization_id,
        MonitoringScreenshot.timestamp >= today
    ).count()
    
    # 3. Total active minutes today
    pipeline = [
        {
            "$match": {
                "organization_id": current_user.organization_id,
                "timestamp": {"$gte": today},
                "activity_type": "active"
            }
        },
        {
            "$group": {
                "_id": {
                    "user": "$user",
                    "year": {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day": {"$dayOfMonth": "$timestamp"},
                    "hour": {"$hour": "$timestamp"},
                    "minute": {"$minute": "$timestamp"}
                }
            }
        },
        {
            "$count": "total_minutes"
        }
    ]
    
    minutes_result = await MonitoringActivity.aggregate(pipeline).to_list()
    active_minutes = minutes_result[0]["total_minutes"] if minutes_result else 0
    
    # 4. Total idle minutes today
    idle_pipeline = [
        {
            "$match": {
                "organization_id": current_user.organization_id,
                "timestamp": {"$gte": today},
                "activity_type": "idle"
            }
        },
        {
            "$group": {
                "_id": None,
                "total_idle_seconds": {"$sum": "$idle_duration"}
            }
        }
    ]
    idle_result = await MonitoringActivity.aggregate(idle_pipeline).to_list()
    idle_seconds = idle_result[0]["total_idle_seconds"] if idle_result else 0
    idle_minutes = idle_seconds / 60
    
    total_tracked = active_minutes + idle_minutes
    
    if total_tracked > 0:
        productive_score = min(100, round((active_minutes / total_tracked) * 100))
    else:
        productive_score = 0
    
    return {
        "active_agents": active_agents,
        "screenshots_today": screenshots_today,
        "total_active_minutes": round(active_minutes, 1),
        "productivity_score": productive_score
    }

@router.get("/dashboard/agents")
async def get_agents(current_user: User = Depends(deps.get_current_user)):
    """Get list of all agents from MongoDB for current organization"""
    # Start of day UTC
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Fetch all members of the organization
    members = await User.find(User.organization_id == current_user.organization_id).to_list()
    print(f"DEBUG: [get_agents] Admin {current_user.email} (Org: {current_user.organization_id}) fetched {len(members)} members")
    
    agents_list = []
    for member in members:
        print(f"DEBUG: [get_agents] Processing member: {member.email}, OrgID: {member.organization_id}, Role: {member.role}")
        user_match_or = [
            {"user": member.id},
            {"user.$id": member.id},
            {"user._id": member.id},
            {"user": str(member.id)}
        ]

        # Find latest agent registration
        agent_doc = await MonitoringAgent.find(
            {"$or": user_match_or}
        ).sort(-MonitoringAgent.created_at).first_or_none()

        # Find latest activity for this member
        latest_activity = await MonitoringActivity.find(
            {"$or": user_match_or}
        ).sort(-MonitoringActivity.timestamp).first_or_none()
        
        # Find screenshot count for TODAY to be consistent with dashboard cards
        screenshot_count = await MonitoringScreenshot.find(
            {"$or": user_match_or},
            MonitoringScreenshot.organization_id == current_user.organization_id,
            MonitoringScreenshot.timestamp >= today
        ).count()
        
        agents_list.append({
            "id": str(member.id),
            "full_name": member.full_name,
            "email": member.email,
            "computer_name": agent_doc.computer_name if agent_doc else "Remote Device",
            "last_seen": latest_activity.timestamp if latest_activity else None,
            "screenshot_count": screenshot_count
        })
        
    return agents_list

@router.get("/dashboard/screenshots")
async def get_screenshots(
    agent_id: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(deps.get_current_user)
):
    """Get recent screenshots from MongoDB for current organization"""
    from bson import ObjectId
    
    query = {"organization_id": current_user.organization_id}
    
    if date:
        try:
            # When a single date is provided (e.g. from a date picker),
            # we expand the range to ensure we capture activity in different timezones (like IST).
            # IST is UTC+5:30, so we subtract and add some buffer.
            base_date = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            start_date = base_date - timedelta(hours=6) # Capture from late night yesterday UTC
            end_date = base_date + timedelta(hours=30)  # Capture until early morning tomorrow UTC
            query["timestamp"] = {"$gte": start_date, "$lte": end_date}
        except Exception:
            pass

    beanie_query = MonitoringScreenshot.find(query, fetch_links=True)
    
    if agent_id:
        try:
            agent_oid = ObjectId(agent_id)
            # Use Beanie's built-in link matching for maximum reliability
            beanie_query = beanie_query.find(MonitoringScreenshot.user.id == agent_oid)
        except Exception:
            pass
            
    screenshots = await beanie_query.sort(-MonitoringScreenshot.timestamp).skip(offset).limit(limit).to_list()
    
    return [
        {
            "id": str(s.id),
            "filename": s.file_url.split('/')[-1] if s.file_url else "unknown.png",
            "filepath": s.file_url,
            "timestamp": s.timestamp,
            "computer_name": s.user.full_name if (s.user and hasattr(s.user, 'full_name')) else "Unknown"
        } for s in screenshots
    ]

@router.get("/dashboard/agent/{agent_id}/activity")
async def get_agent_activity(
    agent_id: str, 
    date: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user)
):
    """Get detailed activity for a specific agent (MongoDB)"""
    from bson import ObjectId
    
    try:
        user_oid = ObjectId(agent_id)
        
        if not date:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Range expanded for IST/UTC overlap
        try:
            base_date = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            start_date = base_date - timedelta(hours=6)
            end_date = base_date + timedelta(hours=30)
        except Exception:
            start_date = datetime.now(timezone.utc) - timedelta(days=1)
            end_date = datetime.now(timezone.utc) + timedelta(days=1)

        print(f"DEBUG: Getting activity for agent_id {agent_id}, user_oid: {user_oid}, date: {date}")
        
        user_match_or = [
            {"user": user_oid},
            {"user.$id": user_oid},
            {"user._id": user_oid},
            {"user": str(user_oid)}
        ]

        # 0. Summary Stats Calculation
        # Active minutes
        active_pipeline = [
            {
                "$match": {
                    "organization_id": current_user.organization_id,
                    "$or": user_match_or,
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "activity_type": "active"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_seconds": {"$sum": "$duration"}
                }
            }
        ]
        active_res = await MonitoringActivity.aggregate(active_pipeline).to_list()
        total_active_seconds = active_res[0]["total_seconds"] if active_res else 0
        total_active_minutes = round(total_active_seconds / 60, 1)

        # Idle minutes
        idle_pipeline = [
            {
                "$match": {
                    "organization_id": current_user.organization_id,
                    "$or": user_match_or,
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "activity_type": "idle"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_seconds": {"$sum": "$duration"}
                }
            }
        ]
        idle_res = await MonitoringActivity.aggregate(idle_pipeline).to_list()
        total_idle_seconds = idle_res[0]["total_seconds"] if idle_res else 0
        total_idle_minutes = round(total_idle_seconds / 60, 1)

        # Productivity Score
        total_tracked = total_active_minutes + total_idle_minutes
        productivity_score = min(100, round((total_active_minutes / total_tracked) * 100)) if total_tracked > 0 else 0

        # Screenshot count
        screenshot_count = await MonitoringScreenshot.find(
            {"$or": user_match_or},
            MonitoringScreenshot.timestamp >= start_date,
            MonitoringScreenshot.timestamp <= end_date
        ).count()

        # Agent Status & Identification
        user_obj = await User.get(user_oid)
        if not user_obj:
            print(f"DEBUG: [AgentDetail] User NOT FOUND for ID: {agent_id}")
        else:
            print(f"DEBUG: [AgentDetail] Found User: {user_obj.email}, Name: {user_obj.full_name}")

        latest_activity = await MonitoringActivity.find(
            {"$or": user_match_or}
        ).sort(-MonitoringActivity.timestamp).first_or_none()
        
        is_online = False
        if latest_activity and latest_activity.timestamp:
            ts = latest_activity.timestamp
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            # Check if last activity was within last 10 minutes
            is_online = (datetime.now(timezone.utc) - ts).total_seconds() < 600

        summary = {
            "user_email": user_obj.email if user_obj else "Unknown",
            "user_full_name": (user_obj.full_name or "Unknown Agent") if user_obj else "Unknown Agent",
            "active_minutes": total_active_minutes,
            "screenshot_count": screenshot_count,
            "productivity_score": productivity_score,
            "is_online": is_online,
            "last_seen": latest_activity.timestamp if latest_activity else None
        }

        # 1. App usage aggregation
        app_pipeline = [
            {
                "$match": {
                    "organization_id": current_user.organization_id,
                    "$or": user_match_or,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$app_name",
                    "total_seconds": {"$sum": "$duration"},
                    "total_keys": {"$sum": "$keys_pressed"},
                    "total_clicks": {"$sum": "$mouse_clicks"}
                }
            },
            {
                "$project": {
                    "app_name": "$_id",
                    "total_seconds": 1,
                    "total_keys": 1,
                    "total_clicks": 1,
                    "_id": 0
                }
            },
            {"$sort": {"total_seconds": -1}}
        ]
        
        apps_result = await MonitoringActivity.aggregate(app_pipeline).to_list()
        
        # 2. Hourly activity aggregation
        hourly_pipeline = [
            {
                "$match": {
                    "organization_id": current_user.organization_id,
                    "$or": user_match_or,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {"$hour": "$timestamp"},
                    "active_seconds": {"$sum": "$duration"}
                }
            },
            {
                "$project": {
                    "hour": {"$toString": "$_id"},
                    "active_seconds": 1,
                    "_id": 0
                }
            },
            {"$sort": {"hour": 1}}
        ]
        
        hourly_result = await MonitoringActivity.aggregate(hourly_pipeline).to_list()
        
        # 3. Raw Logs
        raw_logs = await MonitoringActivity.find(
            {"$or": user_match_or},
            MonitoringActivity.timestamp >= start_date,
            MonitoringActivity.timestamp <= end_date
        ).sort(-MonitoringActivity.timestamp).limit(200).to_list()
        
        serialized_logs = []
        for log in raw_logs:
            log_dict = log.dict()
            log_dict["id"] = str(log.id)
            if isinstance(log_dict.get("timestamp"), datetime):
                log_dict["timestamp"] = log_dict["timestamp"].isoformat()
            serialized_logs.append(log_dict)
        
        return {
            "summary": summary,
            "app_usage": apps_result,
            "hourly_activity": hourly_result,
            "raw_logs": serialized_logs
        }
    except Exception as e:
        import traceback
        print(f"ERROR: [AgentDetail] Critical error for agent_id {agent_id}:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/screenshot/{screenshot_id}")
async def get_screenshot(screenshot_id: str):
    """Serve screenshot file from MongoDB record"""
    from bson import ObjectId
    try:
        shot = await MonitoringScreenshot.get(ObjectId(screenshot_id))
        if shot and shot.file_url:
            # Check for path existence (handle both relative and absolute)
            path = shot.file_url
            # Handle relative paths - assume storage is in app root
            if not os.path.isabs(path):
                # Try relative to CWD, then relative to script location
                cwd_path = os.path.abspath(path)
                script_dir_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), path)
                
                if os.path.exists(cwd_path):
                    path = cwd_path
                elif os.path.exists(script_dir_path):
                    path = script_dir_path
            
            if os.path.exists(path):
                content_type, _ = mimetypes.guess_type(path)
                return FileResponse(path, media_type=content_type or "image/png")
    except Exception as e:
        print(f"Error serving screenshot: {e}")
        
    raise HTTPException(status_code=404, detail="Screenshot not found")
