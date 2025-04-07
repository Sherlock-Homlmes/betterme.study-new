from pydantic import BaseModel, Field


class PostAIPromtPayload(BaseModel):
    context: str = Field(min_length=1, max_length=6000)
