from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from all_env import docs_url

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
