import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, FileResponse
from schemas.images import CreateLeaderboardImagePayload

from .leaderboard import generate_leaderboard_image
from utils.image_module import save_image

router = APIRouter(
    prefix="/images",
    tags=["Images"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/leaderboard",
    summary="Create Leaderboard Image",
    description="Create a leaderboard image from given data",
)
async def create_leaderboard_image(
    payload: CreateLeaderboardImagePayload,
):
    """
    Create a leaderboard image from given data and return its URL
    """
    # Concurrently save all user images
    user_avatars = [
        save_image(user_data.img, target_path=f"./.cache/images/{user_data.id}.png", use_cache=True)
        for user_data in payload.leaderboard_data
    ]
    user_avatar_image_paths = await asyncio.gather(*user_avatars)

    # Map the saved image paths back to the user data
    for user_data, saved_path in zip(payload.leaderboard_data, user_avatar_image_paths):
        user_data.img = saved_path

    return FileResponse(generate_leaderboard_image(**payload.dict()))
