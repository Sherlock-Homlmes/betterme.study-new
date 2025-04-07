# default
import asyncio
from typing import Annotated, Union, List

# libraries
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

# local
from models import Posts, Users, DraftPosts
from schemas.news_admin import (
    # params
    CrawlersDataParams,
    CrawlersListDataParams,
    # payload
    PostCrawlersDataPayload,
    PatchCrawlersDataPayload,
    PostCrawlersPreviewDiscordDataPayload,
    # responses
    GetCrawlersIvolunteerDataResponse,
    GetCrawlersKhoahocTvDataResponse,
    PostCrawlersResponse,
    # enums
    ResponseStatusEnum,
    CrawlerDataResponseTypeEnum,
)
from routers.authentication import auth_handler
from scrap.func import scrap_post_data, scrap_page_data
from services.discord_bot.news import send_news
from services.facebook_bot.func import post_to_fb

router = APIRouter(
    responses={404: {"description": "Not found"}},
)


class DraftPostNameProjection(BaseModel):
    name: str


@router.get(
    "/crawlers",
    tags=["Admin-backend-scrap"],
    status_code=ResponseStatusEnum.OK.value,
)
async def get_crawler_list(
    params: Annotated[dict, Depends(CrawlersListDataParams)],
) -> List[str]:
    # avoid blocking request when crawl multi posts
    await asyncio.sleep(0.1)
    # crawler
    page_data = scrap_page_data(params)
    # get exist crawler
    draft_posts = await DraftPosts.find().project(DraftPostNameProjection).to_list()
    draft_post_names = [x.name for x in draft_posts]
    # exclude exist crawler from return data
    page_data = [x for x in page_data if x not in draft_post_names]
    return page_data


@router.get(
    "/crawlers/{post_name}",
    tags=["Admin-backend-scrap"],
    status_code=ResponseStatusEnum.OK.value,
)
async def get_crawler(
    post_name: str,
    params: Annotated[dict, Depends(CrawlersDataParams)],
) -> Union[GetCrawlersIvolunteerDataResponse, GetCrawlersKhoahocTvDataResponse]:
    post_data = scrap_post_data(origin=params.origin, post_name=post_name)
    if post_data.deadline:
        post_data.deadline = post_data.deadline.strftime("%Y-%m-%d")
    await DraftPosts(
        source=params.origin,
        name=post_name,
        original_data=post_data,
        draft_data=post_data,
    ).insert()
    return post_data


# TODO: to /posts api
@router.post(
    "/crawlers",
    tags=["Admin-backend-scrap"],
    status_code=ResponseStatusEnum.OK.value,
)
async def post_crawler(
    payload: PostCrawlersDataPayload,
    background_tasks: BackgroundTasks,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    post = await Posts.create_post(payload=payload, background_tasks=background_tasks, user=user)
    return PostCrawlersResponse(id=str(post.id))


# TODO: to /draftposts api
@router.patch(
    "/crawlers/{post_name}",
    tags=["Admin-backend-scrap"],
    status_code=ResponseStatusEnum.NO_CONTENT.value,
)
async def patch_crawler(
    post_name: str,
    payload: PatchCrawlersDataPayload,
):
    draft_post_data = await DraftPosts.find_one(
        DraftPosts.name == post_name,
        # TODO: add this condition(low priority)
        # DraftPosts.source == payload.origin,
    )
    if not draft_post_data:
        raise HTTPException(
            status_code=ResponseStatusEnum.BAD_REQUEST.value, detail="Not found post"
        )
    original_update_fields = payload.model_dump(mode="json", exclude_unset=True)
    # TODO: refactor this
    update_fields = {}
    for key, value in original_update_fields.items():
        update_fields[f"draft_data.{key}"] = value

    await draft_post_data.set(update_fields)
    return


# Preview
@router.post(
    "/crawlers/{post_name}/_preview",
    tags=["Admin-backend-scrap"],
    status_code=ResponseStatusEnum.CREATED.value,
)
async def post_crawler_preview(
    post_name: str,
    payload: PostCrawlersPreviewDiscordDataPayload,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    draft_post_data = await DraftPosts.find_one(DraftPosts.name == post_name)
    # TODO: refactor raise error
    if not draft_post_data:
        raise HTTPException(
            status_code=ResponseStatusEnum.BAD_REQUEST.value, detail="Not found post"
        )
    current_data = draft_post_data.draft_data
    if CrawlerDataResponseTypeEnum.DISCORD in payload.preview_source:
        await send_news(data=current_data, is_testing=True)
    elif CrawlerDataResponseTypeEnum.FACEBOOK in payload.preview_source:
        post_to_fb(
            origin=payload.origin,
            content=current_data.discord.title,
            comment="test comment",
            hashtags=["hashtag1", "hashtag2"],
        )
    elif CrawlerDataResponseTypeEnum.WEB in payload.preview_source:
        pass

    return


# import os
# def abc():
#     # To check server restart or not
#     directory_path = "scrap/data/post"
#     contents = os.listdir(directory_path)
#     is_server_restarted = len(contents) == 1

#     if params.use_cache or not is_server_restarted:
#         draft_post_data = await DraftPosts.find_one(
#             DraftPosts.name == post_name,
#             DraftPosts.source == params.origin,
#         )
#         if draft_post_data:
#             return draft_post_data.draft_data
