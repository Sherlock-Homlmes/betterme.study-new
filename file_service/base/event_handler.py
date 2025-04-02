# default
import beanie

# local
from .conf import app
from .database.mongodb import client
from models import document_models


@app.on_event("startup")
async def startup():
    await beanie.init_beanie(
        database=client.file_service,
        document_models=document_models,
    )

    print("Start up done")
