import datetime
from typing import Optional

from beanie import Document
from pydantic import Field

from utils.time_modules import vn_now


class ShortenLinks(Document):
    link_name: str
    redirect_link: str
    access_count: int = Field(default=0)
    created_at: datetime.datetime = Field(default_factory=vn_now)
