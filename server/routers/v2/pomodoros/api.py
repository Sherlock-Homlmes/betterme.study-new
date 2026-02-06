# default
from typing import List
from bson.objectid import ObjectId

# libraries
from fastapi import HTTPException, Depends, Response

# local
from routers.authentication import auth_handler
from models import Users, Pomodoros, PomodoroStatusEnum
from base.custom.router import BaseRouter
from .crud import PomodoroCRUD
from .schemas import GetPomodoroResponse, PatchPomodoroPayload, GetListPomodoroQuery

router = BaseRouter(
    prefix="/pomodoros",
    tags=["Study tools - Pomodoro - V2"],
    responses={404: {"description": "Not found"}},
)
pomodoro_crud = PomodoroCRUD()


@router.get_list("/", description="get list of pomodoro")
async def get_list_of_pomodoros(
    response: Response,
    query: GetListPomodoroQuery = Depends(),
    current_user: Users = Depends(auth_handler.auth_wrapper),
) -> List[GetPomodoroResponse]:
    query = query.get_db_query()
    return await pomodoro_crud.get_list(match_user_id=current_user["id"], **query)


@router.get("/{pomodoro_id}", description="get a pomodoro")
async def get_a_pomodoro(
    pomodoro_id: str, current_user: Users = Depends(auth_handler.auth_wrapper)
) -> GetPomodoroResponse:
    return await pomodoro_crud.get_one(
        match_id=pomodoro_id, match_user_id=current_user["id"], raise_if_missing=True
    )


@router.post(
    "/",
    description="create a pomodoro",
    status_code=201,
)
async def create_a_pomodoro(
    current_user: Users = Depends(auth_handler.auth_wrapper),
) -> GetPomodoroResponse:
    return await pomodoro_crud.create(current_user["id"])


@router.patch(
    "/{pomodoro_id}",
    description="update a pomodoro",
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
        if payload.action == PomodoroStatusEnum.STARTED:
            await pomodoro.resume_section()
        elif payload.action == PomodoroStatusEnum.PAUSED:
            await pomodoro.pause_section()
        elif payload.action == PomodoroStatusEnum.COMPLETED:
            await pomodoro.end_section()

        return

    raise HTTPException(status_code=404, detail="Pomodoro not exist")


@router.delete(
    "/_last",
    description="delete a pomodoro",
    status_code=204,
)
async def delete_a_pomodoro(
    current_user: Users = Depends(auth_handler.auth_wrapper),
):
    await pomodoro_crud.delete_last_section(current_user["id"])
