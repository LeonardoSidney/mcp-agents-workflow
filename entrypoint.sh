#!/bin/sh
set -eu

if [ -d /app/node_modules ]; then
  find /app/node_modules -mindepth 1 -delete
fi

npm i
chown -R node:node /app/node_modules /app/package-lock.json

exec "$@"
