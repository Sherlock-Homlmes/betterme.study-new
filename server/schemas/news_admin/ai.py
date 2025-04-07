from pydantic import BaseModel, Field
from .enums import AIPromtTypeEnum


class PostAIPromtPayload(BaseModel):
    prompt_type: AIPromtTypeEnum
    context: str = Field(min_length=1, max_length=6000)
