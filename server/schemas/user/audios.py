from typing import Optional
from pydantic import BaseModel
import re
from pydantic import HttpUrl


def validate_audio_url(audio_url: HttpUrl) -> str:
    """Validate that the audio URL is from YouTube or SoundCloud."""
    audio_url = str(audio_url)
    youtube_pattern = r"^(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[a-zA-Z0-9_-]{11}"
    soundcloud_pattern = r"^(https?://)?(www\.)?soundcloud\.com/[\w-]+/[\w-]+/?$"

    if not (re.match(youtube_pattern, audio_url) or re.match(soundcloud_pattern, audio_url)):
        raise ValueError("Invalid audio URL. Only YouTube and SoundCloud URLs are accepted.")
    return audio_url


class AudioMappingResponse(BaseModel):
    """
    Schema for the response when an audio mapping is created or retrieved.
    """

    link: str
    song_img: Optional[str] = None
    artist_name: Optional[str] = None
