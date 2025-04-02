from beanie import Document, Indexed
from pydantic import Field


class Audios(Document):
    """
    Maps an external audio URL (e.g., Spotify, YouTube) to its
    corresponding storage URL after download.
    """

    created_by: str
    audio_url: Indexed(str, unique=True) = Field(
        description="The original URL of the audio source."
    )
    storage_url: str = Field(description="The URL where the downloaded audio is stored.")
