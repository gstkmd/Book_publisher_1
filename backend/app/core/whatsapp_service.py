import httpx
import os

class WhatsAppService:
    def __init__(self):
        self.api_token = os.getenv("WHATSAPP_API_TOKEN") # From Meta Business Manager
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_ID") 
        self.base_url = f"https://graph.facebook.com/v17.0/{self.phone_number_id}/messages"

    async def send_message(self, to_number: str, message: str):
        if not self.api_token or not self.phone_number_id:
            print(f"[WhatsAppService] Mock Send -> To: {to_number}, Msg: {message}")
            return

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": message},
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                print(f"[WhatsAppService] Sent: {response.json()}")
            except Exception as e:
                print(f"[WhatsAppService] Error: {e}")

whatsapp_service = WhatsAppService()
