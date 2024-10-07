# fastapi
from pydantic import BaseModel, Field, validator
from typing import Optional, List

# local
from other_modules.time_modules import str_to_time


class Task(BaseModel):
    title: str
    description: str = Field(default="")
    status: str = Field(default="TO-DO")
    necessary: str = Field(default="NORMAL")
    difficult: int = Field(default=3, ge=1, le=5)
    deadline: Optional[str] = Field(default=None)
    task_categories: Optional[List[str]] = Field(default=[])

    @validator("deadline")
    def status_in_list(cls, v):
        # example: 2022/01/01 11:11:11
        try:
            convert_time = str_to_time(v)
        except ValueError:
            raise ValueError("Invalid time str")
        return convert_time
