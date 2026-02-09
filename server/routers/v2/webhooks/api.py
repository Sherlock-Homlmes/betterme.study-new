from fastapi import Request, Depends

from base.settings import app
from base.custom.router import BaseRouter
from routers.authentication.auth import livekit_webhook_handler
from routers.v2.pomodoro_rooms.api import p_room_crud

router = BaseRouter(
    prefix="/webhooks",
    tags=["Webhooks - V2"],
    responses={404: {"description": "Not found"}},
)


@app.webhooks.post("/api/pomodoro-rooms/livekit")
async def livekit_webhook_document(request: Request):
    """
    Test livekit document
    """


@router.post("/livekit")
async def livekit_webhook(event=Depends(livekit_webhook_handler.verify)):
    """
    Handle LiveKit webhook events.

    This endpoint receives webhook events from LiveKit server.
    The webhook signature is verified before processing the event.
    """
    # print(event)

    if event.event == "room_started":
        print(f"Livekit room {event.room.name} created")
    elif event.event == "room_finished":
        await p_room_crud.delete_one(
            match_livekit_room_name=event.room.name, raise_if_missing=False
        )
        print(f"Livekit room {event.room.name} deleted")
