import redis
from rq import Queue

try:
    print("Connection to redis...")
    # redis_client = redis.Redis(
    #     host="widespread-nan-betterme-d2ecf9dd.koyeb.app",
    #     port=80,
    #     username="default",
    #     password="password",
    #     socket_connect_timeout=5,
    #     decode_responses=True,
    # )
    redis_client = redis.Redis(
        host="redis",
        port=6379,
        socket_connect_timeout=5,
        decode_responses=True,
    )
    redis_client.ping()
    print("Successfully connected to Redis!")
except redis.exceptions.ConnectionError as e:
    print(f"Could not connect to Redis: {e}")
    exit(1)

high_priority_queue = Queue("high", connection=redis_client)
low_priority_queue = Queue("low", connection=redis_client)
