from pydantic import BaseModel, Field
from typing import List
from models import Chat
from ..common_types import PyObjectId


class AIPromtPayload(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    use_ai: bool = False


class CreateChatChannelResponse(BaseModel):
    id: PyObjectId


class GetChannelResponse(BaseModel):
    id: PyObjectId
    history: List[Chat] = Field(default=[])
