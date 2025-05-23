import aiohttp
from fastapi import APIRouter, HTTPException

from schemas.user import validate_audio_url
from base.settings import settings
from models import Audios
from pydantic import HttpUrl

router = APIRouter(
    prefix="/audios",
    tags=["Audios"],
    responses={404: {"description": "Not found"}},
)


@router.put(
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
    audio_url = validate_audio_url(audio_link)
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
        async with aiohttp.ClientSession() as session:
            print(1111, settings.FILE_SERVICE_SECRET_KEY)
            res = await session.post(
                url=settings.FILE_SERVICE_URL + "/api/audios",
                json={"audio_url": audio_url},
                headers={"Authorization": settings.FILE_SERVICE_SECRET_KEY},
            )
            if res.status != 202:
                raise HTTPException(
                    status_code=500, detail="Unexpected error happened when processing audio url"
                )
            return {"message": "Audio processing initiated"}

    return {"link": audio.storage_url}
