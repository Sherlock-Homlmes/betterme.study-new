# default
import datetime
from typing import List, Optional, Union

# libraries
from pydantic import BaseModel, model_validator, computed_field

# local
from base.custom.types import IDStr
from base.custom.schemas import Pagination
from utils.text_convertion import gen_slug
from utils.time_modules import vn_now


# TODO: remove duplicate code(using project beanie)
class OtherPostInfo(BaseModel):
    deadline: Optional[Union[datetime.date, None]] = None


class BasePost(BaseModel):
    # info
    created_at: datetime.datetime
    updated_at: Optional[str] = None

    # content
    title: str
    description: str
    slug: str = ""
    thumbnail_img: Optional[str] = None
    banner_img: Optional[str] = None
    view: int
    tags: List[str]

    # SEO
    keywords: List[str]

    @model_validator(mode="after")
    def gen_slug(cls, values):
        if not len(values.slug) and values.title:
            values.slug = gen_slug(values.title)
        return values


# responses
class GetPostListResponse(BasePost):
    id: IDStr
    deadline: Optional[str] = datetime.date

    @computed_field
    @property
    def is_expired(self) -> Optional[bool]:
        if self.deadline is None:
            return False
        return vn_now() > datetime.datetime.fromisoformat(self.deadline)


class GetPostResponse(BasePost):
    id: IDStr
    # content
    content: str
    author: str
    author_link: Optional[str] = None
    other_information: Optional[OtherPostInfo] = None
    # SEO
    og_img: str


# reponses
class GetPostListParams(Pagination):
    match_tags: Optional[str] = None
    match_search: Optional[str] = None
    match_is_expired: Optional[bool] = None


class GetPostParams(BaseModel):
    increase_view: Optional[bool] = True
