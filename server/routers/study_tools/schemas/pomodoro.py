import datetime
from typing import Optional

from pydantic import BaseModel, model_validator

from models.pomodoros import PomodoroStatusEnum


class GetPomodoroResponse(BaseModel):
    id: str
    user_id: str
    duration: int
    start_at: datetime.datetime
    end_at: Optional[datetime.datetime]
    status: PomodoroStatusEnum

    # TODO: to BaseSchemaModel
    @model_validator(mode="before")
    @classmethod
    def id_valid_str(cls, data):
        data.id = str(data.id)
        return data


class PatchPomodoroPayload(BaseModel):
    action: PomodoroStatusEnum
