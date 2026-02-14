import pytest
from app.core.config import settings

@pytest.mark.asyncio
async def test_create_content(client, auth_token):
    response = await client.post(
        f"{settings.API_V1_STR}/generic/content",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "title": "Smoke Test Content",
            "slug": "smoke-test",
            "body": {"text": "This is a test"},
            "type": "article",
            "status": "draft"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Smoke Test Content"
    assert "id" in data or "_id" in data

@pytest.mark.asyncio
async def test_read_contents(client, auth_token):
    # Fetch content
    response = await client.get(
        f"{settings.API_V1_STR}/generic/content",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # At least the one we created in previous test if running in order, 
    # but fixtures/db might be reset depending on setup.
    # For a smoke test, we just want to see it doesn't 500 or 401.

@pytest.mark.asyncio
async def test_workflow_stats(client, auth_token):
    response = await client.get(
        f"{settings.API_V1_STR}/generic/workflow/stats",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "draft" in data
    assert "published" in data
