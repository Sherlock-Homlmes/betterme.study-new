from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from fastapi.responses import JSONResponse
from schemas.audios import AudioMappingCreate
from worker import process_audio
from base.database.redis import queue

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
    # Check if mapping already exists (optional, but good practice)
    queue.enqueue(process_audio, payload.audio_url)
    return {"message": "Audio processing initiated"}
