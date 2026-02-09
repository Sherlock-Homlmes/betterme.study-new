from datetime import datetime
from pydantic import Field, BaseModel
from beanie import Document

# local
from utils.time_modules import vn_now


class PomodoroSectionSettings(BaseModel):
    pomodoro_study_time: int = Field(default=25 * 60, ge=5 * 60, le=180 * 60)
    pomodoro_rest_time: int = Field(default=5 * 60, ge=1 * 60)
    pomodoro_long_rest_time: int = Field(default=20 * 60, ge=1 * 60)
    long_rest_time_interval: int = Field(default=3, ge=1, le=10)


class PomodoroRooms(Document):
    room_name: str
    livekit_room_name: str
    room_settings: PomodoroSectionSettings
    limit: int
    created_by: str
    created_at: datetime = Field(default_factory=vn_now)
