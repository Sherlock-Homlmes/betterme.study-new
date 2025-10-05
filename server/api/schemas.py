import datetime
from typing import List
from pydantic import BaseModel


class DataUserDailyStudyTime(BaseModel):
    study_time: List[int]
    date: datetime.datetime


class UserStatsGetResponse(BaseModel):
    user_discord_id: int
    total: int
    daily_study_time: List[DataUserDailyStudyTime]

    def daily_study_time_to_object(self):
        result = {}
        for data in self.daily_study_time:
            date_str = data.date.strftime("%d/%m")
            result[date_str] = data.study_time
        return result


class StatisticDataItem(BaseModel):
    name: str
    total: int
    date: str


class StatisticsResponse(BaseModel):
    daily_study_time_data: List[StatisticDataItem]
