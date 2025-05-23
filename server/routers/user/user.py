# default
from bson.objectid import ObjectId

# libraries
from fastapi import APIRouter, Depends
from beanie.odm.operators.update.general import Set

# local
from routers.authentication import auth_handler

from models import UserSettings, Users
from schemas.auth import PatchUserSetting, PatchUserInfo

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


@router.patch("/users/self/info", status_code=201)
async def update_user_info(
    payload: PatchUserInfo,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    old_user_info = await Users.get(user["id"])
    new_user_info = payload.model_dump(exclude_unset=True)
    await old_user_info.update(Set(new_user_info))
    token = auth_handler.encode_token(old_user_info.get_info())
    return {"token": token}
