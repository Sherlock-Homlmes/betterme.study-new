import beanie
from base.database.mongodb import client

from .users import Users, UserSettings, UserRoleEnum

from .pomodoro.todolist import TodoList
from .pomodoro.tasks import Tasks
from .pomodoro.taskcategories import TaskCategories
from .pomodoro.pomodoros import Pomodoros, PomodoroStatusEnum
from .pomodoro.aichatchannels import ChatChannels, Chat, SenderEnum

from .news.posts import Posts, FacebookPostInfo, OtherPostInfo
from .news.draft_posts import DraftPosts
from .news.secret_keys import SecretKeys

from .discord.users import Users as DiscordUsers
from .discord.user_daily_study_time import UserDailyStudyTimes

pomodoro_document_models = [
    Users,
    UserSettings,
    TodoList,
    Tasks,
    TaskCategories,
    Pomodoros,
    ChatChannels,
]
news_document_models = [
    Posts,
    DraftPosts,
    SecretKeys,
]
discord_document_models = [DiscordUsers, UserDailyStudyTimes]


async def connect_db():
    await beanie.init_beanie(
        database=client.betterme_study,
        document_models=pomodoro_document_models,
    )
    await beanie.init_beanie(
        database=client.betterme_news,
        document_models=news_document_models,
    )
    await beanie.init_beanie(
        database=client.discord_betterme,
        document_models=discord_document_models,
    )
    print("Connected to db")
