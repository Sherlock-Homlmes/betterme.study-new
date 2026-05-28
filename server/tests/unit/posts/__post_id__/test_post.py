import datetime
from unittest.mock import AsyncMock

import pytest

from routers.v2.posts.api import post_crud
from routers.v2.posts.schemas import GetPostResponse

pytest_plugins = ("pytest_asyncio",)

BANNER_IMG = "https://s3.tebi.io/testfiles.news.betterme.study/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png"


def _make_get_post_response(**overrides):
    defaults = dict(
        id="65d76b73cbc29b3c618ec673",
        created_at=datetime.datetime(1111, 11, 11, 11, 11, 11),
        title="Some title",
        description="Some description",
        banner_img=BANNER_IMG,
        tags=["Câu lạc bộ", "Tình nguyện"],
        view=1,
        keywords=["keyword 1", "keyword 2", "keyword 3"],
        content="Some title",
        author="Ivolunteer.vn",
        og_img=BANNER_IMG,
    )
    defaults.update(overrides)
    return GetPostResponse(**defaults)


@pytest.mark.asyncio
async def test_get_post_successfully(client, create_post_data):
    """
    INPUT:
        Get post that id exist
    OUTPUT:
        Get post successfully
    """
    await create_post_data

    response = client.get("/api/v2/posts/65d76b73cbc29b3c618ec673")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "65d76b73cbc29b3c618ec673"
    assert data["title"] == "Some title"
    assert data["description"] == "Some description"
    assert data["content"] == "Some title"
    assert data["author"] == "Ivolunteer.vn"
    assert data["view"] == 1
    assert data["tags"] == ["Câu lạc bộ", "Tình nguyện"]


@pytest.mark.asyncio
async def test_get_post_with_not_exist(client, create_post_data):
    """
    INPUT:
        Get post that id not exist
    OUTPUT:
        Get post failed
    """
    await create_post_data

    response = client.get("/api/v2/posts/000000000000000000000000")
    assert response.status_code == 404
    assert response.json()["detail"] == "Post not found"


@pytest.mark.asyncio
async def test_get_post_increase_view(client, mocker):
    """
    INPUT:
        Get post twice
    OUTPUT:
        - Get post successfully
        - View increase after call
    """
    post1 = _make_get_post_response(view=1)
    post2 = _make_get_post_response(view=2)

    mocker.patch.object(
        post_crud,
        "get_one",
        new_callable=AsyncMock,
        side_effect=[post1, post2],
    )

    response = client.get("/api/v2/posts/65d76b73cbc29b3c618ec673")
    assert response.status_code == 200
    assert response.json()["view"] == 1

    response = client.get("/api/v2/posts/65d76b73cbc29b3c618ec673")
    assert response.status_code == 200
    assert response.json()["view"] == 2


@pytest.mark.asyncio
async def test_get_post_not_increase_view(client, mocker):
    """
    INPUT:
        Get post with increase_view=False then increase_view=True
    OUTPUT:
        - Get post successfully
        - View stays the same for first call
        - View stays 1 for second call (background task runs after response)
    """
    post1 = _make_get_post_response(view=1)
    post2 = _make_get_post_response(view=1)

    mocker.patch.object(
        post_crud,
        "get_one",
        new_callable=AsyncMock,
        side_effect=[post1, post2],
    )

    response = client.get("/api/v2/posts/65d76b73cbc29b3c618ec673", params={"increase_view": False})
    assert response.status_code == 200
    assert response.json()["view"] == 1

    response = client.get("/api/v2/posts/65d76b73cbc29b3c618ec673")
    assert response.status_code == 200
    assert response.json()["view"] == 1
