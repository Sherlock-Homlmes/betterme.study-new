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
from routers.user import posts, user, ai, audios

from routers.news_admin import ai as admin_ai, crawlers, draft_posts, posts as admin_posts

api_router = APIRouter()

# single auth method
non_auth_modules = (authentication, posts)
auth_modules = (
    pomodoros,
    todolist,
    user,
    ai,
)
news_admin_modules = (crawlers, draft_posts, admin_posts, admin_ai)
access_key_modules = ()

# multiple auth method
access_key_or_jwt_modules = (audios,)

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

for module in news_admin_modules:
    api_router.include_router(
        module.router,
        prefix="/api",
        dependencies=[Depends(auth_handler.news_admin_auth_wrapper)],
    )

for module in access_key_modules:
    api_router.include_router(
        module.router,
        prefix="/api",
        dependencies=[Depends(auth_handler.access_token_auth_wrapper)],
    )

for module in access_key_or_jwt_modules:
    api_router.include_router(
        module.router,
        prefix="/api",
        dependencies=[Depends(auth_handler.access_token_or_jwt_auth_wrapper)],
    )


app.include_router(api_router)
