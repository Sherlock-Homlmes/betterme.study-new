# libraries
import pytest
from beanie import PydanticObjectId

# local
from models import Posts, Users, UserRoleEnum, OtherPostInfo
from schemas.user import IvolunteerPageTagsEnum

pytest_plugins = ("pytest_asyncio",)


@pytest.fixture(scope="function", autouse=True)
async def create_post_data(clean_db):
    await clean_db

    admin_user = Users(
        _id=PydanticObjectId("65d767d163bc47aa66a84ef8"),
        email="atang@news.betterme.study",
        discord_id="123456",
        name="Atang",
        avatar_url="https://pic.com",
        roles=[UserRoleEnum.ADMIN],
        last_logged_in_at="2222-02-22 22:22:22",
    )
    await admin_user.insert()

    post_documents = []
    other_info = OtherPostInfo(deadline=None)
    post_documents.append(
        Posts(
            _id=PydanticObjectId("65d76b73cbc29b3c618ec673"),
            # info
            created_at="1111-11-11 11:11:11",
            created_by=admin_user,
            discord_post_id=1234567,
            # content
            title="Some title",
            description="Some description",
            tags=[
                IvolunteerPageTagsEnum.CLUB,
                IvolunteerPageTagsEnum.VOLUNTEER,
            ],
            other_information=other_info,
            banner_img="https://s3.tebi.io/testfiles.news.betterme.study/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png",
            content="Some title",
            author="Ivolunteer.vn",
            # SEO
            keywords=[
                "keyword 1",
                "keyword 2",
                "keyword 3",
            ],
            og_img="https://s3.tebi.io/testfiles.news.betterme.study/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png",
        )
    )

    await Posts.insert_many(post_documents)


# TODO: add more data
@pytest.mark.asyncio
async def test_get_post_list_successfully(client, create_post_data):
    """
    INPUT:
        Get post list
    OUTPUT:
        Get post list successfully
    """
    await create_post_data

    response = client.get("/api/posts")
    assert response.status_code == 200
    assert response.json() == [
        {
            "id": "65d76b73cbc29b3c618ec673",
            "slug": "some-title",
            "updated_at": None,
            "created_at": "1111-11-11T11:11:11",
            "title": "Some title",
            "description": "Some description",
            "thumbnail_img": None,
            "banner_img": "https://s3.tebi.io/testfiles.news.betterme.study/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png",
            "tags": ["Câu lạc bộ", "Tình nguyện"],
            "deadline": None,
            "keywords": ["keyword 1", "keyword 2", "keyword 3"],
            "view": 1,
        }
    ]


@pytest.mark.asyncio
async def test_get_post_list_with_pagination_successfully(client, create_post_data):
    """
    INPUT:
        Get post list with pagination
    OUTPUT:
        Get post list successfully
    """


@pytest.mark.asyncio
async def test_get_post_list_with_filter_successfully(client, create_post_data):
    """
    INPUT:
        Get post list with tags, keyword filter
    OUTPUT:
        Get post list successfully
    """


@pytest.mark.asyncio
async def test_get_related_post_list_successfully(client, create_post_data):
    """
    INPUT:
        Get post list with pagination
    OUTPUT:
        Get post list successfully
    """
