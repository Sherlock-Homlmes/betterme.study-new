# fastapi
from fastapi import Depends, HTTPException

# discord
from fastapi_discord import User, DiscordOAuthClient

# default
import aiohttp
from beanie.odm.operators.update.general import Set

# local
from . import router
from .auth import auth_handler
from all_env import (
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URL,
    SELF_URL,
)
from models import Users
from utils.time_modules import vn_now


discord = DiscordOAuthClient(
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URL,
    ("identify", "guilds", "email"),
)  # scopes


# start
@router.on_event("startup")
async def on_startup():
    await discord.init()


@router.get("/discord-oauth")
async def discord_oauth(code: str):
    # discord oauth and get JWT token
    token, refresh_token = await discord.get_access_token(code)
    headersList = {"Authorization": f"Bearer {token}"}
    async with aiohttp.ClientSession() as session:
        res = await session.get(url=f"{SELF_URL}/auth/discord/user/self", headers=headersList)
        try:
            discord_user = await res.json()
        except Exception:
            raise HTTPException(status_code=404, detail="Invalid code")

    discord_user["id"] = int(discord_user["id"])

    await Users.find_one(Users.discord_id == discord_user["id"]).upsert(
        Set(
            {
                Users.email: discord_user["email"],
                Users.last_logged_in_at: vn_now(),
                Users.name: discord_user["username"],
                Users.avatar: discord_user["avatar_url"],
            }
        ),
        on_insert=Users(
            email=discord_user["email"],
            user_type="discord",
            locale=discord_user["locale"],
            name=discord_user["username"],
            avatar=discord_user["avatar_url"],
            discord_id=discord_user["id"],
        ),
    )
    user = await Users.find_one(Users.discord_id == discord_user["id"])

    token = auth_handler.encode_token(user.get_info())
    return {"token": token}


@router.get(
    "/discord/user/self",
    dependencies=[Depends(discord.requires_authorization)],
    response_model=User,
)
async def get_user(user: User = Depends(discord.user)):
    return user
