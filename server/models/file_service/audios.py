from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class AudioMetadata(BaseModel):
    song_img: Optional[str] = None
    artist_nam: Optional[str] = None


class Audios(Document):
    """
    Maps an external audio URL (e.g., Spotify, YouTube) to its
    corresponding storage URL after download.
    """

    created_by: Optional[str] = None
    audio_url: Indexed(str, unique=True) = Field(
        description="The original URL of the audio source."
    )
    storage_url: str = Field(description="The URL where the downloaded audio is stored.")
    metadata: Optional[AudioMetadata] = None

    async def increase_request_time(self):
        pass
