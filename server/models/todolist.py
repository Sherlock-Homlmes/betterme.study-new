from pydantic import Field, validator
from beanie import Document, Link
from typing import Optional, List
import datetime

# local
from .users import Users
from .taskcategories import TaskCategories

from other_modules.time_modules import vn_now


class TodoList(Document):
    user_id: str
    title: str = Field(max_length=200)
    description: str = Field(max_length=1000, default="")
    status: str = "TO-DO"
    necessary: str = "NORMAL"
    difficult: int = Field(default=3, ge=1, le=5)
    deadline: Optional[datetime.datetime] = None
    task_category_ids: Optional[List[str]] = Field(default=[], max_items=10)

    # TODO: fix to event
    created_at: datetime.datetime = vn_now()
    updated_at: datetime.datetime = vn_now()

    # TODO: fix to enum
    @validator("status")
    def status_in_list(cls, v):
        if v not in ["TO-DO", "DOING", "DONE", "EXPIRED"]:
            raise ValueError("invalid status")
        return v

    # TODO: fix to enum
    @validator("necessary")
    def necessary_in_list(cls, v):
        if v not in ["NOT IMPORTANT", "NORMAL", "QUITE IMPORTANT", "VERY IMPORTANT"]:
            raise ValueError("invalid neccessary")
        return v
