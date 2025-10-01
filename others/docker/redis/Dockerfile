FROM redis:alpine

COPY others/redis/redis.conf.template /usr/local/etc/redis/redis.conf.template
COPY others/redis/redis-run.sh /usr/local/etc/redis/redis-run.sh
RUN chmod +x /usr/local/etc/redis/redis-run.sh
