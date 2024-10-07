# fastapi
from fastapi import HTTPException, Depends

# default
from bson.objectid import ObjectId

# local
from . import router
from authentication import auth_handler

from .schemas import Pomodoro
from models import Users, Pomodoros


@router.get(
    "/pomodoros",
    description="get list of pomodoro",
    dependencies=[Depends(auth_handler.auth_wrapper)],
)
async def get_list_of_pomodoros(user: Users = Depends(auth_handler.auth_wrapper)):
    pomodoros = await Pomodoros.find(
        Pomodoros.user.id == ObjectId(user["id"])
    ).to_list()
    for pomodoro in pomodoros:
        del pomodoro.user
    return pomodoros


@router.get(
    "/pomodoros/{pomodoro_id}",
    description="get a pomodoro",
    dependencies=[Depends(auth_handler.auth_wrapper)],
)
async def get_a_pomodoro(
    pomodoro_id: str, user: Users = Depends(auth_handler.auth_wrapper)
):
    pomodoro = await Pomodoros.find_one(
        Pomodoros.id == ObjectId(pomodoro_id),
        Pomodoros.user.id == ObjectId(user["id"]),
    )
    if pomodoro:
        del pomodoro.user
        return pomodoro
    raise HTTPException(status_code=404, detail="Pomodoro not exist")


@router.post(
    "/pomodoros",
    description="create a pomodoro",
    dependencies=[Depends(auth_handler.auth_wrapper)],
    status_code=201,
)
async def create_a_pomodoro(
    pomodoro: Pomodoro, user: Users = Depends(auth_handler.auth_wrapper)
):
    if await Pomodoros.check_available(user_id=user["id"]):
        pomodoro = Pomodoros(
            user=user["id"],
            time=await Pomodoros.get_section_time(user_id=user["id"]),
            **pomodoro.__dict__
        )
        await pomodoro.insert()
        del pomodoro.user
        return pomodoro
    raise HTTPException(status_code=400, detail="Invalid pomodoro section")
