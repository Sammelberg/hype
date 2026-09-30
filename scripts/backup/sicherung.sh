#!/usr/bin/env bash
# Backs up the database and the uploads with restic, encrypted before it leaves the server.
# From cron on the server, e.g. every night at 2:
#   0 2 * * *  /srv/starter/scripts/backup/sicherung.sh >> /var/log/starter-sicherung.log 2>&1
#
# Two snapshot groups, because they are kept for different times:
#   starter-daten     the database without the contact messages, and MEDIA_DIR. Kept 14 days,
#                     8 weeks, 24 months and 10 years: invoices are kept 8 years (GoBD).
#   starter-anfragen  only the contact messages, kept 14 days: they are deleted after six months
#                     (pnpm cms:aufbewahrung), and the Datenschutzerklärung promises that a backup
#                     does not keep them longer than two weeks after that.
#
# Needs: RESTIC_REPOSITORY, RESTIC_PASSWORD_FILE (the repository must exist: `restic init` once),
# DATABASE_URL; PG_CONTAINER when Postgres runs in Docker; RESTIC for restic in a container.
# Where the repository lives is decided with the server (IONOS, Germany); nothing else leaves it.
set -Eeuo pipefail
source "$(dirname "$0")/_gemeinsam.sh"
trap 'fail "abgebrochen in Zeile $LINENO"' ERR

log "Sicherung beginnt ($RESTIC_REPOSITORY)"
restic cat config >/dev/null 2>&1 || fail "Repository nicht lesbar oder nicht angelegt (einmalig: restic init)."
[ -d "$MEDIA" ] || fail "Uploads fehlen: $MEDIA"

mkdir -p "$STAGING"
chmod 700 "$STAGING"
trap 'rm -f "$STAGING/datenbank.dump" "$STAGING/anfragen.dump"' EXIT

pg pg_dump "$DB_NAME" -Fc --no-owner --exclude-table-data=cms.form_submissions >"$STAGING/datenbank.dump"
pg pg_dump "$DB_NAME" -Fc --no-owner --data-only --table=cms.form_submissions >"$STAGING/anfragen.dump"
[ -s "$STAGING/datenbank.dump" ] || fail "Der Datenbank-Dump ist leer."
log "Dumps: $(du -h "$STAGING/datenbank.dump" | cut -f1) Datenbank, $(du -h "$STAGING/anfragen.dump" | cut -f1) Anfragen"

restic backup --quiet --host "$HOST_TAG" --tag starter-daten "$STAGING/datenbank.dump" "$MEDIA"
restic backup --quiet --host "$HOST_TAG" --tag starter-anfragen "$STAGING/anfragen.dump"

restic forget --quiet --host "$HOST_TAG" --tag starter-daten --group-by host,tags \
  --keep-daily 14 --keep-weekly 8 --keep-monthly 24 --keep-yearly 10 --prune
restic forget --quiet --host "$HOST_TAG" --tag starter-anfragen --group-by host,tags \
  --keep-within 14d --prune
restic check --quiet

log "Sicherung fertig"
