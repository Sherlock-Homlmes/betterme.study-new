import datetime
from typing import Optional

from pydantic import BaseModel

from models.pomodoro.pomodoros import PomodoroStatusEnum
from base.custom.types import IDStr
from base.custom.schemas import BaseSchema, Pagination


class GetListPomodoroQuery(Pagination):
    pass


class GetPomodoroResponse(BaseSchema):
    id: IDStr
    user_id: str
    duration: int
    start_at: datetime.datetime
    end_at: Optional[datetime.datetime]
    status: PomodoroStatusEnum


class PatchPomodoroPayload(BaseSchema):
    action: PomodoroStatusEnum
