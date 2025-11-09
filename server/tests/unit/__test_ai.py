from dataclasses import dataclass
import pytest
from services.gemini import model


@dataclass
class GenerateModelResponse:
    text: str


@pytest.mark.parametrize(
    "prompt_type, context, expected_data",
    [
        ("title", "sample_title", GenerateModelResponse("result_title")),
        ("description", "sample_description", GenerateModelResponse("result_description")),
        ("content", "sample_content", GenerateModelResponse("result_content")),
    ],
)
@pytest.mark.asyncio
async def test_create_prompt_post_by_ai_successfully(
    prompt_type, context, expected_data, auth_client, mocker
):
    """
    INPUT:
        Call ai api with correct prompt_type and context
    OUTPUT:
        Return ai prompt
    """
    prompt_context_map = {
        "title": "Viết lại title trên ngắn gọn chuẩn SEO trong 1 câu",
        "description": "Viết lại description trên ngắn gọn chuẩn SEO trong 1 đoạn văn",
        "content": "Viết lại content trên ngắn gọn chuẩn SEO",
    }

    payload = {"prompt_type": prompt_type, "context": context}
    mock = mocker.patch.object(model, "generate_content", return_value=expected_data)
    response = auth_client.post("/api/admin/ai/post_prompts", json=payload)
    assert response.status_code == 202
    mock.assert_called_once_with(f"{context}\n{prompt_context_map[prompt_type]}")
    assert response.json() == {"data": expected_data.text}


@pytest.mark.asyncio
async def test_create_prompt_post_by_ai_fail_because_context_is_empty(auth_client):
    """
    INPUT:
        Call ai api with correct prompt_type and empty context
    OUTPUT:
        Raise error
    """
    payload = {"prompt_type": "title", "context": ""}
    response = auth_client.post("/api/admin/ai/post_prompts", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "String should have at least 1 character"


@pytest.mark.asyncio
async def test_create_prompt_post_by_ai_fail_because_context_is_too_long(auth_client):
    """
    INPUT:
        Call ai api with correct prompt_type and too long context
    OUTPUT:
        Raise error
    """
    payload = {"prompt_type": "title", "context": "a" * 6001}
    response = auth_client.post("/api/admin/ai/post_prompts", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "String should have at most 6000 characters"
