from pydantic import BaseModel, Field


class UserSetting(BaseModel):
    pomodoro_study_time: int = Field(default=25, ge=1)
    pomodoro_rest_time: int = Field(default=5, ge=1)
    pomodoro_long_rest_time: int = Field(default=20, ge=1)
