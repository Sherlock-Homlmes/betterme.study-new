# custom
from base.conf import app
from base.routes import *
from base.event_handler import *


@app.get("/api")
def main_router():
    return {"status": "alive"}
