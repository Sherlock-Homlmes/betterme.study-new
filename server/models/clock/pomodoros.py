from pydantic import Field
from beanie import Document, before_event, Insert
from typing import Optional, List
import datetime
from datetime import timedelta
from bson.objectid import ObjectId
from enum import Enum
from fastapi import HTTPException

# local
from ..users import UserSettings

from utils.time_modules import vn_now


class PomodoroStatusEnum(str, Enum):
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"
    PAUSED = "PAUSED"


class Pomodoros(Document):
    user_id: str
    duration: Optional[int] = Field(ge=5 * 60, lt=180 * 60, default=None)
    # tasks: Optional[List[Link[TodoList]]]
    tasks: Optional[List[str]] = Field(max_items=10, default=[])

    start_at: Optional[datetime.datetime] = None
    end_at: Optional[datetime.datetime] = None

    status: Optional[PomodoroStatusEnum] = PomodoroStatusEnum.STARTED

    ### Settings
    # class Settings:
    #     use_cache = True
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
    async def pause_section(self):
        await self.set({Pomodoros.status: PomodoroStatusEnum.PAUSED})

    async def resume_section(self):
        if self.status == PomodoroStatusEnum.PAUSED:
            await self.set({Pomodoros.status: PomodoroStatusEnum.STARTED})

    async def end_section(self):
        if (
            self.status == PomodoroStatusEnum.STARTED
            and self.start_at + timedelta(seconds=self.duration - 60) <= vn_now()
        ):
            await self.set(
                {Pomodoros.end_at: vn_now(), Pomodoros.status: PomodoroStatusEnum.COMPLETED}
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid pomodoro section")

    async def delete_section(self):
        if self.status != PomodoroStatusEnum.COMPLETED:
            await self.delete()
            return
        raise HTTPException(status_code=400, detail="Can not delete completed pomodoro section")

    @staticmethod
    async def get_last_pomodoro(user_id: str) -> bool:
        return await Pomodoros.find_one(Pomodoros.user_id == user_id, sort=[("start_at", -1)])

    def check_available_to_create(self) -> bool:
        return self.status == PomodoroStatusEnum.COMPLETED
