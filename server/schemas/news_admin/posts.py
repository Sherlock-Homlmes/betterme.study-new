# default
import datetime
from typing import List, Optional, Union

# libraries
from pydantic import BaseModel, Field

# local
from .enums import (
    IvolunteerPageTagsEnum,
    KhoahocTvPageTagsEnum,
)
from schemas.common_types import OtherPostInfo


# Payload
class PostPostPayload(BaseModel):
    title: str = Field(min_length=1, default=None)
    description: str = Field(min_length=1, default=None)
    banner: str
    deadline: Optional[datetime.date] = None
    content: str = Field(min_length=1, default=None)
    tags: List[IvolunteerPageTagsEnum] = Field(min_items=1)
    keywords: List[str] = Field(min_items=1, default=None)


class PatchPostPayload(BaseModel):
    title: Optional[str] = Field(min_length=1, default=None)
    description: Optional[str] = Field(min_length=1, default=None)
    banner: Optional[str] = None
    other_information: Optional[OtherPostInfo] = None
    content: Optional[str] = Field(min_length=1, default=None)
    tags: Optional[List[Union[IvolunteerPageTagsEnum, KhoahocTvPageTagsEnum]]] = Field(
        min_items=1, default=None
    )
    keywords: Optional[List[str]] = Field(min_items=1, default=None)
