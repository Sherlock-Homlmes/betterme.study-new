from typing import Optional

from pydantic import BaseModel, Field

from models.users import UserVisualSettings, UserLanguageEnum, UserPomodoroSettings


class PatchUserSetting(BaseModel):
    language: Optional[UserLanguageEnum] = None
    visuals: Optional[UserVisualSettings] = None
    pomodoro_settings: Optional[UserPomodoroSettings] = None
