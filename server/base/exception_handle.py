from fastapi.responses import JSONResponse
from fastapi_discord import RateLimited, Unauthorized
from fastapi_discord.exceptions import ClientSessionNotInitialized, InvalidToken
from pydantic.error_wrappers import ValidationError

from .settings import app


# discord oauth
@app.exception_handler(Unauthorized)
async def unauthorized_error_handler(_, __):
    return JSONResponse({"error": "Unauthorized"}, status_code=401)


@app.exception_handler(RateLimited)
async def rate_limit_error_handler(_, e: RateLimited):
    return JSONResponse(
        {"error": "RateLimited", "retry": e.retry_after, "message": e.message},
        status_code=429,
    )


@app.exception_handler(ClientSessionNotInitialized)
async def client_session_error_handler(_, e: ClientSessionNotInitialized):
    return JSONResponse({"error": "Internal Error"}, status_code=400)


@app.exception_handler(InvalidToken)
async def invalid_token(_, e: InvalidToken):
    return JSONResponse({"error": "Invalid Token"}, status_code=400)


# pydantic validate
@app.exception_handler(ValidationError)
async def validation_error_handler(_, e: ValidationError):
    return JSONResponse({"error": "Validate error", "detail": str(e)}, status_code=422)
