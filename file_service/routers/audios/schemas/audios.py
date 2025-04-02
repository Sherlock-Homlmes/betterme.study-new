from pydantic import BaseModel, Field, validator
import re


class AudioMappingCreate(BaseModel):
    """
    Schema for creating a new audio mapping.
    """

    user_id: str = Field(..., description="The user id request this audio")
    audio_url: str = Field(..., description="The original URL of the audio source.")

    @validator("audio_url")
    def validate_audio_url(cls, v):
        """Validate that the audio URL is from YouTube or SoundCloud."""
        youtube_pattern = r"^(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[a-zA-Z0-9_-]{11}"
        soundcloud_pattern = r"^(https?://)?(www\.)?soundcloud\.com/[\w-]+/[\w-]+/?$"

        if not (re.match(youtube_pattern, v) or re.match(soundcloud_pattern, v)):
            raise ValueError("Invalid audio URL. Only YouTube and SoundCloud URLs are accepted.")
        return v


class AudioMappingResponse(BaseModel):
    """
    Schema for the response when an audio mapping is created or retrieved.
    """

    link: str
