#!/bin/sh
set -eu

: "${IMAGE_REF:?The published image reference is required}"
: "${EXPECTED_REVISION:?The expected Git revision is required}"
container_name="meerman.xyz"

# Pull and validate before touching the running site. A failed pull must leave it running.
docker pull "$IMAGE_REF"
actual_revision=$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$IMAGE_REF")
if [ "$actual_revision" != "$EXPECTED_REVISION" ]; then
  echo "The pulled image does not match the expected revision." >&2
  exit 1
fi

container_id=$(docker ps -a -q --filter 'name=^/meerman[.]xyz$')
if [ -n "$container_id" ]; then
  docker stop "$container_name"
  docker rm "$container_name"
fi

docker run --name "$container_name" -d --restart unless-stopped \
  -p 4337:8080 "$IMAGE_REF"
