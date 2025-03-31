from beanie import Document
from pydantic import Field


class Audios(Document):
    """
    Maps an external audio URL (e.g., Spotify, YouTube) to its
    corresponding storage URL after download.
    """

    created_by_user_id: str
    audio_url: str = Field(description="The original URL of the audio source.")
    storage_url: str = Field(description="The URL where the downloaded audio is stored.")
