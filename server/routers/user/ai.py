# default
from typing import List

# libraries
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

# local
from models import Users, ChatChannels, Chat, SenderEnum
from schemas.user import (
    # params
    # payload
    AIPromtPayload,
    # responses
    GetChannelResponse,
    CreateChatChannelResponse,
    # enums
    ResponseStatusEnum,
)
from services.gemini import chat_with_gemini
from routers.authentication import auth_handler

router = APIRouter(
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/channels",
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
async def get_ai_chat_channels(
    user: Users = Depends(auth_handler.auth_wrapper),
) -> List[GetChannelResponse]:
    return await ChatChannels.find({"user_id": user["id"], "active": True}).to_list()


@router.get(
    "/channels/{channel_id}",
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
async def get_ai_chat_channel(
    channel_id: str,
    user: Users = Depends(auth_handler.auth_wrapper),
) -> GetChannelResponse:
    chat_channel = await ChatChannels.find_one(
        {"_id": ObjectId(channel_id), "user_id": user["id"], "active": True}
    )
    if not chat_channel:
        raise HTTPException(
            status_code=ResponseStatusEnum.BAD_REQUEST.value,
            detail="Channel not exist",
        )
    return chat_channel


@router.post(
    "/channels",
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
async def create_chat_channel(
    user: Users = Depends(auth_handler.auth_wrapper),
) -> CreateChatChannelResponse:
    channel = await ChatChannels(user_id=user["id"]).insert()
    return CreateChatChannelResponse(id=channel.id)


@router.delete(
    "/channels/{channel_id}",
    status_code=ResponseStatusEnum.NO_CONTENT.value,
)
async def inactive_ai_chat_channel(
    channel_id: str,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    chat_channel = await ChatChannels.find_one(
        {"_id": ObjectId(channel_id), "user_id": user["id"], "active": True}
    )
    if not chat_channel:
        raise HTTPException(
            status_code=ResponseStatusEnum.BAD_REQUEST.value,
            detail="Channel not exist",
        )
    chat_channel.active = False
    await chat_channel.save()
    return


@router.post(
    "/channels/{channel_id}/chats",
    status_code=ResponseStatusEnum.ACCEPTED.value,
)
async def ai_chat(
    payload: AIPromtPayload,
    channel_id: str,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    chat_channel = await ChatChannels.find_one(
        {"_id": ObjectId(channel_id), "user_id": user["id"], "active": True}
    )
    if not chat_channel:
        raise HTTPException(
            status_code=ResponseStatusEnum.BAD_REQUEST.value,
            detail="Channel not exist",
        )
    history = chat_channel.get_history_for_ai()
    response = await chat_with_gemini(payload.content, history)
    user_chat = Chat(content=payload.content, sender=SenderEnum.USER)
    bot_chat = Chat(content=response, sender=SenderEnum.BOT)
    chat_channel.history.extend([user_chat, bot_chat])
    await chat_channel.save()
    return {"content": response, "sender": SenderEnum.BOT}
