# ruff: noqa: F403
# libraries
from fastapi import APIRouter, Depends

# local
from .settings import app
from .event_handler import *
from .exception_handle import *
from routers.authentication.auth import auth_handler
from routers import authentication
from routers.study_tools import pomodoros, todolist
from routers.users import settings

non_auth_modules = [authentication]
auth_modules = [pomodoros, todolist, settings]

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
        dependencies=[Depends(auth_handler.auth_wrapper)],
    )
