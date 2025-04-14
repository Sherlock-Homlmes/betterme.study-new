from typing import Optional, Annotated
from pydantic import BaseModel, HttpUrl, AfterValidator, Field
from typing import List

HttpUrlString = Annotated[HttpUrl, AfterValidator(lambda v: str(v))]


class LeaderboardEntry(BaseModel):
    id: str = Field(alias="_id")
    total_study_time: int
    img: HttpUrlString
    img_position: List[int]
    img_size: int
    text_position: List[float]
    text: str
    text_font_size: int
    time_position: List[float]
    time: str
    time_font_size: int


class CreateLeaderboardImagePayload(BaseModel):
    leaderboard_data: List[LeaderboardEntry]
    start_idx: int
    target_idx: Optional[int] = None


class CreateLeaderboardImageResponse(BaseModel):
    link: str
