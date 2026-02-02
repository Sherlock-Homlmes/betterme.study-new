# default
from typing import List, Annotated, Optional

# libraries
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import ORJSONResponse
from beanie import PydanticObjectId
from beanie.operators import ElemMatch
from pydantic_core._pydantic_core import ValidationError
from pydantic import model_validator

# TODO: to error handler

# local
from models import Posts
from schemas.user import (
    # responses
    GetPostListResponse,
    GetPostResponse,
    # payload
    GetPostListParams,
    GetPostParams,
    # enums
    ResponseStatusEnum,
)
from utils.beanie_odm import (
    get_projections_from_model,
    return_with_pagination,
    cursor_pipeline_rearrange,
)
from utils.text_convertion import gen_slug

router = APIRouter(
    responses={404: {"description": "Not found"}},
)


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


@router.get(
    "/posts",
    tags=["Post"],
    status_code=ResponseStatusEnum.OK.value,
)
async def get_list_post(
    params: Annotated[dict, Depends(GetPostListParams)],
) -> List[GetPostListResponse]:
    find_queries, agg_queries = Posts.build_query(params)
    cursor = Posts.find(
        find_queries,
        skip=params.per_page * (params.page - 1),
        limit=params.per_page,
        sort=None if params.match_search else ("_id", -1),
        ignore_cache=bool(params.match_search),
    ).aggregate(agg_queries, projection_model=PostListProject)
    cursor = cursor_pipeline_rearrange(cursor)
    posts = await cursor.to_list()

    # TODO: better pagination solution
    # BUG: can not count with match search
    response = ORJSONResponse(content=[post.model_dump(mode="json") for post in posts])
    await return_with_pagination(cursor, response, params.page, params.per_page)
    return response


@router.get(
    "/posts/{post_id}",
    tags=["Post"],
    status_code=ResponseStatusEnum.OK.value,
)
async def get_post(
    post_id: str,
    params: Annotated[dict, Depends(GetPostParams)],
    background_tasks: BackgroundTasks,
) -> GetPostResponse:
    try:
        post = await Posts.get(post_id)
        post.id = str(post.id)
        if params.increase_view:
            background_tasks.add_task(post.increase_view)
        return post
    except (AttributeError, ValidationError):
        raise HTTPException(
            status_code=ResponseStatusEnum.NOT_FOUND.value,
            detail="Post not found",
        )


@router.get(
    "/posts/{post_name}/_related",
    tags=["Post"],
    status_code=ResponseStatusEnum.OK.value,
)
async def get_related_post(
    post_name: str,
) -> List[GetPostListResponse]:
    post_id: str = post_name.split("_")[-1]
    try:
        post = await Posts.get(post_id)
        # TODO: only get not expired posts(when lib support datetime.date)
        posts = await (
            Posts
            # find post that have same tags
            .find(ElemMatch(Posts.tags, {"$in": post.tags}))
            .aggregate([{"$sample": {"size": 3}}], projection_model=PostListProject)
            .to_list()
        )
        return [post.model_dump(mode="json") for post in posts]
    except (AttributeError, ValidationError):
        raise HTTPException(
            status_code=ResponseStatusEnum.NOT_FOUND.value,
            detail="Post not found",
        )
