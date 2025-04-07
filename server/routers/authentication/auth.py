# fastapi
from fastapi import HTTPException, Depends
from fastapi.responses import JSONResponse

# default
from typing import Optional

# local
from . import router
from schemas.auth import RegisterUser, RegisterUserResponse, LoginUser
from .jwt_auth import auth_handler
from .google_oauth import GoogleOauth2
from .facebook_oauth import FaceBookOauth2

from models import Users
from utils.time_modules import vn_now
from all_env import DISCORD_OAUTH_URL


@router.post("/register", status_code=201)
async def register(user: RegisterUser) -> RegisterUserResponse:
    print(user)
    user_exist = await Users.find_one(Users.email == user.email)
    if user_exist:
        raise HTTPException(status_code=400, detail="email is taken")

    hashed_password = auth_handler.get_password_hash(user.password)
    user = Users(
        email=user.email,
        password=hashed_password,
        user_type="normal",
        name=user.name,
    )
    await user.insert()
    return user.get_info()


@router.post("/login")
async def login(user: LoginUser):
    # authorize and get JWT token
    dbuser = await Users.find_one(Users.email == user.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not exist")
    elif not auth_handler.verify_password(user.password, dbuser.password):
        raise HTTPException(status_code=401, detail="Invalid email and/or password")

    dbuser.last_logged_in_at = vn_now()
    await dbuser.save()

    token = auth_handler.encode_token(dbuser.get_info())
    return {"token": token}


@router.get("/self", dependencies=[Depends(auth_handler.auth_wrapper)])
def protected(user: Users = Depends(auth_handler.auth_wrapper)):
    # TODO: refactor this
    if not user.get("custom_name"):
        user["custom_name"] = user["name"]
    if not user.get("custom_avatar"):
        user["custom_avatar_url"] = user["avatar_url"]
    return user


@router.get("/oauth-link")
async def get_oauth_link(
    discord_link: Optional[bool] = False,
    google_link: Optional[bool] = False,
    facebook_link: Optional[bool] = False,
):
    response = {}
    if discord_link:
        response["discord_link"] = DISCORD_OAUTH_URL
    if google_link:
        response["google_link"] = GoogleOauth2().get_oauth_url()
    if facebook_link:
        response["facebook_link"] = FaceBookOauth2().get_oauth_url()

    return JSONResponse(response, status_code=200)
