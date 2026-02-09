import uuid

from livekit import api

from models import PomodoroRooms as DBPomodoroRoom
from base.settings import settings
from base.custom.crud import BaseCRUD
from base.custom.http_status import ServerError


class PomodoroRoomCRUD(BaseCRUD[DBPomodoroRoom]):
    def __init__(self):
        self.livekit = api.LiveKitAPI(
            settings.LIVEKIT_URL, settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET
        )
        super().__init__(DBPomodoroRoom)

    # async def get_list(self, **kwrags) -> DBPomodoroRoom:
    #     # check livekit
    #     rooms = await self.livekit.room.list_rooms(api.ListRoomsRequest())
    #     print(rooms, len(rooms.rooms))
    #     return await super().get_list(**kwrags)

    async def create(self, payload, user_id: str, **kwrags) -> DBPomodoroRoom:
        livekit_room_name = str(uuid.uuid4())
        try:
            await self.livekit.room.create_room(
                api.CreateRoomRequest(
                    name=livekit_room_name,
                    empty_timeout=10,  # Auto delete after 30s
                    # empty_timeout=0,  # Not auto delete
                    max_participants=10,  # Max 10 people in a room
                )
            )
        except Exception as e:
            print(e)
            raise ServerError(detail="Can not create pomodoro room now. Try later")

        data = payload.model_dump(mode="json", exclude_unset=True)
        data["created_by"] = user_id
        data["livekit_room_name"] = livekit_room_name
        return await super().create(data, **kwrags)
