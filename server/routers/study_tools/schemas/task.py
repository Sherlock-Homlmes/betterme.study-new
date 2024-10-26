import datetime

# fastapi
from pydantic import BaseModel, Field, validator, model_validator
from typing import Optional, List

# local
from other_modules.time_modules import str_to_time


class Task(BaseModel):
    title: str
    description: str = Field(default="")
    # TODO: to enum
    status: str = Field(default="TO-DO")
    necessary: str = Field(default="NORMAL")
    difficult: int = Field(ge=1, le=5, default=3)
    deadline: Optional[datetime.datetime] = Field(default=None)
    task_category_ids: Optional[List[str]] = Field(default=[])
    priority: int = Field(ge=1, default=1)


class PatchTaskPayload(Task):
    title: Optional[str] = None


class GetTaskResponse(Task):
    id: str

    # TODO: to BaseSchemaModel
    @model_validator(mode="before")
    @classmethod
    def id_valid_str(cls, data):
        data.id = str(data.id)
        return data
