# default
import datetime
from typing import Optional

# lib
from beanie import Document
from pydantic import Field

# local
from utils.time_modules import vn_now


class Users(Document):
    discord_id: int
    name: str
    nick: Optional[str] = None
    avatar: str
    is_in_server: bool = True
    is_bot: bool = False

    created_at: datetime.datetime = Field(default_factory=vn_now)
    joined_at: datetime.datetime
    leaved_at: Optional[datetime.datetime] = None
