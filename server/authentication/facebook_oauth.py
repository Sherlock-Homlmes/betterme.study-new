# fastapi
from fastapi import Request, HTTPException

# oauth
from all_env import FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_REDIRECT_URL
from requests_oauthlib import OAuth2Session
from requests_oauthlib.compliance_fixes import facebook_compliance_fix
from oauthlib.oauth2.rfc6749.errors import CustomOAuth2Error

# default
from dataclasses import dataclass
from beanie.odm.operators.update.general import Set

# local
from . import router
from .auth import auth_handler
from models import Users
from other_modules.time_modules import vn_now
from other_modules.json_modules import mongodb_to_json

authorization_base_url = "https://www.facebook.com/dialog/oauth"
token_url = "https://graph.facebook.com/oauth/access_token"
facebook = OAuth2Session(FACEBOOK_CLIENT_ID, redirect_uri=FACEBOOK_REDIRECT_URL)
facebook = facebook_compliance_fix(facebook)


@dataclass
class FaceBookOauth2:
    # OAuth endpoints given in the Facebook API documentation

    def get_oauth_url(self):
        authorization_url, state = facebook.authorization_url(authorization_base_url)
        return authorization_url

    def get_user_info(self, redirect_response: str):
        facebook.fetch_token(
            token_url,
            client_secret=FACEBOOK_CLIENT_SECRET,
            authorization_response=redirect_response,
        )

        r = facebook.get("https://graph.facebook.com/me?")
        return r.json()


@router.get("/facebook-oauth")
async def facebook_oauth(request: Request):
    authorization_response = str(request.url)
    if not authorization_response.startswith("https"):
        authorization_response = authorization_response.replace("http", "https", 1)
    try:
        facebook_user = FaceBookOauth2().get_user_info(authorization_response)
    except CustomOAuth2Error as e:
        raise HTTPException(status_code=404, detail=e)

    await Users.find_one(Users.facebook_id == facebook_user["id"]).upsert(
        Set(
            {
                Users.name: facebook_user["name"],
                Users.last_logged_in_at: vn_now(),
            }
        ),
        on_insert=Users(
            user_type="facebook",
            name=facebook_user["name"],
            facebook_id=facebook_user["id"],
        ),
    )
    user = await Users.find_one(Users.facebook_id == facebook_user["id"])

    token = auth_handler.encode_token(mongodb_to_json(user.get_info()))
    return {"token": token}
