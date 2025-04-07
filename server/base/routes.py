# ruff: noqa: F403
# libraries
from fastapi import APIRouter, Depends

# local
from .settings import app
from .event_handler import *
from .exception_handle import *

from routers.authentication.auth import auth_handler
from routers import authentication

from routers.user.study_tools import pomodoros, todolist
from routers.user import posts, user

from routers.news_admin import ai, crawlers, draft_posts, posts as admin_posts

api_router = APIRouter()
non_auth_modules = (authentication, posts)
auth_modules = (pomodoros, todolist, user, ai, crawlers, draft_posts, admin_posts)

router = APIRouter(
    prefix="/api",
    responses={404: {"description": "Not found"}},
)

for module in non_auth_modules:
    api_router.include_router(
        module.router,
        prefix="/api",
    )

for module in auth_modules:
    api_router.include_router(
        module.router,
        prefix="/api",
        dependencies=[Depends(auth_handler.auth_wrapper)],
    )

app.include_router(api_router)
