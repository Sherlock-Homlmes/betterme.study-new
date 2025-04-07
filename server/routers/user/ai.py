# default

# libraries
from fastapi import APIRouter

# local
from schemas.user import (
    # params
    # payload
    PostAIPromtPayload,
    # responses
    # enums
    ResponseStatusEnum,
)
from services.gemini import chat_with_gemini

router = APIRouter(
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/ai",
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
async def ai_chat(payload: PostAIPromtPayload):
    return {"data": await chat_with_gemini(payload.context)}
