# default
from typing import Optional

# lib
from pydantic import BaseModel

# local
from models.users import UserVisualSettings, UserLanguageEnum, UserPomodoroSettings


class PatchUserInfo(BaseModel):
    custom_name: Optional[str] = None
    avatar_url: Optional[str] = None


class PatchUserSetting(BaseModel):
    language: Optional[UserLanguageEnum] = None
    visuals: Optional[UserVisualSettings] = None
    pomodoro_settings: Optional[UserPomodoroSettings] = None
