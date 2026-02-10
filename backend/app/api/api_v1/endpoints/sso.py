from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from fastapi_sso.sso.google import GoogleSSO
from fastapi_sso.sso.microsoft import MicrosoftSSO
import os
from app.core.config import settings

# Placeholder config - in prod use Env Vars
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "mock-client-id")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "mock-secret")
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "mock-client-id")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "mock-secret")

router = APIRouter()

google_sso = GoogleSSO(
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    redirect_uri="http://localhost:8000/api/v1/auth/google/callback",
    allow_insecure_http=True
)

microsoft_sso = MicrosoftSSO(
    client_id=MICROSOFT_CLIENT_ID,
    client_secret=MICROSOFT_CLIENT_SECRET,
    redirect_uri="http://localhost:8000/api/v1/auth/microsoft/callback",
    allow_insecure_http=True
)

@router.get("/google/login")
async def google_login():
    return await google_sso.get_login_redirect()

@router.get("/google/callback")
async def google_callback(request: Request):
    try:
        user = await google_sso.verify_and_process(request)
        # Here we would:
        # 1. Check if user exists in DB by email
        # 2. If not, create them
        # 3. Create JWT token
        # 4. Redirect to Frontend Dashboard with token
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "message": "SSO Success! In a real app, we'd set a cookie/token here."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/microsoft/login")
async def microsoft_login():
    return await microsoft_sso.get_login_redirect()

@router.get("/microsoft/callback")
async def microsoft_callback(request: Request):
    try:
        user = await microsoft_sso.verify_and_process(request)
        return {
            "id": user.id,
            "email": user.email,
            "message": "Microsoft SSO Success!"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
