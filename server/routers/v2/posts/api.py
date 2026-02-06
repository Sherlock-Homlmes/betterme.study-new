# default
from typing import List, Annotated

# libraries
from fastapi import Depends, BackgroundTasks, Response

# TODO: to error handler

# local
from base.custom.router import BaseRouter
from .schemas import (
    GetPostListResponse,
    GetPostResponse,
    GetPostListParams,
    GetPostParams,
)
from .crud import PostCRUD

router = BaseRouter(
    prefix="/posts",
    tags=["Posts - V2"],
    responses={404: {"description": "Not found"}},
)

post_crud = PostCRUD()


@router.get_list("/")
async def get_list_post(
    response: Response,
    params: Annotated[dict, Depends(GetPostListParams)],
) -> List[GetPostListResponse]:
    return await post_crud.get_list(params)


@router.get(
    "/{post_id}/_related",
)
async def get_related_post(
    post_id: str,
) -> List[GetPostListResponse]:
    return await post_crud.get_related_list(post_id)


@router.get(
    "/{post_id}",
)
async def get_post(
    post_id: str,
    params: Annotated[dict, Depends(GetPostParams)],
    background_tasks: BackgroundTasks,
) -> GetPostResponse:
    return await post_crud.get_one(post_id, params, background_tasks)
