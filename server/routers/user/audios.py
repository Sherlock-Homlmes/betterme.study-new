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


def generate_prefixes(url: str):
    """Generates all possible prefixes of a given URL."""
    prefixes = []
    # Handle scheme and domain
    # Find where the path starts
    scheme_end = url.find("://")
    if scheme_end != -1:
        # Add prefixes up to scheme://
        for i in range(1, scheme_end + 3):  # Include ://
            prefixes.append(url[:i])
        path_start = url.find("/", scheme_end + 3)
        if path_start == -1:  # No path, just domain
            for i in range(scheme_end + 3, len(url) + 1):
                prefixes.append(url[:i])
        else:  # Has path
            # Add prefixes of the domain part including trailing /
            for i in range(scheme_end + 3, path_start + 1):
                prefixes.append(url[:i])

            # Add prefixes for each path segment
            current_prefix = url[:path_start]
            for segment in url[path_start:].split("/"):
                if segment:  # Avoid empty segments from double slashes or trailing slash
                    current_prefix += "/" + segment
                elif current_prefix and url[len(current_prefix) :].startswith("/"):
                    # Handle cases like .../path//segment or .../path/
                    current_prefix += "/"
                prefixes.append(current_prefix)

    else:  # No scheme, just treat as path
        parts = url.split("/")
        current_prefix = ""
        for part in parts:
            if current_prefix:
                current_prefix += "/" + part if part else "/"
            else:
                current_prefix = part  # First part

            if current_prefix:
                prefixes.append(current_prefix)

    # Add the full URL itself
    if url not in prefixes:
        prefixes.append(url)

    # Remove duplicates (optional, but good practice)
    return sorted(list(set(prefixes)))


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
