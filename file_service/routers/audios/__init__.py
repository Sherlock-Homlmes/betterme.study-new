from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from fastapi.responses import JSONResponse
from schemas.audios import AudioMappingCreate
from worker import process_audio
from base.database.redis import high_priority_queue, low_priority_queue

router = APIRouter(
    prefix="/audios",
    tags=["Audios"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/",
    summary="Create Audio Mapping",
    description="Create a new mapping between an original audio URL and its storage URL.",
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_audio_mapping(
    payload: AudioMappingCreate,
):
    """
    Creates a new audio mapping record in the database.
    **audio_url**: The original URL of the audio (e.g., Spotify, YouTube).
    """
    audio_url = str(payload.audio_url)
    if (
        audio_url.startswith("https://www.youtube.com/watch")
        or audio_url.startswith("https://youtube.com/watch")
        or audio_url.startswith("https://www.music.youtube.com/watch")
        or audio_url.startswith("https://music.youtube.com/watch")
    ):
        low_priority_queue.enqueue(process_audio, args=(payload.audio_url, "low"))
    else:
        high_priority_queue.enqueue(process_audio, args=(payload.audio_url, "high"))
    return {"message": "Audio processing initiated"}
