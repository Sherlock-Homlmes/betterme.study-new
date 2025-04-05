from typing import Optional

from pydantic import BaseModel


class PatchUserInfo(BaseModel):
    custom_name: Optional[str] = None
    avatar_url: Optional[str] = None
