# default
import asyncio
from typing import Set

# libraries
from fastapi import Request
from sse_starlette.sse import EventSourceResponse

# local
from base.custom.router import BaseRouter
from routers.v2.webhooks.api import active_connections


router = BaseRouter(
    prefix="/pomodoro-rooms",
    tags=["Server-Sent Events - V2"],
    responses={404: {"description": "Not found"}},
)


@router.get("/events")
async def pomodoro_room_events_stream(request: Request):
    """
    SSE endpoint for pomodoro room events.
    Clients can subscribe to this endpoint to receive real-time updates
    when rooms are created, deleted, or participants join/leave.
    """

    async def event_generator():
        # Create a queue for this connection
        queue = asyncio.Queue()
        active_connections.add(queue)

        try:
            # Send initial connection event
            yield {
                "event": "connected",
                "data": '{"message": "Connected to pomodoro room events stream"}',
                "id": "init",
            }

            # Keep connection alive and send events
            while True:
                if await request.is_disconnected():
                    break

                try:
                    # Wait for events with timeout
                    message = await asyncio.wait_for(queue.get(), timeout=30)
                    yield message
                except asyncio.TimeoutError:
                    # Send keepalive comment every 30 seconds
                    yield ": keepalive\n\n"
        except Exception as e:
            print(f"Error in SSE stream: {e}")
        finally:
            # Clean up connection
            active_connections.discard(queue)

    return EventSourceResponse(event_generator())
