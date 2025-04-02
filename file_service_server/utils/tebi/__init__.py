# default
import uuid
import os

# local
from base.conf import settings
from base.database.tebi import bucket


def upload_audio(file_name: str):
    uid = str(uuid.uuid4())[:8]
    file_path = f".cache/audios/{file_name}"
    data = open(file_path, "rb")
    file_size = os.path.getsize(file_path)
    object_id = f"audios/{uid}_{file_name}"
    bucket.put_object(Key=object_id, Body=data, ContentType="audio/mp3", ContentLength=file_size)

    return f"https://{settings.AWS_BUCKET}/{object_id}"
