# default

# libraries
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, BackgroundTasks
import aiofiles

# local
from models import Posts, Users, DraftPosts, OtherPostInfo
from schemas.news_admin import (
    # params
    # payload
    PostPostPayload,
    PatchPostPayload,
    # responses
    PostCrawlersResponse,
    # enums
    ResponseStatusEnum,
)
from routers.authentication import auth_handler
from scrap.func import image_process
from services.tebi import delete_image
from services.discord_bot.news import delete_news, send_news, send_noti_to_subcribers
from utils.text_convertion import gen_slug
from services.tebi import upload_image
from utils.time_modules import Time, date_to_str


router = APIRouter(
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/posts/",
    tags=["Admin-posts"],
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
async def new_post(
    payload: PostPostPayload,
    background_tasks: BackgroundTasks,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    # TODO: check this in Posts class validation
    is_post_exist = await Posts.find_one(
        Posts.title == payload.title,
    )
    if is_post_exist:
        raise HTTPException(
            status_code=ResponseStatusEnum.BAD_REQUEST.value, detail="Post already exist"
        )

    now = Time().now
    # facebook_post = post_to_fb(
    #     origin=body.origin,
    #     content=current_data.discord.title,
    #     comment="test comment",
    #     hashtags=["hashtag1", "hashtag2"],
    # )
    other_info = OtherPostInfo(deadline=date_to_str(payload.deadline) if payload.deadline else None)
    banner_img = upload_image(payload.banner)
    post = Posts(
        # info
        created_at=now,
        created_by=await Users.get(user["id"]),
        raw_data=None,
        # other service
        # facebook_post=facebook_post,
        discord_post_id=0,
        # content
        title=payload.title,
        description=payload.description,
        tags=payload.tags,
        other_information=other_info,
        banner_img=banner_img,
        content=payload.content,
        author="news.betterme.study",
        # SEO
        keywords=payload.keywords,
        og_img=banner_img,
    )
    await post.insert()
    # save id to draft post
    await post.set({DraftPosts.draft_data.id: str(post.id)})
    # create discord post
    discord_post_id = await send_news(data=payload, is_testing=False, post_id=post.id)
    # discord_post_id to draft_post
    post.discord_post_id = discord_post_id
    await post.save()
    background_tasks.add_task(send_noti_to_subcribers, payload, False, post.id)
    return PostCrawlersResponse(id=str(post.id))


@router.post(
    "/posts/_file",
    tags=["Admin-posts"],
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
async def new_post_file(
    file: UploadFile = File(...),
    title: str = Form(...),
):
    img_name = gen_slug(title) + ".png"
    f = await aiofiles.open(f"scrap/data/media/{img_name}", mode="wb")
    await f.write(await file.read())
    await f.close()
    image_process(img_name)

    return {"file": img_name}


@router.patch(
    "/posts/{post_id}",
    tags=["Admin-posts"],
    status_code=ResponseStatusEnum.NO_CONTENT.value,
)
async def patch_post(
    post_id: str, payload: PatchPostPayload, user: Users = Depends(auth_handler.auth_wrapper)
):
    try:
        post = await Posts.get(post_id)
    except Exception:
        raise HTTPException(
            status_code=ResponseStatusEnum.NOT_FOUND.value,
            detail="Post not found",
        )
    update_fields = payload.model_dump(mode="json", exclude_unset=True)
    if update_fields:
        await post.set(update_fields)
        post.updated_by = await Users.get(user["id"])
        await post.save()

    return


@router.delete(
    "/posts/{post_id}",
    tags=["Admin-posts"],
    status_code=ResponseStatusEnum.NO_CONTENT.value,
)
async def delete_post(post_id: str, user: Users = Depends(auth_handler.auth_wrapper)) -> None:
    post = await Posts.get(post_id)
    draft_post = await DraftPosts.find_one(DraftPosts.draft_data.id == post_id)
    if not post or not draft_post:
        raise HTTPException(
            status_code=ResponseStatusEnum.NOT_FOUND.value,
            detail="Post not found",
        )

    # TODO: to trigger before delete
    if post.discord_post_id:
        await delete_news(post.discord_post_id)
    if post.banner_img:
        delete_image(post.banner_img)
    if post.thumbnail_img:
        delete_image(post.thumbnail_img)

    # TODO: use this code when lib support
    # draft_post.deleted_by = await Users.get(user["id"])
    # await draft_post.save()
    await post.set({"draft_post.delete": str(user["id"])})
    await post.delete()

    return
