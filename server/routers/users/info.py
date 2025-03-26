# default

# libraries
from fastapi import APIRouter, Depends
from beanie.odm.operators.update.general import Set

# local
from routers.authentication import auth_handler

from models import Users
from .schemas import PatchUserInfo

router = APIRouter(
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)


@router.patch("/users/self/info", status_code=201)
async def update_user_setting(
    payload: PatchUserInfo,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    old_user_info = await Users.get(user["id"])
    print(old_user_info)
    new_user_info = payload.model_dump(exclude_unset=True)
    print(new_user_info)
    await old_user_info.update(Set(new_user_info))
    print(old_user_info.get_info())
    token = auth_handler.encode_token(old_user_info.get_info())
    return {"token": token}
