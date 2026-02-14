import pytest
from httpx import AsyncClient
from app.modules.generic.models import Task, TaskComment
from app.modules.core.models import User
from datetime import datetime

@pytest.mark.async_date
async def test_task_extended_fields(client: AsyncClient, admin_token_headers):
    # Create task with new fields
    payload = {
        "title": "Extended Task Test",
        "description": "Testing start_date and custom_fields",
        "start_date": datetime.utcnow().isoformat(),
        "time_estimate": "3 days",
        "track_time": 3600,
        "custom_fields": {"Client Mail": "test@example.com"}
    }
    response = await client.post("/generic/tasks", json=payload, headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["time_estimate"] == "3 days"
    assert data["custom_fields"]["Client Mail"] == "test@example.com"
    task_id = data["id"]

    # Add comment
    comment_payload = {"task_id": task_id, "text": "This is a test comment"}
    response = await client.post(f"/generic/tasks/{task_id}/comments", json=comment_payload, headers=admin_token_headers)
    assert response.status_code == 200
    comment_data = response.json()
    assert comment_data["text"] == "This is a test comment"

    # Get comments
    response = await client.get(f"/generic/tasks/{task_id}/comments", headers=admin_token_headers)
    assert response.status_code == 200
    comments = response.json()
    assert len(comments) > 0
    assert comments[0]["text"] == "This is a test comment"
