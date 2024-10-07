from fastapi import APIRouter

router = APIRouter(
    prefix="/api/study-tools",
    tags=["Study tools"],
    responses={404: {"description": "Not found"}},
)

from .todolist import *
from .taskcategories import *
from .pomodoros import *
