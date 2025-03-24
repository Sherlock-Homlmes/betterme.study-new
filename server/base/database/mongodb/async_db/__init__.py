import motor.motor_asyncio

from all_env import DATABASE_URL

client = motor.motor_asyncio.AsyncIOMotorClient(DATABASE_URL)
