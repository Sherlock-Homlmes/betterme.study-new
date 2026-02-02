# default
from typing import Optional, List
import datetime
import uuid
from enum import Enum

# library
from google.generativeai import protos
from pydantic import BaseModel, Field
from beanie import Document

# local
from utils.time_modules import vn_now


class SenderEnum(str, Enum):
    USER = "user"
    BOT = "bot"


class FileData(BaseModel):
    mime_type: str
    file_uri: str


class Chat(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    content: str = Field(min_length=1)
    file_data: Optional[FileData] = None
    sender: SenderEnum

    created_at: datetime.datetime = Field(default_factory=vn_now)
    updated_at: Optional[datetime.datetime] = None


class ChatChannels(Document):
    user_id: str
    active: bool = Field(default=True)
    history: List[Chat] = Field(default=[])

    def get_history_for_ai(self):
        histories = []
        for h in self.history:
            contents = []
            if h.content:
                contents.append({"text": h.content})
            elif h.file_data:
                contents.append(
                    {
                        "file_data": {
                            "mime_type": h.file_data.mime_type,
                            "file_uri": h.file_data.file_uri,
                        }
                    }
                )

            history_role = "user" if h.sender == SenderEnum.USER else "model"
            histories.append(protos.Content(parts=contents, role=history_role))

        return histories
