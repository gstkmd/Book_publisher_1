from fastapi import APIRouter

from app.modules.generic import endpoints as generic_endpoints
from app.modules.educational import endpoints as edu_endpoints
from app.modules.generic import endpoints as generic_endpoints
from app.modules.core import endpoints as core_endpoints

api_router = APIRouter()
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
# api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(generic_endpoints.router, prefix="/generic", tags=["generic"])
api_router.include_router(core_endpoints.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(edu_endpoints.router, prefix="/educational", tags=["educational"])

from app.api.api_v1.endpoints import sso
api_router.include_router(sso.router, prefix="/auth", tags=["sso"])
