# ruff: noqa: F403
# libraries
from fastapi import APIRouter, Depends

# local
from routers.authentication.auth import auth_handler, livekit_webhook_handler
from routers.authentication import router as authentication_router
from routers.v1.pomodoros.api import router as pomodoros_router
from routers.v1.livekit.api import router as livekit_router
from routers.v1.ai.api import router as ai_router
from routers.v1.posts.api import router as posts_router
from routers.v1.statistic.api import router as statistic_router
from routers.v1.todolist.api import router as tasks_router
from routers.v1.users.api import router as users_router

from routers.v2.tasks.api import router as tasks_router_v2
from routers.v2.taskcategories.api import router as taskcategories_router_v2
from routers.v2.posts.api import router as posts_router_v2
from routers.v2.pomodoros.api import router as pomodoros_router_v2
from routers.v2.pomodoro_rooms.api import router as pomodoro_rooms_router_v2
from routers.v2.pomodoro_rooms.sse import router as pomodoro_rooms_sse_router_v2
from routers.v2.webhooks.api import router as webhook_v2
from routers.v2.statistic.api import router as statistic_router_v2

# from routers.news_admin import ai as admin_ai, crawlers, draft_posts, posts as admin_posts
# news_admin_modules = (crawlers, draft_posts, admin_posts, admin_ai)

# V1
api_router = APIRouter(
    prefix="/api",
    responses={404: {"description": "Not found"}},
)

# single auth method
non_auth_modules = (
    authentication_router,
    posts_router,
    livekit_router,
)
auth_modules = (
    pomodoros_router,
    tasks_router,
    users_router,
    ai_router,
    statistic_router,
)
access_key_modules = ()

# multiple auth method
access_key_or_jwt_modules = ()

for module in non_auth_modules:
    api_router.include_router(module)

for module in auth_modules:
    api_router.include_router(
        module,
        dependencies=[Depends(auth_handler.auth_wrapper)],
    )

# for module in news_admin_modules:
#     api_router.include_router(
#         module,
#         dependencies=[Depends(auth_handler.news_admin_auth_wrapper)],
#     )

# for module in access_key_modules:
#     api_router.include_router(
#         module,
#         dependencies=[Depends(auth_handler.access_token_auth_wrapper)],
#     )

# for module in access_key_or_jwt_modules:
#     api_router.include_router(
#         module,
#         dependencies=[Depends(auth_handler.access_token_or_jwt_auth_wrapper)],
#     )

# V2
api_router_v2 = APIRouter(
    prefix="/api/v2",
    responses={404: {"description": "Not found"}},
)
non_auth_modules_v2 = (
    posts_router_v2,
    webhook_v2,
)
auth_modules_v2 = (
    taskcategories_router_v2,
    tasks_router_v2,
    pomodoros_router_v2,
    pomodoro_rooms_router_v2,
    pomodoro_rooms_sse_router_v2,
    statistic_router_v2,
)

for module in non_auth_modules_v2:
    api_router_v2.include_router(
        module,
    )

for module in auth_modules_v2:
    api_router_v2.include_router(
        module,
        dependencies=[Depends(auth_handler.auth_wrapper)],
    )
