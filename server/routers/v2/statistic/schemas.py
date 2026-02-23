from typing import List, Optional
from pydantic import BaseModel


class StudyTime(BaseModel):
    total_study_time: int
    date_range: str


class StatisticsResponse(BaseModel):
    total_study_time: int
    study_day_count: int
    study_time_per_day: int
    longest_streak: int
    pomodoro_count: int
    data: List[StudyTime]
