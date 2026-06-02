import datetime
from unittest.mock import AsyncMock

import pytest

from routers.v2.posts.api import post_crud
from routers.v2.posts.schemas import GetPostListResponse

pytest_plugins = ("pytest_asyncio",)

BANNER_IMG = "https://s3.tebi.io/testfiles.news.betterme.dev/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png"


def _make_post_list_response():
    return GetPostListResponse(
        id="65d76b73cbc29b3c618ec673",
        created_at=datetime.datetime(1111, 11, 11, 11, 11, 11),
        title="Some title",
        description="Some description",
        banner_img=BANNER_IMG,
        tags=["Câu lạc bộ", "Tình nguyện"],
        view=1,
        keywords=["keyword 1", "keyword 2", "keyword 3"],
        deadline=None,
    )


EXPECTED_POST_JSON = {
    "id": "65d76b73cbc29b3c618ec673",
    "slug": "some-title",
    "updated_at": None,
    "created_at": "1111-11-11T11:11:11",
    "title": "Some title",
    "description": "Some description",
    "thumbnail_img": None,
    "banner_img": BANNER_IMG,
    "tags": ["Câu lạc bộ", "Tình nguyện"],
    "deadline": None,
    "keywords": ["keyword 1", "keyword 2", "keyword 3"],
    "view": 1,
}


@pytest.mark.asyncio
async def test_get_post_list_successfully(client, mocker):
    """
    INPUT:
        Get post list
    OUTPUT:
        Get post list successfully
    """
    mock_post = _make_post_list_response()
    mocker.patch.object(
        post_crud,
        "get_list",
        new_callable=AsyncMock,
        return_value=([mock_post], 1),
    )

    response = client.get("/api/v2/posts")
    assert response.status_code == 200
    assert response.json() == [EXPECTED_POST_JSON]


@pytest.mark.asyncio
async def test_get_post_list_with_pagination_successfully(client, mocker):
    """
    INPUT:
        Get post list with pagination
    OUTPUT:
        Get post list successfully with pagination headers
    """
    mock_post = _make_post_list_response()
    mocker.patch.object(
        post_crud,
        "get_list",
        new_callable=AsyncMock,
        return_value=([mock_post], 1),
    )

    response = client.get("/api/v2/posts", params={"page": 1, "per_page": 10})
    assert response.status_code == 200
    assert response.json() == [EXPECTED_POST_JSON]
    assert response.headers.get("x-total-count") == "1"
    assert response.headers.get("x-page") == "1"
    assert response.headers.get("x-per-page") == "10"


@pytest.mark.asyncio
async def test_get_post_list_with_filter_successfully(client, mocker):
    """
    INPUT:
        Get post list with tags filter
    OUTPUT:
        Get post list successfully
    """
    mock_post = _make_post_list_response()
    mocker.patch.object(
        post_crud,
        "get_list",
        new_callable=AsyncMock,
        return_value=([mock_post], 1),
    )

    response = client.get("/api/v2/posts", params={"match_tags": "Câu lạc bộ"})
    assert response.status_code == 200
    assert response.json() == [EXPECTED_POST_JSON]


@pytest.mark.asyncio
async def test_get_related_post_list_successfully(client, mocker):
    """
    INPUT:
        Get related post list
    OUTPUT:
        Get related post list successfully
    """
    mocker.patch.object(
        post_crud,
        "get_related_list",
        new_callable=AsyncMock,
        return_value=[],
    )

    response = client.get("/api/v2/posts/65d76b73cbc29b3c618ec673/_related")
    assert response.status_code == 200
    assert response.json() == []
