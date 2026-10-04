#!/usr/bin/env bash
# The first account on the server (there is no setup page): an administrator with a temporary
# password, shown once here and changed at the first sign-in.
# Usage: deploy/admin.sh <e-mail>
set -euo pipefail
cd "$(dirname "$0")"
[ -n "${1:-}" ] || { echo "Aufruf: deploy/admin.sh <e-mail>" >&2; exit 1; }
docker image inspect kern-migrate:latest >/dev/null 2>&1 \
  || docker build --target migrate -t kern-migrate:latest ..
docker compose --env-file .env -f compose.yml run --rm migrate \
  pnpm --silent cms:passwort "$1" --anlegen --force
