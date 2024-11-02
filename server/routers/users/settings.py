# default
from bson.objectid import ObjectId

# libraries
from fastapi import APIRouter, Depends
from beanie.odm.operators.update.general import Set

# local
from routers.authentication import auth_handler

from models import UserSettings, Users
from .schemas import PatchUserSetting

router = APIRouter(
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/users/self/settings")
async def get_user_setting(user: Users = Depends(auth_handler.auth_wrapper)):
    user_setting = await UserSettings.find_one(UserSettings.user.id == ObjectId(user["id"]))
    # TODO: refactor
    del user_setting.user
    return user_setting


@router.patch("/users/self/settings", status_code=204)
async def update_user_setting(
    # TODO: refactor
    new_user_setting: PatchUserSetting,
    #
    user: Users = Depends(auth_handler.auth_wrapper),
):
    old_user_setting = await UserSettings.find_one(UserSettings.user.id == ObjectId(user["id"]))
    await old_user_setting.update(Set(new_user_setting.model_dump(mode="json", exclude_none=True)))
    return
