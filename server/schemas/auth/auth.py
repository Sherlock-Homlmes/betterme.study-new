# lib
from pydantic import BaseModel, EmailStr, Field
from models import UserRoleEnum


class RegisterUser(BaseModel):
    email: EmailStr = Field()
    name: str = Field()
    password: str = Field()


class RegisterUserResponse(BaseModel):
    id: str
    name: str
    avatar: str
    roles: UserRoleEnum


class LoginUser(BaseModel):
    email: EmailStr = Field()
    password: str = Field()


class LoginUserResponse(BaseModel):
    id: str
    name: str
    avatar: str


class getDiscordAuthResponse(BaseModel):
    token: str


class getOauthLinkResponse(BaseModel):
    discord_link: str
