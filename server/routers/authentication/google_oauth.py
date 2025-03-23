# fastapi
from fastapi import Request, HTTPException

# default
from dataclasses import dataclass
from beanie.odm.operators.update.general import Set

# oauth
from requests_oauthlib import OAuth2Session

# local
from .auth import auth_handler
from models import Users
from all_env import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError
from . import router
from other_modules.time_modules import vn_now
from other_modules.json_modules import mongodb_to_json

scope = (
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
)
oauth = OAuth2Session(client_id=GOOGLE_CLIENT_ID, redirect_uri=GOOGLE_REDIRECT_URL, scope=scope)


@dataclass
class GoogleOauth2:
    def get_oauth_url(self):
        authorization_url, state = oauth.authorization_url(
            "https://accounts.google.com/o/oauth2/auth",
            access_type="offline",
            prompt="select_account",
        )
        return authorization_url

    def get_user_info(self, authorization_response):
        oauth.fetch_token(
            "https://accounts.google.com/o/oauth2/token",
            authorization_response=authorization_response,
            client_secret=GOOGLE_CLIENT_SECRET,
        )
        r = oauth.get("https://www.googleapis.com/oauth2/v1/userinfo")
        return r.json()


@router.get("/google-oauth")
async def google_oauth(request: Request):
    authorization_response = str(request.url)
    if not authorization_response.startswith("https"):
        authorization_response = authorization_response.replace("http", "https", 1)
    try:
        google_user = GoogleOauth2().get_user_info(authorization_response)
    except InvalidGrantError as e:
        raise HTTPException(status_code=404, detail=e)

    await Users.find_one(Users.google_id == google_user["id"]).upsert(
        Set(
            {
                Users.email: google_user["email"],
                Users.last_logged_in_at: vn_now(),
                Users.avatar: google_user["picture"],
                Users.name: google_user["name"],
            }
        ),
        on_insert=Users(
            email=google_user["email"],
            user_type="google",
            locale=google_user["locale"],
            name=google_user["name"],
            avatar=google_user["picture"],
            google_id=google_user["id"],
        ),
    )
    user = await Users.find_one(Users.google_id == google_user["id"])

    token = auth_handler.encode_token(mongodb_to_json(user.get_info()))
    return {"token": token}
