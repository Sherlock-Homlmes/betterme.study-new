# default
from typing import List
from bson.objectid import ObjectId

# libraries
from fastapi import APIRouter, HTTPException, Depends

# local
from routers.authentication import auth_handler
from models import Users, Pomodoros, PomodoroStatusEnum
from .schemas import GetPomodoroResponse, PatchPomodoroPayload

router = APIRouter(
    tags=["Study tools-Pomodoro"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/pomodoros",
    description="get list of pomodoro",
)
async def get_list_of_pomodoros(
    user: Users = Depends(auth_handler.auth_wrapper),
) -> List[GetPomodoroResponse]:
    return await Pomodoros.find(Pomodoros.user_id == user["id"], sort=[("start_at", -1)]).to_list()


# @router.get(
#     "/pomodoros/_current",
#     description="get a pomodoro",
# )
# async def get_current_pomodoro(
#     user: Users = Depends(auth_handler.auth_wrapper),
# ) -> GetPomodoroResponse:
#     if pomodoro := await Pomodoros.get_last_pomodoro(user["id"]):
#         return pomodoro
#     return None


@router.get(
    "/pomodoros/{pomodoro_id}",
    description="get a pomodoro",
)
async def get_a_pomodoro(
    pomodoro_id: str, user: Users = Depends(auth_handler.auth_wrapper)
) -> GetPomodoroResponse:
    if pomodoro := await Pomodoros.find_one(
        Pomodoros.id == ObjectId(pomodoro_id),
        Pomodoros.user_id == user["id"],
    ):
        return pomodoro
    raise HTTPException(status_code=404, detail="Pomodoro not exist")


@router.post(
    "/pomodoros",
    description="create a pomodoro",
    status_code=201,
)
async def create_a_pomodoro(
    user: Users = Depends(auth_handler.auth_wrapper),
) -> GetPomodoroResponse:
    if await Pomodoros.check_available_to_create(user_id=user["id"]):
        pomodoro = Pomodoros(user_id=user["id"])
        await pomodoro.insert()
        return pomodoro
    raise HTTPException(status_code=400, detail="Invalid pomodoro section")


@router.patch(
    "/pomodoros/{pomodoro_id}",
    description="create a pomodoro",
    status_code=204,
)
async def update_a_pomodoro(
    pomodoro_id: str,
    payload: PatchPomodoroPayload,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    if pomodoro := await Pomodoros.find_one(
        Pomodoros.id == ObjectId(pomodoro_id),
        Pomodoros.user_id == user["id"],
    ):
        if payload.action == PomodoroStatusEnum.PAUSED:
            await pomodoro.pause()
        elif payload.action == PomodoroStatusEnum.COMPLETED:
            await pomodoro.end()

        return

    raise HTTPException(status_code=404, detail="Pomodoro not exist")
