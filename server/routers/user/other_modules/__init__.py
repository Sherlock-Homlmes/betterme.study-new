from fastapi import APIRouter

router = APIRouter(
    tags=["Other modules"],
    responses={404: {"description": "Not found"}},
)

from .school_review import *
from .book_review import *
# from .betterme_cert import *
# from .shorten_link import *
