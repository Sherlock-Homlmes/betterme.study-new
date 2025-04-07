# default

# libraries
import beanie
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

# local
from models import news_document_models, clock_document_models, discord_document_models
from base.routes import api_router
from routers.authentication.jwt_auth import auth_handler

app = FastAPI()
app.include_router(api_router)


@pytest.fixture(scope="function", autouse=True)
def client():
    return TestClient(app)


@pytest.fixture(scope="function")
def auth_client(mocker):
    auth_mocker = {
        "id": "111111111111111111111111",
        "discord_id": "111111111111111111",
        "name": "khoitm",
        "email": "dbsiksfikf@gmail.com",
        "avatar_url": "https://cdn.discordapp.com/avatars/111111111111111111/11111111111111111111111111111111.png",
        "roles": ["owner", "admin"],
    }
    mocker.patch.object(auth_handler, "decode_token", return_value=auth_mocker)
    return TestClient(app, headers={"Authorization": "Bearer aaa"})


@pytest.fixture(scope="function")
async def init_db():
    db_client = AsyncMongoMockClient()
    await beanie.init_beanie(database=db_client.betterme_news, document_models=news_document_models)
    await beanie.init_beanie(
        database=db_client.betterme_study, document_models=clock_document_models
    )
    await beanie.init_beanie(
        database=db_client.discord_betterme, document_models=discord_document_models
    )


@pytest.fixture(scope="function")
async def clean_db(init_db):
    await init_db
    models = [*news_document_models, *clock_document_models, *discord_document_models]

    for model in models:
        await model.get_motor_collection().drop()
        await model.get_motor_collection().drop_indexes()

    return None
