from typing import Any, Dict
import httpx
from app.modules.core.models import WebhookSubscription

class WebhookService:
    async def dispatch_event(self, event_name: str, payload: Dict[str, Any], organization_id: str = None):
        """
        Finds all active subscriptions for the event and sends a POST request.
        """
        query = [
            WebhookSubscription.events == event_name,
            WebhookSubscription.is_active == True
        ]
        if organization_id:
            query.append(WebhookSubscription.organization_id == organization_id)
            
        subs = await WebhookSubscription.find(*query).to_list()

        async with httpx.AsyncClient() as client:
            for sub in subs:
                try:
                    # In a real app, use Celery/Redis Queue for this to avoid blocking
                    await client.post(
                        sub.url, 
                        json={"event": event_name, "data": payload},
                        headers={"X-Webhook-Secret": sub.secret},
                        timeout=5.0
                    )
                except Exception as e:
                    print(f"Failed to send webhook to {sub.url}: {e}")

webhook_service = WebhookService()
