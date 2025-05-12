set -e
sed "s#__REDIS_PASSWORD_PLACEHOLDER__#$REDIS_PASSWORD#g" /usr/local/etc/redis/redis.conf.template | redis-server - "$@"
