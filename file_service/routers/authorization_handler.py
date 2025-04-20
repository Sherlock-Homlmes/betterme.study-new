from fastapi import HTTPException, status, Security
from fastapi.security import APIKeyHeader
from base.conf import settings

oauth2_scheme = APIKeyHeader(name="Authorization", auto_error=False)


async def auth(token: str = Security(oauth2_scheme)) -> bool:
    """
    Dependency to get the current user based on the token.
    Replace this with your actual token validation logic.
    """
    if token != settings.SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    return True
