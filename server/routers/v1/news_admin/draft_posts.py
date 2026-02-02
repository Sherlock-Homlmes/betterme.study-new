# default
from typing import List

# libraries
from fastapi import APIRouter, HTTPException, Depends
from beanie import PydanticObjectId

# local
from models import Users, DraftPosts
from schemas.news_admin import (
    # params
    # payload
    # responses
    GetDraftPostListResponse,
    # enums
    ResponseStatusEnum,
)
from routers.authentication import auth_handler
from utils.beanie_odm import get_projections_from_model

router = APIRouter(
    responses={404: {"description": "Not found"}},
)


class DraftPostListProject(GetDraftPostListResponse):
    id: PydanticObjectId

    class Settings:
        projection = get_projections_from_model(
            GetDraftPostListResponse,
        )


# TODO: pagination
@router.get(
    "/draft_posts",
    tags=["Admin-draft-posts"],
    status_code=ResponseStatusEnum.OK.value,
)
async def get_draft_post(
    user: Users = Depends(auth_handler.auth_wrapper),
) -> List[GetDraftPostListResponse]:
    draft_posts = await DraftPosts.find(
        DraftPosts.draft_data.id == None,  # noqa: E711
        projection_model=DraftPostListProject,
    ).to_list()
    draft_posts = [draft_post.model_dump(mode="json") for draft_post in draft_posts]
    return draft_posts


@router.delete(
    "/draft_posts/{draft_post_id}",
    tags=["Admin-draft-posts"],
    status_code=ResponseStatusEnum.NO_CONTENT.value,
)
async def delete_draft_post(
    draft_post_id: str,
):
    # TODO: refactor -> error handler
    draft_post = None
    try:
        draft_post = await DraftPosts.get(draft_post_id)
    except Exception:
        pass

    if not draft_post or draft_post.draft_data.id:
        raise HTTPException(
            status_code=ResponseStatusEnum.NOT_FOUND.value,
            detail="Draft post not found",
        )

    await draft_post.delete()
    return
