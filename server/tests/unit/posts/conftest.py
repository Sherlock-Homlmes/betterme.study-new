import pytest
from beanie import PydanticObjectId

from models import Posts, Users, UserRoleEnum
from schemas.common_types import OtherPostInfo


@pytest.fixture(scope="function", autouse=True)
async def create_post_data(clean_db):
    await clean_db

    admin_user = Users(
        _id=PydanticObjectId("65d767d163bc47aa66a84ef8"),
        email="atang@news.betterme.study",
        discord_id="123456",
        name="Atang",
        avatar="https://pic.com",
        roles=[UserRoleEnum.OWNER],
        user_type="discord",
        last_logged_in_at="2222-02-22 22:22:22",
    )
    await admin_user.insert()

    other_info = OtherPostInfo(deadline=None)
    post_documents = [
        Posts(
            _id=PydanticObjectId("65d76b73cbc29b3c618ec673"),
            created_at="1111-11-11 11:11:11",
            created_by=admin_user,
            discord_post_id=1234567,
            title="Some title",
            description="Some description",
            tags=[
                "Câu lạc bộ",
                "Tình nguyện",
            ],
            other_information=other_info,
            banner_img="https://s3.tebi.io/testfiles.news.betterme.study/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png",
            content="Some title",
            author="Ivolunteer.vn",
            keywords=[
                "keyword 1",
                "keyword 2",
                "keyword 3",
            ],
            og_img="https://s3.tebi.io/testfiles.news.betterme.study/6e590aaf_Ban-sao-cua-Kich-thuoc-800x500px_Anh-Dai-Dien-Bai-Dang-Website-iVolunteer-40.png",
        )
    ]

    await Posts.insert_many(post_documents)
