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
from services.gemini import create_gemini_post_suggestion

router = APIRouter(
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/ai/post_prompts",
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
def ai_post_info_suggestion(payload: PostAIPromtPayload):
    return {"data": create_gemini_post_suggestion(payload)}
