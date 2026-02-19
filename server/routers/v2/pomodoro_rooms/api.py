# default
from typing import List
from bson.objectid import ObjectId

# libraries
from fastapi import HTTPException, Depends, Response
from pydantic import BaseModel

# local
from routers.authentication import auth_handler
from models import Users, PomodoroRooms
from base.custom.router import BaseRouter
from .crud import PomodoroRoomCRUD
from .schemas import (
    PostPomodoroRoomPayload,
    GetPomodoroRoomResponse,
    JoinRoomPayload,
    JoinRoomResponse,
)
from models.pomodoro.pomodoro_rooms import PomodoroSectionSettings
from datetime import datetime


router = BaseRouter(
    prefix="/pomodoro-rooms",
    tags=["Study tools - Pomodoro room - V2"],
    responses={404: {"description": "Not found"}},
)
p_room_crud = PomodoroRoomCRUD()


@router.get_list("/", description="get list of pomodoro")
async def get_list_of_pomodoros(
    response: Response,
) -> List[dict]:
    # Query params are not used since we're getting from LiveKit directly
    return await p_room_crud.get_list()


@router.post(
    "/",
    description="create a pomodoro room",
    status_code=201,
)
async def create_a_pomodoro(
    payload: PostPomodoroRoomPayload,
    current_user: Users = Depends(auth_handler.auth_wrapper),
) -> dict:
    return await p_room_crud.create(payload, current_user["id"])


@router.post(
    "/join",
    description="generate token to join a pomodoro room",
    status_code=200,
)
async def join_pomodoro_room(
    payload: JoinRoomPayload,
    current_user: Users = Depends(auth_handler.auth_wrapper),
) -> JoinRoomResponse:
    """Generate a token for a participant to join a LiveKit room."""
    # Get room info from LiveKit using livekit_room_name
    room = await p_room_crud.get_room_by_name(payload.livekit_room_name)

    # Generate token using livekit_room_name
    token = p_room_crud.generate_join_token(
        room_name=room["livekit_room_name"], current_user=current_user
    )
    return JoinRoomResponse(token=token)
