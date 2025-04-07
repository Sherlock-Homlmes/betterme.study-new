# libraries
import pytest

# local

pytest_plugins = ("pytest_asyncio",)


@pytest.mark.asyncio
async def test_get_post_successfully(client, create_post_data):
    """
    INPUT:
        Get post that id exist
    OUTPUT:
        Get post successfully
    """
    await create_post_data

    response = client.get("/api/posts/65d76b73cbc29b3c618ec673")
    assert response.status_code == 200
    assert response.json() == {
        "id": "65d76b73cbc29b3c618ec673",
        "author": "Ivolunteer.vn",
        "author_link": None,
        "banner_img": "https://s3.tebi.io/testfiles.news.betterme.study/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png",
        "content": "Some title",
        "created_at": "1111-11-11T11:11:11",
        "description": "Some description",
        "keywords": ["keyword 1", "keyword 2", "keyword 3"],
        "og_img": "https://s3.tebi.io/testfiles.news.betterme.study/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png",
        "other_information": {"deadline": None},
        "tags": ["Câu lạc bộ", "Tình nguyện"],
        "thumbnail_img": None,
        "title": "Some title",
        "slug": "some-title",
        "updated_at": None,
        "view": 1,
    }


@pytest.mark.asyncio
async def test_get_post_with_not_exist(client, create_post_data):
    """
    INPUT:
        Get post that id not exist
    OUTPUT:
        Get post failed
    """
    await create_post_data

    response = client.get("/api/posts/1111111111111111111")
    assert response.status_code == 404
    assert response.json()["detail"] == "Post not found"


@pytest.mark.asyncio
async def test_get_post_increase_view(client, create_post_data):
    """
    INPUT:
        Get post
    OUTPUT:
        - Get post successfully
        - View increase after call
    """
    await create_post_data

    response = client.get("/api/posts/65d76b73cbc29b3c618ec673")
    assert response.status_code == 200
    assert response.json()["view"] == 1
    response = client.get("/api/posts/65d76b73cbc29b3c618ec673")
    assert response.status_code == 200
    assert response.json()["view"] == 2


@pytest.mark.asyncio
async def test_get_post_not_increase_view(client, create_post_data):
    """
    INPUT:
        Get post
    OUTPUT:
        - Get post successfully
        - View increase after call
    """
    await create_post_data

    response = client.get("/api/posts/65d76b73cbc29b3c618ec673", params={"increase_view": False})
    assert response.status_code == 200
    assert response.json()["view"] == 1
    response = client.get("/api/posts/65d76b73cbc29b3c618ec673")
    assert response.status_code == 200
    assert response.json()["view"] == 1
