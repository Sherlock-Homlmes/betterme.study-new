from pydantic import BaseModel, EmailStr
from dataclasses import dataclass
import datetime

from .base import dtbs

db = dtbs["user"]


class User(BaseModel):
    id: int
    email: EmailStr
    name: str
    avatar_url: str
    gender: str
    age_range: str
    joined_at: datetime


@dataclass
class Auth:
    code: str
    code_type: str

    def register(self):
        pass

    def login(self):
        pass

    def logout(self):
        pass
