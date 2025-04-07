# default
from typing import Union

# libraries
from pydantic import BaseModel

# local
from .enums import (
    OriginCrawlPagesEnum,
)
from .crawlers import GetCrawlersIvolunteerDataResponse


class GetDraftPostListResponse(BaseModel):
    id: str
    source: OriginCrawlPagesEnum
    name: str
    original_data: GetCrawlersIvolunteerDataResponse
    draft_data: GetCrawlersIvolunteerDataResponse
    post: Union[str, None]
