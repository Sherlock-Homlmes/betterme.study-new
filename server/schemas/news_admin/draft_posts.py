# default
from typing import Union

# libraries
from pydantic import BaseModel, Field

# local
from .enums import (
    OriginCrawlPagesEnum,
)
from .crawlers import GetCrawlersIvolunteerDataResponse
from .enums import AIPromtTypeEnum


class GetDraftPostListResponse(BaseModel):
    id: str
    source: OriginCrawlPagesEnum
    name: str
    original_data: GetCrawlersIvolunteerDataResponse
    draft_data: GetCrawlersIvolunteerDataResponse
    post: Union[str, None]


# ai.py
class PostAIPromtPayload(BaseModel):
    prompt_type: AIPromtTypeEnum
    context: str = Field(min_length=1, max_length=6000)
