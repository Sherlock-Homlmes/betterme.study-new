# default

# libraries
from fastapi import APIRouter

# local
from schemas.news_admin import (
    # params
    # payload
    PostAIPromtPayload,
    # responses
    # enums
    ResponseStatusEnum,
)
from services.gemini import ask_gemini

router = APIRouter(
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/ai/post_prompts",
    tags=["Admin-AI"],
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
def ai_post_info_suggestion(payload: PostAIPromtPayload):
    return {"data": ask_gemini(payload)}
