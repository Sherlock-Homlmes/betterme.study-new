import beanie
from base.database.mongodb.async_db import client

from .users import Users, UserSettings

from .clock.todolist import TodoList
from .clock.taskcategories import TaskCategories
from .clock.pomodoros import Pomodoros, PomodoroStatusEnum

from .discord.users import Users as DiscordUsers

clock_document_models = [Users, UserSettings, TodoList, TaskCategories, Pomodoros]
news_document_models = []
discord_document_models = [DiscordUsers]


async def connect_db():
    await beanie.init_beanie(
        database=client.betterme_study,
        document_models=clock_document_models,
    )
    await beanie.init_beanie(
        database=client.discord_betterme,
        document_models=discord_document_models,
    )
    print("Connected to db")
