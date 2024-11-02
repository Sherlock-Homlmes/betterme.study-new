# default
import datetime
from enum import Enum
from typing import Optional, List

from pydantic import EmailStr, ValidationError, validator, Field, BaseModel
from beanie import Document, Link, Insert, after_event

# local
from other_modules.time_modules import vn_now


class Users(Document):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    user_type: str
    joined_at: datetime.datetime = vn_now()
    last_logged_in_at: datetime.datetime = vn_now()
    locale: Optional[str] = None

    name: str
    avatar: Optional[str] = None

    discord_id: Optional[int] = None
    google_id: Optional[int] = None
    facebook_id: Optional[int] = None

    @validator("user_type")
    def name_must_contain_space(cls, v: str):
        v = v.lower()
        if v == "normal" and not cls.email and not cls.password:
            raise ValidationError("Missing email and/or password")
        elif v not in ["normal", "discord", "google", "facebook"]:
            raise ValueError("Invalid user type")
        return v.title()

    # trigger
    @after_event(Insert)
    async def create_user_setting(self):
        await UserSettings(user=self.id).insert()

    # function
    def get_info(self):
        return {
            "id": str(self.id),
            "discord_id": self.discord_id,
            "facebook_id": self.facebook_id,
            "google_id": self.google_id,
            "name": self.name,
            "email": self.email,
            "avatar_url": self.avatar,
        }


# User setting
class UserLanguageEnum(str, Enum):
    ENGLISH = "en"
    VIETNAMESE = "vi"


class UserVisualSettings(BaseModel):
    pomodoro_study_color: List[int] = Field(default=[255, 107, 107], max_length=3, min_length=3)
    pomodoro_rest_color: List[int] = Field(default=[244, 162, 97], max_length=3, min_length=3)
    pomodoro_long_rest_color: List[int] = Field(default=[46, 196, 182], max_length=3, min_length=3)

    background: Optional[str] = None
    dark_mode: Optional[bool] = False


class UserPomodoroSettings(BaseModel):
    pomodoro_study_time: Optional[int] = Field(default=25, ge=5, lt=180)
    pomodoro_rest_time: Optional[int] = Field(default=5, ge=1)
    pomodoro_long_rest_time: Optional[int] = Field(default=20, ge=1)
    long_rest_time_interval: Optional[int] = Field(default=3, ge=1, lt=11)

    auto_start_next_time: Optional[bool] = True
    audio: Optional[str] = None
    custom_audio: Optional[str] = None
    show_progress_bar: Optional[bool] = False


class UserSettings(Document):
    user: Link[Users]
    language: Optional[UserLanguageEnum] = UserLanguageEnum.VIETNAMESE

    visuals: Optional[UserVisualSettings] = UserVisualSettings()
    pomodoro_settings: Optional[UserPomodoroSettings] = UserPomodoroSettings()
