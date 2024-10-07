import os
from dotenv import load_dotenv

load_dotenv()

# environ
environ = os.getenv("environ")

# self url
self_url = os.getenv("self_url")

# secret_key
secret_key = os.getenv("secret_key")

# fastapi
docs_url = os.getenv("docs_url")

# mongodb
database_url = os.environ.get("database_url")

# imgbb
IMGBB_API_KEY = os.environ.get("IMGBB_API_KEY")

# discord oauth
DISCORD_CLIENT_ID = os.environ.get("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.environ.get("DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URL = os.environ.get("DISCORD_REDIRECT_URL")
DISCORD_OAUTH_URL = os.environ.get("DISCORD_OAUTH_URL", None)


# google oauth
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URL = os.environ.get("GOOGLE_REDIRECT_URL")

# facebook oauth
FACEBOOK_CLIENT_ID = os.environ.get("FACEBOOK_CLIENT_ID")
FACEBOOK_CLIENT_SECRET = os.environ.get("FACEBOOK_CLIENT_SECRET")
FACEBOOK_REDIRECT_URL = os.environ.get("FACEBOOK_REDIRECT_URL")

# bot api
bot_api = os.environ.get("bot_api")
