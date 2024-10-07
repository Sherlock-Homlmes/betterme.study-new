# fastapi
from pydantic import BaseModel, Field
from typing import Optional, List


class Pomodoro(BaseModel):
    tasks: Optional[List[str]] = Field(default=[])
