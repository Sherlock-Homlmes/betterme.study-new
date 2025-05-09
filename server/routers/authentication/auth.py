from typing import Optional

#  fastapi
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, APIKeyHeader

# default
import jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

from base.settings import settings
from all_env import SECRET_KEY
from models import UserRoleEnum


class AuthHandler:
    security = HTTPBearer()
    access_key_security = APIKeyHeader(name="Authorization", auto_error=False)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    secret = SECRET_KEY

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

    def auth_wrapper(self, auth: HTTPAuthorizationCredentials = Security(security)):
        return self.decode_token(auth.credentials)

    def news_admin_auth_wrapper(self, auth: HTTPAuthorizationCredentials = Security(security)):
        user = self.decode_token(auth.credentials)
        if UserRoleEnum.NEWS_ADMIN not in user["roles"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        return user

    def token_compare(self, token: str) -> bool:
        if token != f"Bearer {settings.ACCESS_KEY}":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return True

    def access_token_auth_wrapper(self, token: str = Security(access_key_security)) -> bool:
        return self.token_compare(token)

    def access_token_or_jwt_auth_wrapper(
        self,
        token: Optional[str] = Security(access_key_security),
        auth: Optional[HTTPAuthorizationCredentials] = Security(security),
    ) -> bool:
        exception = None

        # Try access token verification
        try:
            return self.token_compare(token)
        except Exception as e:
            exception = e

        # Try jwt verification
        try:
            return self.decode_token(auth.credentials)
        except Exception as e:
            exception = e

        raise exception


auth_handler = AuthHandler()
