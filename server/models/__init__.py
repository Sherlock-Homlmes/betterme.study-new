import beanie
from base.database.mongodb.async_db import client

from .users import Users, UserSettings, UserRoleEnum

from .file_service.audios import Audios
from .clock.todolist import TodoList
from .clock.taskcategories import TaskCategories
from .clock.pomodoros import Pomodoros, PomodoroStatusEnum
from .clock.aichatchannels import ChatChannels, Chat, SenderEnum

from .news.posts import Posts, FacebookPostInfo, OtherPostInfo
from .news.draft_posts import DraftPosts
from .news.secret_keys import SecretKeys

from .discord.users import Users as DiscordUsers

clock_document_models = [
    Users,
    UserSettings,
    TodoList,
    TaskCategories,
    Pomodoros,
    ChatChannels,
    Audios,
]
news_document_models = [
    Posts,
    DraftPosts,
    SecretKeys,
]
discord_document_models = [DiscordUsers]
file_service_models = [Audios]


async def connect_db():
    await beanie.init_beanie(
        database=client.betterme_study,
        document_models=clock_document_models,
    )
    await beanie.init_beanie(
        database=client.betterme_news,
        document_models=news_document_models,
    )
    await beanie.init_beanie(
        database=client.discord_betterme,
        document_models=discord_document_models,
    )

    await beanie.init_beanie(
        database=client.file_service,
        document_models=file_service_models,
    )
    print("Connected to db")
