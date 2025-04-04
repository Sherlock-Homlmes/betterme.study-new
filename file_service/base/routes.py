# ruff: noqa: F403
# libraries
from fastapi import APIRouter, Depends

# local
from routers import audios
from .conf import app

non_auth_modules = []
auth_modules = [
    audios,
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
        # dependencies=[Depends(auth_handler.auth_wrapper)],
    )
