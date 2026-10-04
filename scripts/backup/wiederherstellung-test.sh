#!/usr/bin/env bash
# Proves the last backup can be restored: brings back the newest snapshots of both groups into a
# scratch database and a scratch folder, compares them with the live data and drops them again.
# Run it after the first backup and then once a month (cron), e.g.:
#   30 4 1 * *  /srv/kern/scripts/backup/wiederherstellung-test.sh >> /var/log/kern-sicherung.log 2>&1
# Exit 0: every check held. Settings as for sicherung.sh; the database user may create databases.
#
# The same steps restore for real (into the live database instead of the scratch one):
#   pg_restore --no-owner -d <db> datenbank.dump   (schema and data; the triggers come after the
#                                                   data, so the audit log keeps its ids and hashes)
#   pg_restore --no-owner --data-only -d <db> anfragen.dump
#   the uploads from the snapshot's copy of MEDIA_DIR
set -Eeuo pipefail
source "$(dirname "$0")/_gemeinsam.sh"
trap 'fail "abgebrochen in Zeile $LINENO"' ERR

SCRATCH_DB="wiederherstellung_$(date +%Y%m%d%H%M%S)"
TARGET="$STAGING/wiederherstellung"
cleanup() {
  pg psql "$DB_NAME" -qAtc "drop database if exists $SCRATCH_DB" >/dev/null 2>&1 || true
  rm -rf "$TARGET"
}
trap cleanup EXIT

log "Wiederherstellungstest beginnt ($RESTIC_REPOSITORY)"
mkdir -p "$TARGET"
chmod 700 "$STAGING" "$TARGET"
restic restore latest --host "$HOST_TAG" --tag kern-daten --target "$TARGET/daten" --quiet
restic restore latest --host "$HOST_TAG" --tag kern-anfragen --target "$TARGET/anfragen" --quiet
dump="$(find "$TARGET/daten" -name datenbank.dump -print -quit)"
anfragen="$(find "$TARGET/anfragen" -name anfragen.dump -print -quit)"
[ -n "$dump" ] || fail "Kein Datenbank-Dump in der Sicherung."
[ -n "$anfragen" ] || fail "Kein Anfragen-Dump in der Sicherung."

pg psql "$DB_NAME" -qAtc "create database $SCRATCH_DB" >/dev/null
pg pg_restore "$SCRATCH_DB" --no-owner --exit-on-error <"$dump"
pg pg_restore "$SCRATCH_DB" --no-owner --data-only --exit-on-error <"$anfragen"

failed=0
check() {
  if [ "$1" = ok ]; then log "  ok    $2"; else log "  FEHLT $2"; failed=1; fi
}
count() { pg psql "$1" -qAtc "select count(*) from $2"; }

# Rows: what the backup holds, next to what is live now (which may have grown since).
for table in "${KEY_TABLES[@]}" cms.form_submissions; do
  restored="$(count "$SCRATCH_DB" "$table")"
  live="$(count "$DB_NAME" "$table")"
  if [ "$restored" -le "$live" ] && { [ "$live" -eq 0 ] || [ "$restored" -gt 0 ]; }; then
    check ok "$table: $restored Zeilen (live $live)"
  else
    check no "$table: $restored Zeilen gesichert, live $live"
  fi
done

# The audit log: intact in itself, and the same chain as live (its newest hash is there).
broken="$(pg psql "$SCRATCH_DB" -qAtc "$AUDIT_BROKEN_SQL")"
[ "$broken" = 0 ] && check ok "Protokoll-Kette lückenlos" || check no "Protokoll-Kette: $broken Einträge passen nicht"
newest="$(pg psql "$SCRATCH_DB" -qAtc "select hash from cms.audit_log order by id desc limit 1")"
if [ -z "$newest" ] || [ "$(pg psql "$DB_NAME" -qAtc "select count(*) from cms.audit_log where hash = '$newest'")" = 1 ]; then
  check ok "Protokoll gehört zur laufenden Kette"
else
  check no "Protokoll: der neueste gesicherte Eintrag fehlt in der laufenden Datenbank"
fi

# The GoBD triggers came back with the schema.
triggers="$(pg psql "$SCRATCH_DB" -qAtc "select count(*) from pg_trigger where not tgisinternal and tgname in ('rechnungen_festschreibung','nummernkreise_fortlaufend','audit_log_chain','audit_log_unveraenderlich')")"
[ "$triggers" = 4 ] && check ok "Schutz-Trigger vorhanden" || check no "Schutz-Trigger: $triggers von 4"

# Uploads: every file of the snapshot, none missing that the database names.
media_dir="$(find "$TARGET/daten" -type d -path "*${MEDIA%/}" -print -quit)"
files="$( [ -n "$media_dir" ] && find "$media_dir" -type f | wc -l || echo 0)"
named="$(pg psql "$SCRATCH_DB" -qAtc "select filename from cms.media")"
missing=0
for name in $named; do [ -f "$media_dir/$name" ] || missing=$((missing + 1)); done
[ "$missing" = 0 ] && check ok "Uploads: $files Dateien, alle in der Datenbank genannten da" || check no "Uploads: $missing genannte Dateien fehlen"

if [ "$failed" = 0 ]; then log "Wiederherstellungstest bestanden"; else fail "Wiederherstellungstest nicht bestanden"; fi
