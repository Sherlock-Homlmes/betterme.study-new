import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Set

from fastapi import Request, Depends
from sse_starlette.sse import EventSourceResponse
import orjson

from base.settings import app
from base.custom.router import BaseRouter
from routers.authentication.auth import livekit_webhook_handler
from routers.v2.pomodoro_rooms.api import p_room_crud

router = BaseRouter(
    prefix="/webhooks",
    tags=["Webhooks - V2"],
    responses={404: {"description": "Not found"}},
)

# Store active SSE connections
active_connections: Set[asyncio.Queue] = set()


async def broadcast_event(event_type: str, data: dict):
    """Broadcast an event to all active SSE connections."""
    if not active_connections:
        return

    message = {
        "event": event_type,
        "retry": 15000,
        "data": json.dumps(
            {
                **data,
                "datetime": datetime.now().isoformat(sep="T", timespec="auto"),
            }
        ),
        "id": str(uuid.uuid4()),
    }

    # Send to all active connections
    for queue in list(active_connections):
        try:
            await queue.put(message)
        except Exception:
            # Remove broken connection
            active_connections.discard(queue)


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
    event_map = {
        "room_started": "room_created",
        # "participant_left": "room_updated",
        "participant_joined": "member_joined",
        "participant_left": "member_leaved",
        "room_finished": "room_deleted",
    }
    data = None
    if event.event in [
        "room_started",
    ]:
        print(f"Livekit room {event.room.name} created")
        room = await p_room_crud.get_room_by_name(event.room.name)
        data = orjson.loads(orjson.dumps(room))
    elif event.event in ["participant_joined", "participant_left"]:
        data = {
            "livekit_room_name": event.room.name,
            "user_id": json.loads(event.participant.metadata).get("user_id"),
        }
    elif event.event == "room_finished":
        data = {
            "livekit_room_name": event.room.name,
        }

    if data:
        await broadcast_event(event_map[event.event], data)
