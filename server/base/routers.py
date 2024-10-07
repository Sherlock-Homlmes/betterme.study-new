from .settings import app
from .event_handler import *
from .exception_handle import *
import authentication
from users import (
    users,
    study_tools,
    other_modules,
)

for module in [authentication, users, study_tools, other_modules]:
    app.include_router(module.router)


@app.get("/api")
def hello():
    return {"status": "ok"}
