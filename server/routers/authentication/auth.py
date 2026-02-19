# default
from typing import Optional
from datetime import datetime, timedelta

#  lib
import jwt
from fastapi import HTTPException, status, Security, Request, Cookie, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, APIKeyHeader, APIKeyCookie
from livekit import api
from passlib.context import CryptContext

#  local
from base.settings import settings
from models import UserRoleEnum


class AuthHandler:
    header_security = HTTPBearer(auto_error=False)
    cookie_security = APIKeyCookie(name="Authorization", auto_error=False)
    access_key_security = APIKeyHeader(name="Authorization", auto_error=False)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    secret = settings.SECRET_KEY

    def get_password_hash(self, password):
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password, hashed_password):
        return self.pwd_context.verify(plain_password, hashed_password)

    def encode_token(self, user):
        payload = {
            "exp": datetime.utcnow() + timedelta(days=30),
            "iat": datetime.utcnow(),
            "sub": user,
        }
        return jwt.encode(payload, self.secret, algorithm="HS256")

    def decode_token(self, token):
        try:
            payload = jwt.decode(token, self.secret, algorithms=["HS256"])
            return payload["sub"]
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Signature has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error"
            )

    def auth_wrapper(
        self,
        cookie_token: Optional[str] = Security(cookie_security),
        header_token: Optional[HTTPAuthorizationCredentials] = Security(header_security),
    ):
        if not header_token and not cookie_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorization")

        # Try header verification
        try:
            return self.decode_token(header_token.credentials)
        except Exception as e:
            exception = e

        # Try cookie verification
        try:
            return self.decode_token(cookie_token)
        except Exception as e:
            exception = e

        raise exception

    # def news_admin_auth_wrapper(self, auth: HTTPAuthorizationCredentials = Security(security)):
    #     user = self.decode_token(auth.credentials)
    #     if UserRoleEnum.NEWS_ADMIN not in user["roles"]:
    #         raise HTTPException(status_code=403, detail="Permission denied")
    #     return user

    def token_compare(self, token: str) -> bool:
        if token != f"Bearer {settings.ACCESS_KEY}":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return True

    def access_token_auth_wrapper(self, token: str = Security(access_key_security)) -> bool:
        return self.token_compare(token)

    # def access_token_or_jwt_auth_wrapper(
    #     self,
    #     token: Optional[str] = Security(access_key_security),
    #     auth: Optional[HTTPAuthorizationCredentials] = Security(security),
    # ) -> bool:
    #     exception = None

    #     # Try access token verification
    #     try:
    #         return self.token_compare(token)
    #     except Exception as e:
    #         exception = e

    #     # Try jwt verification
    #     try:
    #         return self.decode_token(auth.credentials)
    #     except Exception as e:
    #         exception = e

    #     raise exception


class LivekitWebhookHandler:
    def __init__(self):
        token_verifier = api.TokenVerifier(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        self.webhook_receiver = api.WebhookReceiver(token_verifier)

    async def verify(self, request: Request):
        try:
            auth_token = request.headers.get("Authorization")
            if not auth_token:
                raise HTTPException(status_code=401, detail="No auth token")

            body_bytes = await request.body()
            body_str = body_bytes.decode("utf-8")

            event = self.webhook_receiver.receive(body_str, auth_token)
            return event

        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Livekit verification failed: {e}")
            raise HTTPException(status_code=401, detail=f"Verification failed: {str(e)}")


auth_handler = AuthHandler()
livekit_webhook_handler = LivekitWebhookHandler()
