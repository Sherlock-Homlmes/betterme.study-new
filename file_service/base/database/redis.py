import redis
from rq import Queue

redis_client = redis.Redis(host="redis", port=6379)
queue = Queue(connection=redis_client)
