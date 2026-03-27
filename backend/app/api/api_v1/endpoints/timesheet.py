from fastapi import APIRouter, HTTPException, Depends
from typing import Any, Optional
from pydantic import BaseModel
from app.api.api_v1.endpoints.monitoring import get_db

router = APIRouter()

class TimeSheetStatusResponse(BaseModel):
    success: bool
    data: dict

@router.get("/status/{agent_id}", response_model=TimeSheetStatusResponse)
async def get_timesheet_status(agent_id: str):
    """
    Get the current clock-in status for an agent.
    Verifies if the agent is registered in the monitoring system.
    """
    with get_db() as conn:
        agent = conn.execute(
            "SELECT id FROM agents WHERE id = ?", 
            (agent_id,)
        ).fetchone()
        
        if not agent:
            raise HTTPException(
                status_code=404, 
                detail=f"Agent with ID {agent_id} not found. Please re-register."
            )

    # In a real implementation, we would check the database for active timesheets
    return {
        "success": True,
        "data": {
            "isClockedIn": True,  # Default to True so monitoring starts
            "agent_id": agent_id,
            "status": "active"
        }
    }
