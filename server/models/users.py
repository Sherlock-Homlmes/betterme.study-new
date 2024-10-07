# default
import datetime
from typing import Optional
from pydantic import EmailStr, ValidationError, validator, Field
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

    discord_id: Optional[str] = None
    google_id: Optional[str] = None
    facebook_id: Optional[str] = None

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
            "name": self.name,
            "email": self.email,
            "avatar_url": self.avatar,
        }


class UserSettings(Document):
    user: Link[Users]
    pomodoro_study_time: int = Field(default=25, ge=5, lt=180)
    pomodoro_rest_time: int = Field(default=5, ge=1)
    pomodoro_long_rest_time: int = Field(default=20, ge=1)

    def update_value(self, user_setting):
        self.pomodoro_study_time = user_setting.pomodoro_study_time
        self.pomodoro_rest_time = user_setting.pomodoro_rest_time
        self.pomodoro_long_rest_time = user_setting.pomodoro_long_rest_time
