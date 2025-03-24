# default

# custom
from base.settings import app
from base.routes import *
from base.event_handler import *
from base.exception_handle import *


@app.get("/api")
def main_router():
    return {"status": "alive"}
