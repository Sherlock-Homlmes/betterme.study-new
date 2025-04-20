from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from models import Audios
from schemas.audios import AudioMappingCreate, AudioMappingResponse
from .utils import download_audio
from utils.tebi import upload_audio
from yt_dlp.utils import DownloadError

router = APIRouter(
    prefix="/audios",
    tags=["Audios"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/",
    response_model=AudioMappingResponse,
    summary="Create Audio Mapping",
    description="Create a new mapping between an original audio URL and its storage URL.",
)
async def create_audio_mapping(
    payload: AudioMappingCreate,
    background_tasks: BackgroundTasks,
) -> AudioMappingResponse:
    """
    Creates a new audio mapping record in the database.
    **audio_url**: The original URL of the audio (e.g., Spotify, YouTube).
    """
    # Check if mapping already exists (optional, but good practice)
    old_audio = await Audios.find_one(Audios.audio_url == str(payload.audio_url))
    if old_audio:
        background_tasks.add_task(old_audio.increase_request_time)
        return AudioMappingResponse(link=old_audio.storage_url)

    audio_name = download_audio(payload.audio_url)
    try:
        storage_url = upload_audio(audio_name)
    except DownloadError as e1:
        print(e1)
        raise HTTPException(status_code=400, detail="Invalid audio source")
    except RuntimeError as e2:
        print(e2)
        raise HTTPException(status_code=400, detail="Server error in when processing")

    # Create new mapping document
    new_audio = Audios(**payload.dict(), storage_url=storage_url, created_by=payload.user_id)

    # Insert into database
    await new_audio.insert()

    return AudioMappingResponse(link=new_audio.storage_url)
