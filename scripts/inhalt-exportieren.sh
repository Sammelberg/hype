#!/usr/bin/env bash
# The site's content from the local database as SQL, for a new server (deploy/inhalt.sh): pages,
# projects, site settings, redirects and the contact form — no accounts, messages, log or office.
# Usage: scripts/inhalt-exportieren.sh | ssh deploy@<server> 'schwarzwald/deploy/inhalt.sh'
# pg_dump warns about the pages' parent key (a table pointing at itself): --disable-triggers lets
# the rows load in any order, so the warning is dropped.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose exec -T postgres pg_dump -U starter -d starter --data-only --disable-triggers \
  --no-owner --no-privileges \
  -t cms.pages -t cms.projekte -t cms.site_settings -t cms.redirects -t cms.forms \
  2> >(grep -v -e "circular foreign-key" -e "detail: pages" -e "hint:" >&2)
