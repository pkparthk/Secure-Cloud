from fastapi import APIRouter

from app.api.endpoints import admin, developer, auth, soc, common
from app.aws.ec2 import router as ec2_router



api_router = APIRouter()

api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(developer.router, prefix="/developer", tags=["Developer"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(soc.router, prefix="/soc", tags=["SOC"])

api_router.include_router(ec2_router, prefix="/ec2", tags=["EC2"])