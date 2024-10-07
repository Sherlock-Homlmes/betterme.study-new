from pydantic import Field
from beanie import Document, Link
from typing import Optional, List
import datetime
from datetime import timedelta
from bson.objectid import ObjectId

# local
from .users import Users, UserSettings
from .todolist import TodoList

from other_modules.time_modules import vn_now


class Pomodoros(Document):
    user: Link[Users]
    time: int = Field(ge=5, lt=180)
    tasks: Optional[List[Link[TodoList]]] = Field(max_items=10)

    end_section_time: datetime.datetime = vn_now()

    @staticmethod
    async def check_available(user_id: str) -> bool:
        last_pomodoro = await Pomodoros.find_one(
            Pomodoros.user.id == ObjectId(user_id), sort=[("end_section_time", -1)]
        )
        if last_pomodoro:
            user_setting = await UserSettings.find_one(
                UserSettings.user.id == ObjectId(user_id)
            )

            if (
                vn_now() - timedelta(minutes=user_setting.pomodoro_study_time)
                < last_pomodoro.end_section_time
            ):
                return False
        return True

    @staticmethod
    async def get_section_time(user_id: str) -> int:
        user_setting = await UserSettings.find_one(
            UserSettings.user.id == ObjectId(user_id)
        )
        return user_setting.pomodoro_study_time
