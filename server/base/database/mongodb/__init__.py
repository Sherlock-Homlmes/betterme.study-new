from pymongo import AsyncMongoClient
from all_env import DATABASE_URL

client = AsyncMongoClient(DATABASE_URL)
