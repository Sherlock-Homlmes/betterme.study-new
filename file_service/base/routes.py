# ruff: noqa: F403
# libraries
from fastapi import APIRouter, Depends

# local
from routers import audios, images
from routers.authorization_handler import auth
from .conf import app

non_auth_modules = []
auth_modules = [
    audios,
    images,
]

router = APIRouter(
    prefix="/api",
    responses={404: {"description": "Not found"}},
)

for module in non_auth_modules:
    app.include_router(module.router)

for module in auth_modules:
    app.include_router(
        module.router,
        prefix="/api",
        dependencies=[Depends(auth)],
    )
