# default
import uuid
import os

# libraries
import boto3

# local
from base.settings import settings, is_dev_env

# Let's use S3
s3 = boto3.resource(
    service_name="s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_ACCESS_ACCESS_KEY,
    endpoint_url="https://s3.tebi.io",
)
bucket = s3.Bucket(settings.AWS_BUCKET)


def upload_audio(file_name: str):
    uid = str(uuid.uuid4())[:8]
    file_path = f".cache/audios/{file_name}"
    data = open(file_path, "rb")
    file_size = os.path.getsize(file_path)
    object_id = f"audios/{uid}_{file_name}"
    bucket.put_object(Key=object_id, Body=data, ContentType="audio/mp3", ContentLength=file_size)

    return (
        f"https://s3.tebi.io/{settings.AWS_BUCKET}/{object_id}"
        if is_dev_env
        else f"https://files.betterme.study/{object_id}"
    )
