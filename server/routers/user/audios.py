from fastapi import APIRouter, HTTPException, status
from schemas.user import AudioMappingCreate
import aiohttp
from base.settings import settings

router = APIRouter(
    prefix="/audios",
    tags=["Audios"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create Audio Mapping",
    description="Create a new mapping between an original audio URL and its storage URL.",
)
async def create_audio_mapping(
    payload: AudioMappingCreate,
):
    """
    Creates a new audio mapping record in the database.
    """
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": settings.FILE_SERVICE_SECRET_KEY}
        url = settings.FILE_SERVICE_URL + "/api/audios"
        res = await session.post(
            url=url,
            json=payload.dict(),
            headers=headers,
        )
        if res.status != 202:
            raise HTTPException(
                status_code=500, detail="Unexpected error happened when processing audio url"
            )
        return {"message": "Audio processing initiated"}
