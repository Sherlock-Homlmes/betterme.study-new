import os
from enum import Enum
from functools import lru_cache


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from dotenv import load_dotenv


# testing
@lru_cache
def is_testing():  # pragma: no cover
    """Return whether or not this code is being executed under test env"""
    import sys

    return "pytest" in sys.modules


# env
is_test_env = is_testing()
load_dotenv(override=True, dotenv_path="example.env" if is_test_env else ".env")
get_env = os.environ.get


# env var
class ENVEnum(Enum):
    DEV = "DEV"
    PROD = "PROD"


class Settings(BaseSettings):
    # TODO: change this to ENVEnum when lib support
    ENV: str = ENVEnum.DEV.value


settings = Settings()
is_dev_env = settings.ENV == ENVEnum.DEV.value
is_prod_env = settings.ENV == ENVEnum.PROD.value


# base setting
app = FastAPI(
    title="Betterme.study API",
    # version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/api/docs",
    redoc_url=None,
)
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
