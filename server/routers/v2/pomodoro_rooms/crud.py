import uuid
import json
from datetime import datetime
from typing import List, Dict, Any

from livekit import api
from livekit.api import AccessToken, VideoGrants
from pydash import pick as _pick

from models.pomodoro.pomodoro_rooms import PomodoroSectionSettings
from base.settings import settings
from base.custom.http_status import ServerError


class PomodoroRoomCRUD:
    def __init__(self):
        self.livekit = api.LiveKitAPI(
            settings.LIVEKIT_URL, settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET
        )

    async def get_list(self, **kwargs) -> List[Dict[str, Any]]:
        """Get list of pomodoro rooms directly from LiveKit."""
        try:
            rooms_response = await self.livekit.room.list_rooms(api.ListRoomsRequest())
            rooms = []

            for room in rooms_response.rooms:
                # Parse metadata from room
                metadata = {}
                if room.metadata:
                    try:
                        metadata = json.loads(room.metadata)
                    except json.JSONDecodeError:
                        metadata = {}

                rooms.append(
                    {
                        "room_name": metadata.get("room_name", room.name),
                        "livekit_room_name": room.name,
                        "pomodoro_settings": metadata.get(
                            "pomodoro_settings", PomodoroSectionSettings().model_dump()
                        ),
                        "limit": room.max_participants,
                        "created_by": metadata.get("created_by", ""),
                        "created_at": datetime.fromtimestamp(room.creation_time / 1000)
                        if room.creation_time
                        else datetime.now(),
                        "num_participants": room.num_participants,
                    }
                )

            return rooms
        except Exception as e:
            print(f"Error getting rooms from LiveKit: {e}")
            return []

    async def create(self, payload, user_id: str, **kwargs) -> Dict[str, Any]:
        """Create a pomodoro room directly in LiveKit without storing to database."""
        livekit_room_name = str(uuid.uuid4())

        # Prepare metadata to store in LiveKit room
        metadata = {
            "room_name": payload.room_name,
            "pomodoro_settings": payload.pomodoro_settings.model_dump(),
            "created_by": user_id,
            "created_at": datetime.now().isoformat(),
        }

        try:
            # Create the CreateRoomRequest with proper parameters
            create_request = api.CreateRoomRequest()
            create_request.name = livekit_room_name
            create_request.empty_timeout = 1200  # Auto delete after 20s of being empty
            create_request.max_participants = payload.limit
            create_request.metadata = json.dumps(metadata)

            await self.livekit.room.create_room(create_request)

            return {
                "room_name": payload.room_name,
                "livekit_room_name": livekit_room_name,
                "pomodoro_settings": payload.pomodoro_settings.model_dump(),
                "limit": payload.limit,
                "created_by": user_id,
                "created_at": datetime.now(),
                "num_participants": 0,
            }
        except Exception as e:
            print(f"Error creating room in LiveKit: {e}")
            import traceback

            traceback.print_exc()
            raise ServerError(detail="Can not create pomodoro room now. Try later")

    def generate_join_token(self, room_name: str, current_user: dict) -> str:
        """Generate a token for a participant to join a LiveKit room."""
        try:
            # Create access token with video grants
            token = AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
            token.with_identity(current_user["name"])
            token.with_name(current_user["name"])
            user_info = _pick(
                current_user, ["id", "name", "custom_name", "avatar_url", "custom_avatar_url"]
            )
            token.with_metadata(json.dumps(user_info))

            # Grant permissions for the room
            grants = VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
            token.with_grants(grants)

            # Generate the JWT token
            jwt_token = token.to_jwt()

            return jwt_token
        except Exception as e:
            print(f"Error generating token: {e}")
            import traceback

            traceback.print_exc()
            raise ServerError(detail="Can not generate token now. Try later")

    async def get_room_by_name(self, livekit_room_name: str) -> Dict[str, Any]:
        """Get a room by its livekit_room_name from LiveKit."""
        try:
            rooms_response = await self.livekit.room.list_rooms(api.ListRoomsRequest())

            for room in rooms_response.rooms:
                if room.name == livekit_room_name:
                    # Parse metadata from room
                    metadata = {}
                    if room.metadata:
                        try:
                            metadata = json.loads(room.metadata)
                        except json.JSONDecodeError:
                            metadata = {}

                    return {
                        "room_name": metadata.get("room_name", room.name),
                        "livekit_room_name": room.name,
                        "pomodoro_settings": metadata.get(
                            "pomodoro_settings", PomodoroSectionSettings().model_dump()
                        ),
                        "limit": room.max_participants,
                        "created_by": metadata.get("created_by", ""),
                        "created_at": datetime.fromtimestamp(room.creation_time / 1000)
                        if room.creation_time
                        else datetime.now(),
                        "num_participants": room.num_participants,
                    }

            raise ServerError(detail="Room not found")
        except Exception as e:
            print(f"Error getting room from LiveKit: {e}")
            import traceback

            traceback.print_exc()
            raise ServerError(detail="Can not get room now. Try later")

    async def update(self, livekit_room_name: str, payload, user_id: str) -> Dict[str, Any]:
        """Update a pomodoro room's metadata in LiveKit."""
        try:
            # Get room info first
            room = await self.get_room_by_name(livekit_room_name)

            # Check permission: user must be the creator
            if room["created_by"] != user_id:
                raise ServerError(detail="You don't have permission to update this room")

            # Get current metadata
            rooms_response = await self.livekit.room.list_rooms(api.ListRoomsRequest())
            current_metadata = {}

            for r in rooms_response.rooms:
                if r.name == livekit_room_name:
                    if r.metadata:
                        try:
                            current_metadata = json.loads(r.metadata)
                        except json.JSONDecodeError:
                            current_metadata = {}
                    break

            # Update metadata with new values
            if payload.room_name is not None:
                current_metadata["room_name"] = payload.room_name

            if payload.pomodoro_settings is not None:
                current_metadata["pomodoro_settings"] = payload.pomodoro_settings.model_dump()

            # Update room metadata using LiveKit API
            update_request = api.UpdateRoomMetadataRequest()
            update_request.room = livekit_room_name
            update_request.metadata = json.dumps(current_metadata)

            await self.livekit.room.update_room_metadata(update_request)

            # Return updated room info
            updated_room = await self.get_room_by_name(livekit_room_name)
            updated_room["num_participants"] = room["num_participants"]

            return updated_room

        except ServerError as e:
            raise e
        except Exception as e:
            print(f"Error updating room in LiveKit: {e}")
            import traceback

            traceback.print_exc()
            raise ServerError(detail="Can not update room now. Try later")
