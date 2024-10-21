from pydantic import Field
from beanie import Document, Link, before_event, Insert
from typing import Optional, List
import datetime
from datetime import timedelta
from bson.objectid import ObjectId
from enum import Enum
from fastapi import HTTPException

# local
from .users import Users, UserSettings
from .todolist import TodoList

from other_modules.time_modules import vn_now


class PomodoroStatusEnum(str, Enum):
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"
    PAUSED = "PAUSED"


class Pomodoros(Document):
    user_id: str
    duration: Optional[int] = Field(ge=5, lt=180, default=None)
    # tasks: Optional[List[Link[TodoList]]]
    tasks: Optional[List[str]] = Field(max_items=10, default=[])

    start_at: Optional[datetime.datetime] = None
    end_at: Optional[datetime.datetime] = None

    status: Optional[PomodoroStatusEnum] = PomodoroStatusEnum.STARTED

    ### Settings
    # class Settings:
    #     use_cache = False
    #     cache_expiration_time = datetime.timedelta(seconds=1)
    #     cache_capacity = 100

    ### Events
    @before_event(Insert)
    # start_pomodoro_section
    async def set_time_and_start_time(self):
        user_setting = await UserSettings.find_one(UserSettings.user.id == ObjectId(self.user_id))
        pomodoro_study_time = user_setting.pomodoro_settings.pomodoro_study_time
        self.duration = pomodoro_study_time
        self.start_at = vn_now()

    ### Functions
    async def pause(self):
        await self.set({Pomodoros.status: PomodoroStatusEnum.PAUSED})

    async def end(self):
        if self.start_at + timedelta(minutes=self.duration) > vn_now():
            raise HTTPException(status_code=400, detail="Invalid pomodoro section")
        await self.set({Pomodoros.end_at: vn_now(), Pomodoros.status: PomodoroStatusEnum.COMPLETED})

    @staticmethod
    async def get_last_pomodoro(user_id: str) -> bool:
        return await Pomodoros.find_one(Pomodoros.user_id == user_id, sort=[("start_at", -1)])

    @staticmethod
    async def check_available_to_create(user_id: str) -> bool:
        if last_pomodoro := await Pomodoros.get_last_pomodoro(user_id):
            return last_pomodoro.status == PomodoroStatusEnum.COMPLETED
        return True
