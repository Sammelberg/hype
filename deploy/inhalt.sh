#!/usr/bin/env bash
# The site's content, once, on a new server: pages, projects, site settings, redirects and the
# contact form as SQL on stdin, exported from a local database by scripts/inhalt-exportieren.sh:
#   scripts/inhalt-exportieren.sh | ssh deploy@<server> 'kern/deploy/inhalt.sh'
# It refuses when the server already has pages: there, the admin is the place for content.
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] || { echo "deploy/.env fehlt – zuerst deploy/einrichten.sh" >&2; exit 1; }
compose() { docker compose --env-file .env -f compose.yml "$@"; }
psql() { compose exec -T postgres psql -v ON_ERROR_STOP=1 -q -U kern -d kern "$@"; }

# The dump first, before docker reads stdin away.
dump=$(mktemp)
trap 'rm -f "$dump"' EXIT
cat >"$dump"
grep -q '^COPY cms.pages ' "$dump" || { echo "Kein Inhalt auf stdin (scripts/inhalt-exportieren.sh)." >&2; exit 1; }

compose up -d --wait postgres
docker build -q --target migrate -t kern-migrate:latest .. >/dev/null
compose run --rm -T migrate

if [ "$(psql -Atc 'select count(*) from cms.pages')" != "0" ]; then
  echo "Abgebrochen: Auf dem Server gibt es schon Seiten. Inhalte dort in /admin bearbeiten." >&2
  exit 1
fi
psql --single-transaction <"$dump" >/dev/null
echo "Inhalt übernommen – Seiten: $(psql -Atc "select count(*) from cms.pages"), Projekte: $(psql -Atc "select count(*) from cms.projekte")."
