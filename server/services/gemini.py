import google.generativeai as genai
from schemas.news_admin import (
    # params
    # payload
    PostAIPromtPayload,
    # responses
    # enums
    AIPromtTypeEnum,
)
from base.settings import settings

genai.configure(api_key=settings.GEMINI_AI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")
ai_prompt_data_map = {
    AIPromtTypeEnum.TITLE: "Viết lại title trên ngắn gọn chuẩn SEO trong 1 câu",
    AIPromtTypeEnum.DESCRIPTION: "Viết lại description trên ngắn gọn chuẩn SEO trong 1 đoạn văn",
    AIPromtTypeEnum.CONTENT: "Viết lại content trên ngắn gọn chuẩn SEO",
}


def ask_gemini(payload: PostAIPromtPayload) -> str:
    context = f"{payload.context}\n{ai_prompt_data_map[payload.prompt_type]}"
    response = model.generate_content(context)
    return response.text
