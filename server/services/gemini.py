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
prompt_model = genai.GenerativeModel("gemini-2.0-flash-lite")
common_model = genai.GenerativeModel("gemini-2.0-flash-lite")

ai_prompt_data_map = {
    AIPromtTypeEnum.TITLE: "Viết lại title trên ngắn gọn chuẩn SEO trong 1 câu",
    AIPromtTypeEnum.DESCRIPTION: "Viết lại description trên ngắn gọn chuẩn SEO trong 1 đoạn văn",
    AIPromtTypeEnum.CONTENT: "Viết lại content trên ngắn gọn chuẩn SEO",
}


def create_gemini_post_suggestion(payload: PostAIPromtPayload) -> str:
    context = f"{payload.context}\n{ai_prompt_data_map[payload.prompt_type]}"
    response = prompt_model.generate_content(context)
    return response.text


async def chat_with_gemini(context: str) -> str:
    chat = common_model.start_chat()
    response = await chat.send_message_async(context)
    return response.text
