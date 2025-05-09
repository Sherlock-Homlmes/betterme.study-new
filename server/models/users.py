# default
import datetime
from enum import Enum
from typing import Optional, List

from pydantic import EmailStr, ValidationError, validator, Field, BaseModel
from beanie import Document, Link, Insert, after_event

# local
from utils.time_modules import vn_now


class UserRoleEnum(str, Enum):
    OWNER = "owner"
    NEWS_ADMIN = "news_admin"
    USER = "user"


class Users(Document):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    user_type: str
    roles: List[UserRoleEnum] = [UserRoleEnum.USER]
    locale: Optional[str] = None

    name: str
    nick: Optional[str] = None
    avatar: Optional[str] = None

    custom_name: Optional[str] = None
    custom_avatar_url: Optional[str] = None

    discord_id: Optional[int] = None
    google_id: Optional[int] = None
    facebook_id: Optional[int] = None

    joined_at: datetime.datetime = vn_now()
    last_logged_in_at: datetime.datetime = vn_now()

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
            "custom_name": self.custom_name,
            "email": self.email,
            "avatar_url": self.avatar,
            "custom_avatar_url": self.custom_avatar_url,
            "roles": self.roles,
        }


# User setting
class UserLanguageEnum(str, Enum):
    ENGLISH = "en"
    VIETNAMESE = "vi"


class TimerShowEnum(str, Enum):
    TRADITIONAL = "traditional"
    APPROXIMATE = "approximate"
    PERCENTAGE = "percentage"


class UserVisualSettings(BaseModel):
    pomodoro_study_color: List[int] = Field(default=[255, 107, 107])
    pomodoro_rest_color: List[int] = Field(default=[244, 162, 97])
    pomodoro_long_rest_color: List[int] = Field(default=[46, 196, 182])

    timer_show: TimerShowEnum = TimerShowEnum.APPROXIMATE

    background: Optional[str] = None
    custom_backgrounds: Optional[List[str]] = None
    dark_mode: Optional[bool] = False
    show_progress_bar: Optional[bool] = False
    show_pip_mode: Optional[bool] = True

    enable_audio: Optional[bool] = True
    enable_adaptive_ticking: Optional[bool] = True
    auto_start_next_time: Optional[bool] = True
    custom_audios: Optional[List[str]] = None


class UserPomodoroSettings(BaseModel):
    pomodoro_study_time: Optional[int] = Field(default=25 * 60, ge=5 * 60, le=180 * 60)
    pomodoro_rest_time: Optional[int] = Field(default=5 * 60, ge=1 * 60)
    pomodoro_long_rest_time: Optional[int] = Field(default=20 * 60, ge=1 * 60)
    long_rest_time_interval: Optional[int] = Field(default=3, ge=1, le=10)


class UserSettings(Document):
    user: Link[Users]
    language: Optional[UserLanguageEnum] = UserLanguageEnum.VIETNAMESE

    visuals: Optional[UserVisualSettings] = UserVisualSettings()
    pomodoro_settings: Optional[UserPomodoroSettings] = UserPomodoroSettings()
