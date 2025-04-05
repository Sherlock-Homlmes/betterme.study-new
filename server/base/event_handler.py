# default

# local
from .settings import app
from models import connect_db


@app.on_event("startup")
async def startup():
    await connect_db()
    print("Start up done")
