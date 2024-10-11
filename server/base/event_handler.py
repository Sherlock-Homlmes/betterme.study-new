# default
import beanie

# local
from .settings import app
from .database.mongodb.async_db import client
from models import document_models


@app.on_event("startup")
async def startup():
    await beanie.init_beanie(
        database=client.betterme_study,
        document_models=document_models,
    )

    print("Start up done")
