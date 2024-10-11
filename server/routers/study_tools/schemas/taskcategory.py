# fastapi
from pydantic import BaseModel, Field


class TaskCategory(BaseModel):
    title: str = Field(max_length=200)
    description: str = Field(max_length=1000)
    color: str = Field(max_length=10, default="#fff")
