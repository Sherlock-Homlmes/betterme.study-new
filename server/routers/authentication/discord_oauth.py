# fastapi
from fastapi import HTTPException

# discord
from fastapi_discord import DiscordOAuthClient

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
    token, refresh_token = await discord.get_access_token(code)
    async with aiohttp.ClientSession() as session:
        res = await session.get(
            "https://discord.com/api/v10/users/@me",
            headers={"Authorization": f"Bearer {token}"},
        )
        if res.status != 200:
            raise HTTPException(status_code=400, detail="Invalid Discord code")
        discord_user = await res.json()

    if "id" not in discord_user:
        raise HTTPException(status_code=400, detail="Failed to get Discord user info")

    user_id = int(discord_user["id"])
    username = discord_user["username"]
    email = discord_user.get("email")
    locale = discord_user.get("locale", "en-US")

    avatar_hash = discord_user.get("avatar")
    if avatar_hash:
        avatar_url = f"https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.png"
    else:
        discriminator = int(discord_user.get("discriminator") or "0")
        avatar_url = f"https://cdn.discordapp.com/embed/avatars/{discriminator % 5}.png"

    await Users.find_one(Users.discord_id == user_id).upsert(
        Set(
            {
                Users.email: email,
                Users.last_logged_in_at: vn_now(),
                Users.name: username,
                Users.avatar: avatar_url,
            }
        ),
        on_insert=Users(
            email=email,
            user_type="discord",
            locale=locale,
            name=username,
            avatar=avatar_url,
            discord_id=user_id,
        ),
    )
    user = await Users.find_one(Users.discord_id == user_id)

    jwt_token = auth_handler.encode_token(user.get_info())
    return {"token": jwt_token}
