import pytest
from httpx import AsyncClient
from app.modules.generic.models import Task, ActivityLog
from bson import ObjectId

@pytest.mark.asyncio
async def test_one_in_progress_rule(client: AsyncClient, admin_token_headers):
    # 1. Create Task A and set to In Progress
    payload_a = {
        "title": "Task A",
        "stage": "In Progress",
        "priority": "medium",
        "status": "pending"
    }
    resp_a = await client.post("/generic/tasks", json=payload_a, headers=admin_token_headers)
    assert resp_a.status_code == 200
    id_a = resp_a.json()["id"]
    
    # 2. Create Task B and set to In Progress
    payload_b = {
        "title": "Task B",
        "stage": "In Progress",
        "priority": "medium",
        "status": "pending"
    }
    resp_b = await client.post("/generic/tasks", json=payload_b, headers=admin_token_headers)
    assert resp_b.status_code == 200
    id_b = resp_b.json()["id"]
    
    # 3. Verify Task A is now "To Do"
    task_a = await Task.get(id_a)
    assert task_a.stage == "To Do"
    
    # 4. Verify Task B is "In Progress"
    task_b = await Task.get(id_b)
    assert task_b.stage == "In Progress"
    
    # 5. Move Task A back to In Progress via Update
    payload_a["stage"] = "In Progress"
    resp_update_a = await client.put(f"/generic/tasks/{id_a}", json=payload_a, headers=admin_token_headers)
    assert resp_update_a.status_code == 200
    
    # 6. Verify Task B is now "To Do"
    task_b_after = await Task.get(id_b)
    assert task_b_after.stage == "To Do"
    
    # 7. Check active status endpoint
    resp_status = await client.get("/generic/tasks/active-status", headers=admin_token_headers)
    assert resp_status.status_code == 200
    data = resp_status.json()
    assert data["active_count"] == 1
