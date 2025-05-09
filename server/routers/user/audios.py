import aiohttp
from fastapi import APIRouter, HTTPException, status

from schemas.user import AudioMappingCreate
from base.settings import settings
from models import Audios
from pydantic import HttpUrl

router = APIRouter(
    prefix="/audios",
    tags=["Audios"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/{audio_link:path}",
    summary="Get Audio Mapping",
    description="Get a new mapping between an original audio URL and its storage URL.",
)
async def get_audio_mapping(
    audio_link: HttpUrl,
):
    """
    Gets a new audio mapping record in the database.
    """
    audio_url = str(audio_link)
    if audio_url.startswith("https://www.youtube.com/watch"):
        audio = await Audios.find_one(
            {
                "$expr": {
                    "$and": [
                        {"$lte": [{"$strLenCP": "$audio_url"}, len(audio_url)]},
                        {
                            "$eq": [
                                "$audio_url",
                                {"$substrCP": [audio_url, 0, {"$strLenCP": "$audio_url"}]},
                            ]
                        },
                    ]
                }
            }
        )
    else:
        audio = await Audios.find_one(Audios.audio_url == audio_url)

    if not audio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio not found")

    return {"link": audio.storage_url}


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
    try:
        await get_audio_mapping(payload.audio_url)
        return {"message": "Audio already created"}
    except HTTPException:
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
