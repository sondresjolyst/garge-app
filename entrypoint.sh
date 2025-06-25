#!/bin/sh
set -e

if [ -n "$API_URL" ]; then
  echo "{\"API_URL\": \"$API_URL\"}" > /app/public/runtime-config.json
fi

exec "$@"