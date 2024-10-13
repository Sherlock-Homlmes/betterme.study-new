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
    difficult: int = Field(default=3, ge=1, le=5)
    deadline: Optional[str] = Field(default=None)
    task_category_ids: Optional[List[str]] = Field(default=[])

    @validator("deadline")
    def status_in_list(cls, v):
        # example: 2022/01/01 11:11:11
        try:
            if v:
                convert_time = str_to_time(v)
            return None
        except ValueError:
            raise ValueError("Invalid time str")
        return convert_time


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
