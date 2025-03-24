import os
from dotenv import load_dotenv

load_dotenv()

# environ
environ = os.getenv("environ")

# self url
SELF_URL = os.getenv("SELF_URL")

# SECRET_KEY
SECRET_KEY = os.getenv("SECRET_KEY")

# fastapi
docs_url = os.getenv("docs_url")

# mongodb
DATABASE_URL = os.environ.get("DATABASE_URL")

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
