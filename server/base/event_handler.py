# default
import beanie

# local
from .settings import app
from database.mongodb.async_db import client
from models import *


@app.on_event("startup")
async def startup():
    await beanie.init_beanie(
        database=client.betterme_study,
        document_models=[Users, UserSettings, TodoList, TaskCategories, Pomodoros],
    )

    print("Start up done")
