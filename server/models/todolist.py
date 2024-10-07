from pydantic import Field, validator
from beanie import Document, Link
from typing import Optional, List
import datetime

# local
from .users import Users
from .taskcategories import TaskCategories

from other_modules.time_modules import vn_now


class TodoList(Document):
    user: Link[Users]
    title: str = Field(max_length=200)
    description: str = Field(max_length=1000, default="")
    status: str = "TO-DO"
    necessary: str = "NORMAL"
    difficult: int = Field(default=3, ge=1, le=5)
    deadline: Optional[datetime.datetime] = None
    task_categories: Optional[List[Link[TaskCategories]]] = Field(
        default=[], max_items=10
    )

    created_at: datetime.datetime = vn_now()
    updated_at: datetime.datetime = vn_now()

    @validator("status")
    def status_in_list(cls, v):
        if v not in ["TO-DO", "DOING", "DONE", "EXPIRED"]:
            raise ValueError("invalid status")
        return v

    @validator("necessary")
    def necessary_in_list(cls, v):
        if v not in ["NOT IMPORTANT", "NORMAL", "QUITE IMPORTANT", "VERY IMPORTANT"]:
            raise ValueError("invalid neccessary")
        return v

    def update_value(self, task):
        self.title = task.title
        self.description = task.description
        self.status = task.status
        self.necessary = task.necessary
        self.difficult = task.difficult
        self.deadline = task.deadline
