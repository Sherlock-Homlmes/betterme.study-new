from typing import List, Optional
from pydantic import model_validator
from beanie import PydanticObjectId
from beanie.operators import ElemMatch
from pydantic_core._pydantic_core import ValidationError

from models import Posts as DBPost
from base.custom.crud import BaseCRUD
from base.custom.http_status import NotFound
from utils.beanie_odm import get_projections_from_model
from utils.text_convertion import gen_slug
from utils.beanie_odm import (
    count_total,
    cursor_pipeline_rearrange,
)
from .schemas import GetPostListResponse


class PostListProject(GetPostListResponse):
    id: PydanticObjectId
    slug: Optional[str] = ""

    class Settings:
        projection = get_projections_from_model(
            GetPostListResponse,
            exclude_fields=["slug"],
            map_fields={
                "deadline": "other_information.deadline",
            },
        )

    @model_validator(mode="after")
    def gen_slug(cls, values):
        if not len(values.slug) and values.title:
            values.slug = gen_slug(values.title)
        return values


class PostCRUD(BaseCRUD[DBPost]):
    def __init__(selfn):
        super().__init__(DBPost)

    async def get_list(self, params) -> List[DBPost]:
        find_queries, agg_queries = self.model.build_query(params)
        cursor = self.model.find(
            find_queries,
            skip=params.per_page * (params.page - 1),
            limit=params.per_page,
            sort=None if params.match_search else ("_id", -1),
            ignore_cache=bool(params.match_search),
        ).aggregate(agg_queries, projection_model=PostListProject)
        cursor = cursor_pipeline_rearrange(cursor)

        posts = await cursor.to_list()
        total_count = await count_total(cursor)
        return posts, total_count

    async def get_related_list(self, post_id) -> List[DBPost]:
        try:
            post = await self.model.get(post_id)
        except (AttributeError, ValidationError):
            raise NotFound(detail="Post not found")

        # TODO: only get not expired posts(when lib support datetime.date)
        posts = await (
            self.model
            # find post that have same tags
            .find(ElemMatch(self.model.tags, {"$in": post.tags}))
            .aggregate([{"$sample": {"size": 3}}], projection_model=PostListProject)
            .to_list()
        )

        return posts

    async def get_one(self, post_id, params, background_tasks) -> DBPost:
        try:
            post = await self.model.get(post_id)
            post.id = str(post.id)
            if params.increase_view:
                background_tasks.add_task(post.increase_view)
            return post
        except (AttributeError, ValidationError):
            raise NotFound(detail="Post not found")
