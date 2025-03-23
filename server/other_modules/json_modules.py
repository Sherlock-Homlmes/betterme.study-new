# default
from bson import json_util
from beanie.odm.fields import PydanticObjectId
import json
import datetime

# local
from .time_modules import time_to_str


def serialization(obj: dict) -> dict:
    return json.dumps(obj, default=json_util.default)


def deserialization(obj: dict) -> dict:
    return json.loads(obj, object_hook=json_util.object_hook)


def mongodb_to_json(obj: dict) -> dict:
    for key, value in obj.items():
        if type(value) is datetime.datetime:
            obj[key] = time_to_str(value)
        elif type(value) is PydanticObjectId:
            obj[key] = str(value)

    return obj
