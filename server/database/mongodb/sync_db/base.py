from pymongo import MongoClient
from all_env import database_url

cluster = MongoClient(database_url)
dtbs = cluster["bettermestudy"]