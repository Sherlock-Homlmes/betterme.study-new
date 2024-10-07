# fastapi
from fastapi import Depends

# default
from bson.objectid import ObjectId

# local
from . import router
from authentication import auth_handler

from models import UserSettings, Users
from .schemas import UserSetting


@router.get("/settings/self")
async def get_user_setting(user: Users = Depends(auth_handler.auth_wrapper)):
    user_setting = await UserSettings.find_one(
        UserSettings.user.id == ObjectId(user["id"])
    )
    del user_setting.user
    return user_setting


@router.patch("/settings/self", status_code=204)
async def update_user_setting(
    user_setting: UserSetting, user: Users = Depends(auth_handler.auth_wrapper)
):
    old_user_setting = await UserSettings.find_one(
        UserSettings.user.id == ObjectId(user["id"])
    )
    old_user_setting.update_value(**user_setting)
    await old_user_setting.save()
    return
