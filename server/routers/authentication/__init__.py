from fastapi import APIRouter

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
    responses={404: {"description": "Not found"}},
)

from .auth import *
from .general_auth import *
from .discord_oauth import *
from .facebook_oauth import *
from .google_oauth import *
