# default
import datetime
from typing import List, Optional, Union

# libraries
from pydantic import BaseModel, Field

# local
from .enums import (
    OriginCrawlPagesEnum,
    IvolunteerPageContentTypeEnum,
    IvolunteerPageTagsEnum,
    KhoahocTvPageTagsEnum,
    CrawlerDataResponseTypeEnum,
)


# TODO: remove duplicate code(using project beanie)
class OtherPostInfo(BaseModel):
    deadline: Optional[Union[datetime.date, None]] = None


### CrawlersData.PY
# Types
DiscordContentType = List[Union[str, List[str]]]
HtmlContentType = str
# Models


# Params
class CrawlerListParams(BaseModel):
    origin: OriginCrawlPagesEnum
    page: int = Field(default=1, gt=0)


class CrawlersDataParams(BaseModel):
    origin: OriginCrawlPagesEnum
    use_cache: bool = True


class CrawlersListDataParams(BaseModel):
    origin: OriginCrawlPagesEnum
    origin: OriginCrawlPagesEnum
    page: int = 1
    content_type: IvolunteerPageContentTypeEnum


# Payloads
class PostCrawlersDataPayload(BaseModel):
    origin: OriginCrawlPagesEnum
    post_name: str
    should_create_facebook_post: bool = False


class PatchCrawlersDataPayload(BaseModel):
    title: Optional[str] = Field(min_length=1, default=None)
    description: Optional[str] = Field(min_length=1, default=None)
    banner: Optional[str] = None
    content: Optional[str] = Field(min_length=1, default=None)
    tags: Optional[List[Union[IvolunteerPageTagsEnum, KhoahocTvPageTagsEnum]]] = Field(
        min_items=1, default=None
    )
    keywords: Optional[List[str]] = Field(min_items=1, default=None)


class PostCrawlersPreviewDiscordDataPayload(BaseModel):
    origin: OriginCrawlPagesEnum
    preview_source: List[CrawlerDataResponseTypeEnum]


# Responses
class GetCrawlersKhoahocTvDataResponse(BaseModel):
    title: str
    description: str
    tags: List[str]
    banner: str
    thumbnail: str
    content: str
    keywords: List[str]


class GetCrawlersIvolunteerDataResponse(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    tags: List[IvolunteerPageTagsEnum]
    banner: str
    deadline: Union[datetime.date, None]
    content: str
    keywords: List[str]


class PostCrawlersResponse(BaseModel):
    id: str
