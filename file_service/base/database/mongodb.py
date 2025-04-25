import motor.motor_asyncio

from base.conf import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
