from pymongo import MongoClient
from all_env import DATABASE_URL

cluster = MongoClient(DATABASE_URL)
dtbs = cluster["bettermestudy"]
