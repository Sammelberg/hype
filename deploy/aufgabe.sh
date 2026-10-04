#!/usr/bin/env bash
# The server's recurring jobs, run from crontab (deploy/einrichten.sh puts them there):
#   deploy/aufgabe.sh aufbewahrung   deletes contact messages after six months, ended sessions
#   deploy/aufgabe.sh geplant        publishes pages and projects whose planned time has come
#   deploy/aufgabe.sh buchung-takt   lets unpaid booking holds lapse, frees their performers
set -euo pipefail
cd "$(dirname "$0")"
case "${1:-}" in
  aufbewahrung | geplant | buchung-takt) ;;
  *) echo "Aufruf: deploy/aufgabe.sh aufbewahrung|geplant|buchung-takt" >&2; exit 1 ;;
esac
# Not before the first deploy: the migrate image comes from deploy/deploy.sh.
docker image inspect hype-migrate:latest >/dev/null 2>&1 || exit 0
echo "$(date -Is) $1"
docker compose --env-file .env -f compose.yml run --rm -T migrate pnpm --silent "cms:$1"
