# default
from typing import Optional

# libraries
from beanie import Document, Link

# local
from schemas.news_admin import OriginCrawlPagesEnum, GetCrawlersIvolunteerDataResponse
from .posts import Posts
from models import Users


class DraftPosts(Document):
    source: OriginCrawlPagesEnum
    name: str
    original_data: GetCrawlersIvolunteerDataResponse
    # TODO: delete this field and link to post field
    draft_data: GetCrawlersIvolunteerDataResponse
    post: Optional[Link[Posts]] = None
    deleted_by: Optional[Link[Users]] = None
