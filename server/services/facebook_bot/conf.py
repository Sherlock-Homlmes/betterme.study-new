# libraries
import facebook


# local
from core.conf import settings
from models import SecretKeys, KeyTypeEnum

fb_client = None


# Extend the expiration time of a valid OAuth access token.
async def extend_expiration_time() -> str:
    extended_token = (
        fb_client.extend_access_token(settings.FACEBOOK_APP_ID, settings.FACEBOOK_APP_SECRET)
    )["access_token"]

    secret = await SecretKeys.find_one(SecretKeys.key_name == KeyTypeEnum.FACEBOOK_ACCESS_TOKEN)
    if secret:
        secret.value = extended_token
        secret.encode_value_on_save()
        await secret.save()
    else:
        await SecretKeys(
            key_name=KeyTypeEnum.FACEBOOK_ACCESS_TOKEN,
            value=extended_token,
        ).insert()

    return extended_token


async def connect_to_facebook_api():
    global fb_client

    if settings.FACEBOOK_ACCESS_TOKEN == "NoNeed":
        settings.FACEBOOK_ACCESS_TOKEN = (
            await SecretKeys.find_one(SecretKeys.key_name == KeyTypeEnum.FACEBOOK_ACCESS_TOKEN)
        ).get_value()
    try:
        fb_client = facebook.GraphAPI(settings.FACEBOOK_ACCESS_TOKEN)
        await extend_expiration_time()
    except Exception:
        print("Failed to connect to facebook")


async def encode_new_fb_access_key() -> None:
    fb_client = facebook.GraphAPI(settings.FACEBOOK_ACCESS_TOKEN)
    extended_token = (
        fb_client.extend_access_token(settings.FACEBOOK_APP_ID, settings.FACEBOOK_APP_SECRET)
    )["access_token"]

    print(extended_token)
    secret = await SecretKeys.find_one(SecretKeys.key_name == KeyTypeEnum.FACEBOOK_ACCESS_TOKEN)
    secret.value = extended_token
    secret.encode_value_on_save()
    await secret.save()
