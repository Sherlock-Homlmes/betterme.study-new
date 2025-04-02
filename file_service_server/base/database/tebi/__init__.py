# default
import uuid
import os

# libraries
import boto3

# local
from base.conf import settings

# Let's use S3
s3 = boto3.resource(
    service_name="s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_ACCESS_ACCESS_KEY,
    endpoint_url="https://s3.tebi.io",
)
bucket = s3.Bucket(settings.AWS_BUCKET)
