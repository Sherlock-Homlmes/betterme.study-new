# default
from typing import List
from bson.objectid import ObjectId

# libraries
from fastapi import APIRouter, HTTPException, Depends

# local
from .schemas import Pomodoro
from routers.authentication import auth_handler
from models import Users, Pomodoros

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
) -> List[Pomodoros]:
    pomodoros = await Pomodoros.find(Pomodoros.user_id == user["id"]).to_list()
    return pomodoros


@router.get(
    "/pomodoros/{pomodoro_id}",
    description="get a pomodoro",
)
async def get_a_pomodoro(pomodoro_id: str, user: Users = Depends(auth_handler.auth_wrapper)):
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
async def create_a_pomodoro(user: Users = Depends(auth_handler.auth_wrapper)):
    if await Pomodoros.check_available(user_id=user["id"]):
        pomodoro = Pomodoros(
            user=user["id"],
            time=await Pomodoros.get_section_time(user_id=user["id"]),
        )
        await pomodoro.insert()
        return pomodoro
    raise HTTPException(status_code=400, detail="Invalid pomodoro section")
