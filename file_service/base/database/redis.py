import redis
from rq import Queue
from base.conf import settings, is_prod_env

try:
    print("Connection to redis...")
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        socket_connect_timeout=5,
        decode_responses=True,
        ssl=is_prod_env,
    )
    redis_client.ping()
    print("Successfully connected to Redis!")
except redis.exceptions.ConnectionError as e:
    print(f"Could not connect to Redis: {e}")
    exit(1)

high_priority_queue = Queue("high", connection=redis_client)
low_priority_queue = Queue("low", connection=redis_client)
