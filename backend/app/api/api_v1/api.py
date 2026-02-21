from fastapi import APIRouter

from app.modules.generic import endpoints as generic_endpoints
from app.modules.educational import endpoints as edu_endpoints
from app.modules.core import endpoints as core_endpoints
from app.api.api_v1.endpoints.users import router as users_router
from app.api.api_v1.endpoints.auth import router as auth_router

from app.api.api_v1.endpoints import sso
from app.api.api_v1.endpoints import monitoring
from app.modules.generic import integrity_endpoints
from app.api.api_v1.endpoints import timesheet
from app.modules.generic import rights_endpoints

api_router = APIRouter()
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
# api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(generic_endpoints.router, prefix="/generic", tags=["generic"])
api_router.include_router(core_endpoints.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(edu_endpoints.router, prefix="/educational", tags=["educational"])
api_router.include_router(sso.router, prefix="/auth", tags=["sso"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(timesheet.router, prefix="/timeSheet", tags=["timesheet"])
api_router.include_router(timesheet.router, prefix="/timesheet", tags=["timesheet"])
api_router.include_router(timesheet.router, prefix="/time-sheet", tags=["timesheet"])
api_router.include_router(timesheet.router, prefix="/timesheets", tags=["timesheet"])
api_router.include_router(timesheet.router, prefix="/monitoring/timesheet", tags=["timesheet"])
api_router.include_router(timesheet.router, prefix="/monitoring/time-sheet", tags=["timesheet"])
api_router.include_router(rights_endpoints.router, prefix="/rights", tags=["rights"])
api_router.include_router(integrity_endpoints.router, prefix="/integrity", tags=["integrity"])


