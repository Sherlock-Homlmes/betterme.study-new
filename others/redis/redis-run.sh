set -e
sed "s#__REDIS_PASSWORD_PLACEHOLDER__#$REDIS_PASSWORD#g" $TEMPLATE_PATH | redis-server - "$@"
