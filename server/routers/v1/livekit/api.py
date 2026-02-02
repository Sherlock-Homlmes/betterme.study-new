# libraries
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from livekit.api import AccessToken, VideoGrants

# local
from base.settings import settings

router = APIRouter(prefix="/livekit", tags=["livekit"])


class TokenRequest(BaseModel):
    apiKey: str
    apiSecret: str
    participantName: str
    roomName: str


class TokenResponse(BaseModel):
    token: str


@router.post("/token", response_model=TokenResponse)
async def create_token(request: TokenRequest):
    """
    Generate a LiveKit access token for a participant to join a room.
    """
    try:
        # Validate API key and secret against environment variables
        if (
            request.apiKey != settings.LIVEKIT_API_KEY
            or request.apiSecret != settings.LIVEKIT_API_SECRET
        ):
            raise HTTPException(status_code=401, detail="Invalid API key or secret")

        # Create access token with video grants
        token = AccessToken(request.apiKey, request.apiSecret)
        token.with_identity(request.participantName)
        token.with_name(request.participantName)

        # Grant permissions for the room
        grants = VideoGrants(
            room_join=True,
            room=request.roomName,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        )
        token.with_grants(grants)

        # Generate the JWT token
        jwt_token = token.to_jwt()

        return TokenResponse(token=jwt_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate token: {str(e)}")
