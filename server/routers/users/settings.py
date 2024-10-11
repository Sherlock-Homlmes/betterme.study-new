# default
from bson.objectid import ObjectId

# libraries
from fastapi import APIRouter, Depends

# local
from routers.authentication import auth_handler

from models import UserSettings, Users
from .schemas import UserSetting

router = APIRouter(
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/users/self/settings")
async def get_user_setting(user: Users = Depends(auth_handler.auth_wrapper)):
    user_setting = await UserSettings.find_one(UserSettings.user.id == ObjectId(user["id"]))
    del user_setting.user
    return user_setting


@router.patch("/users/self/settings", status_code=204)
async def update_user_setting(
    user_setting: UserSetting, user: Users = Depends(auth_handler.auth_wrapper)
):
    old_user_setting = await UserSettings.find_one(UserSettings.user.id == ObjectId(user["id"]))
    old_user_setting.update_value(**user_setting)
    await old_user_setting.save()
    return
