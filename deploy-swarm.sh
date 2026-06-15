#!/usr/bin/env bash
set -euo pipefail

# LiveKit Docker Swarm Deploy Script
# Chạy từ root project: bash deploy-swarm.sh

STACK_NAME="livekit-stack"
COMPOSE_FILE="docker-compose.livekit.prod.yml"

# --- Load .env nếu có ---
if [ -f ".env.livekit" ]; then
  export $(grep -v '^#' .env.livekit | xargs)
fi

# --- Kiểm tra Swarm ---
if ! docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q "active"; then
  echo "[INFO] Swarm chưa được khởi tạo. Đang khởi tạo..."
  docker swarm init
fi

echo "[INFO] Deploying stack '$STACK_NAME'..."
docker stack deploy \
  --compose-file "$COMPOSE_FILE" \
  --with-registry-auth \
  "$STACK_NAME"

echo ""
echo "[INFO] Đang chờ services khởi động..."
sleep 5

docker stack services "$STACK_NAME"

echo ""
echo "=== Lệnh hữu ích ==="
echo "  Xem logs LiveKit:  docker service logs ${STACK_NAME}_livekit -f"
echo "  Xem logs Redis:    docker service logs ${STACK_NAME}_redis -f"
echo "  Remove stack:      docker stack rm $STACK_NAME"
