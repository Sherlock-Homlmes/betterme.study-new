import datetime

# fastapi
from pydantic import Field, model_validator
from typing import Optional, List

# local
from base.custom.schemas import BaseSchema, Pagination
from models.pomodoro.tasks import TaskStatusEnum


class GetTaskListQuery(Pagination):
    pass


class BaseTask(BaseSchema):
    title: str
    description: str = Field(default="")
    status: str = Field(default=TaskStatusEnum.TODO)
    # TODO: to enum
    necessary: str = Field(default="NORMAL")
    difficult: int = Field(ge=1, le=5, default=3)
    deadline: Optional[datetime.datetime] = Field(default=None)
    task_category_ids: Optional[List[str]] = Field(default=[])
    index: int = Field(ge=1, default=1)


class CreateTask(BaseTask):
    pass


class PatchTaskPayload(BaseSchema):
    title: Optional[str] = None


class GetTaskResponse(BaseTask):
    id: str

    # TODO: to BaseSchemaModel
    @model_validator(mode="before")
    @classmethod
    def id_valid_str(cls, data):
        data.id = str(data.id)
        return data
