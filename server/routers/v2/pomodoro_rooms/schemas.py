from datetime import datetime
from pydantic import Field

from models.pomodoro.pomodoro_rooms import PomodoroSectionSettings
from base.custom.types import IDStr
from base.custom.schemas import BaseSchema, Pagination


class GetListPomodoroRoomQuery(Pagination):
    pass


class GetPomodoroRoomResponse(BaseSchema):
    id: IDStr
    room_name: str
    livekit_room_name: str
    room_settings: PomodoroSectionSettings
    limit: int
    created_by: str
    created_at: datetime


class PostPomodoroRoomPayload(BaseSchema):
    room_name: str
    limit: int = Field(default=5, ge=1, le=10)
    room_settings: PomodoroSectionSettings
