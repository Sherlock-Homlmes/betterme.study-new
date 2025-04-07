# default
import datetime
from typing import Optional, List, Any, Tuple


# libraries
from beanie import Document, Link, Insert, after_event, before_event
from fastapi import HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, field_validator

# locals
from schemas.news_admin.crawlers import (
    PostCrawlersDataPayload,
)
from schemas.news_admin.enums import OriginCrawlPagesEnum, ResponseStatusEnum
from schemas.common_types import OtherPostInfo

from models.users import Users
from utils.time_modules import Time, date_to_str
from services.discord_bot.news import send_news, send_noti_to_subcribers
from services.tebi import upload_image
from utils.text_convertion import gen_slug


class FacebookPostInfo(BaseModel):
    post_id: str
    comment_id: str


# TODO: after create process: change title, insert to search engine, caching
class Posts(Document):
    # info
    created_at: Optional[datetime.datetime] = None
    # TODO: remove optional and None
    created_by: Optional[Link[Users]] = None
    updated_at: Optional[datetime.datetime] = None
    updated_by: Optional[Link[Users]] = None

    # other service
    facebook_post: Optional[FacebookPostInfo] = None
    discord_post_id: int

    # content
    title: str
    description: str
    thumbnail_img: Optional[str] = None
    banner_img: Optional[str] = None
    content: str
    author: str
    author_link: Optional[str] = None
    # TODO: convert this to primary fields
    other_information: Optional[OtherPostInfo] = None
    view: Optional[int] = Field(default=1, gt=0)
    tags: Optional[List[str]] = []

    # SEO
    keywords: List[str]
    og_img: str

    class Settings:
        validate_on_save = True
        # only use cache in user api
        # TODO: disable cache in admin router
        use_cache = True
        cache_expiration_time = datetime.timedelta(seconds=60)
        cache_capacity = 100

    ### Validate
    # TODO: check if working or not
    @field_validator("thumbnail_img")
    @classmethod
    def validate_thumbnail_banner(cls, thumbnail_img: str) -> int:
        if thumbnail_img or cls.banner_img:
            return thumbnail_img
        raise HTTPException(
            status_code=ResponseStatusEnum.BAD_REQUEST.value,
            detail="Thumbnail or banner must be exist",
        )

    # TODO: make this as general model
    @classmethod
    def build_query(self, params: BaseModel) -> Tuple[List[Any]]:
        find_queries = {}
        agg_queries = []
        if isinstance(params, BaseModel):
            param_fields = params.__fields__.keys()
            for pfield in param_fields:
                if pfield == "match_search" and params.match_search is not None:
                    agg_queries.insert(
                        0,
                        {
                            "$search": {
                                "index": "SearchNews",
                                "text": {"query": params.match_search, "path": {"wildcard": "*"}},
                            }
                        },
                    )
                elif pfield.startswith("match_"):
                    match_values = getattr(params, pfield)
                    if match_values:
                        # TODO: fix this
                        # if len(values := match_values.split(",")) > 1:
                        find_queries[pfield.replace("match_", "")] = {
                            "$elemMatch": {"$in": match_values.split(",")}
                        }
                        # else:
                        #     agg_queries.append({pfield.replace("match_", ""): match_values})
        return find_queries, agg_queries

    ### Methods
    async def increase_view(self):
        self.view += 1
        await self.save()

    @staticmethod
    async def create_post(
        payload: PostCrawlersDataPayload, background_tasks: BackgroundTasks, user: Users
    ):
        from .draft_posts import DraftPosts
        from services.facebook_bot.func import post_to_fb, is_facebook_service_ready

        draft_post_data = await DraftPosts.find_one(
            DraftPosts.name == payload.post_name,
            DraftPosts.source == payload.origin,
        )
        if not draft_post_data:
            raise HTTPException(
                status_code=ResponseStatusEnum.BAD_REQUEST.value, detail="Not found post"
            )
        elif draft_post_data.draft_data.id:
            raise HTTPException(
                status_code=ResponseStatusEnum.BAD_REQUEST.value, detail="Post already exist"
            )
        current_data = draft_post_data.draft_data
        banner_img = None
        if current_data.banner is not None:
            banner_img = upload_image(current_data.banner)
        if payload.origin == OriginCrawlPagesEnum.IVOLUNTEER_VN:
            # TODO: remove date_to_str when lib support
            other_info = OtherPostInfo()
            other_info.deadline = (
                date_to_str(current_data.deadline) if current_data.deadline else None
            )
            post = Posts(
                # info
                created_by=await Users.get(user["id"]),
                raw_data=None,
                # other service
                # facebook_post=facebook_post,
                discord_post_id=0,
                # content
                title=current_data.title,
                description=current_data.description,
                tags=current_data.tags,
                other_information=other_info,
                banner_img=banner_img,
                content=current_data.content,
                author="Ivolunteer.vn",
                author_link=draft_post_data.name,
                # SEO
                keywords=current_data.keywords,
                og_img=banner_img,
            )
        else:
            pass
        await post.insert()
        # save id to draft post
        await draft_post_data.set({DraftPosts.draft_data.id: str(post.id)})

        # create discord post
        discord_post_id = await send_news(data=current_data, is_testing=False, post_id=post.id)
        # discord_post_id to draft_post
        post.discord_post_id = discord_post_id
        await post.save()
        background_tasks.add_task(send_noti_to_subcribers, current_data, False, post.id)

        # create facebook post
        if is_facebook_service_ready() and payload.should_create_facebook_post:
            facebook_post = post_to_fb(
                origin="Ivolunteer.vn",
                content="😍 " + current_data.title + "\n" + "😍 " + current_data.description + "\n",
                comment=f"Xem thêm thông tin tại: https://news.betterme.study/posts/{gen_slug(post.title)}_{post.id}",
                hashtags=current_data.keywords,
                image_name=f"scrap/data/media/{current_data.banner}",
            )
            post.facebook_post = facebook_post
            await post.save()

        return post

    ### Events
    @before_event(Insert)
    async def set_created_at(self):
        now = Time().now
        self.created_at = now

    @after_event(Insert)
    async def save_id_to_draft_post(self):
        pass
