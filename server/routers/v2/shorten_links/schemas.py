import datetime
from typing import Optional, List

from pydantic import BaseModel, HttpUrl

from base.custom.types import IDStr
from base.custom.schemas import BaseSchema


class LinkPayload(BaseModel):
    redirect_link: HttpUrl
    redirect_name: Optional[str] = None


class CreateShortenLinksPayload(BaseSchema):
    links: List[LinkPayload]


class ShortenLinkResponse(BaseSchema):
    id: IDStr
    link_name: str
    redirect_link: str
    access_count: int
    created_at: datetime.datetime
