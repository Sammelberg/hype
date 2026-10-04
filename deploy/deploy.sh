#!/usr/bin/env bash
# Deploys the current checkout on the server: database, migrations, an image built against the
# production database (the static pages are prerendered from it), then the stack.
# Usage, from anywhere in the repository: deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] || { echo "deploy/.env fehlt – zuerst deploy/einrichten.sh" >&2; exit 1; }
set -a
. ./.env
set +a
compose() { docker compose --env-file .env -f compose.yml "$@"; }
docker network inspect "${EDGE_NETWORK:-edge}" >/dev/null \
  || { echo "Netz ${EDGE_NETWORK:-edge} des gemeinsamen Eingangs fehlt (EDGE_NETWORK in deploy/.env)" >&2; exit 1; }

echo "1/5 Datenbank"
compose up -d --wait postgres

echo "2/5 Migrationen"
docker build --target migrate -t kern-migrate:latest ..
compose run --rm migrate

echo "3/5 Build"
# Same env as the app, but the database seen from the host network (loopback port of postgres).
build_env=$(mktemp)
trap 'rm -f "$build_env"' EXIT
{
  grep -v '^DATABASE_URL=' .env
  echo "DATABASE_URL=postgres://kern:${POSTGRES_PASSWORD}@127.0.0.1:${POSTGRES_HOST_PORT:-5437}/kern"
} >"$build_env"
# The build stage always runs: it prerenders from the database, which Docker's layer cache cannot
# see — an unchanged checkout would otherwise ship the pages of an earlier deploy.
DOCKER_BUILDKIT=1 docker build --network host --secret id=env,src="$build_env" \
  --no-cache-filter build --target app -t kern-app:latest ..

echo "4/5 Start"
compose up -d --remove-orphans --wait app

echo "5/5 Aufräumen"
# The images of earlier deploys; other images on the host stay.
docker image prune -f --filter label=kern.image=true >/dev/null
compose ps --format "table {{.Service}}\t{{.Status}}"
