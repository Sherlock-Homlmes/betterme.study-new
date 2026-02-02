# default

# custom
from base.settings import app
from base.event_handler import *
from base.exception_handle import *
from routers.endpoints import api_router, api_router_v2


@app.get("/api")
def main_router():
    return {"status": "alive"}


app.include_router(api_router)
app.include_router(api_router_v2)
