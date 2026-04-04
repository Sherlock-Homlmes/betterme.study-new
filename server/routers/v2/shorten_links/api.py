from typing import List

from fastapi import BackgroundTasks, HTTPException, Response, Depends

from routers.authentication import auth_handler
from base.custom.router import BaseRouter
from .schemas import CreateShortenLinksPayload, ShortenLinkResponse
from .crud import ShortenLinkCRUD

router = BaseRouter(
    prefix="/shorten-links",
    tags=["Shorten Links - V2"],
    responses={404: {"description": "Not found"}},
)

shorten_link_crud = ShortenLinkCRUD()


@router.get(
    "/{link_name}",
)
async def redirect_shorten_link(
    link_name: str,
    background_tasks: BackgroundTasks,
):
    link = await shorten_link_crud.get_by_link_name(link_name)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    background_tasks.add_task(shorten_link_crud.increment_access_count, link_name)

    return Response(status_code=302, headers={"Location": link.redirect_link})


@router.post(
    "/",
    description="Create shorten links",
    status_code=201,
)
async def create_shorten_links(
    payload: CreateShortenLinksPayload,
    _: bool = Depends(auth_handler.access_token_auth_wrapper),
) -> List[ShortenLinkResponse]:
    return await shorten_link_crud.create_many(payload.links)
