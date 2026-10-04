# Shared by sicherung.sh and wiederherstellung-test.sh: settings, the database commands, logging.
# Sourced, not run.

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
fail() {
  log "FEHLER: $*" >&2
  exit 1
}

# .env fills what the shell does not set (a variable from the shell wins, as with the other scripts).
if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in '' | \#*) continue ;; esac
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
    [ -z "${!key:-}" ] && [ -n "$value" ] && export "$key=$value"
  done <.env
fi

: "${DATABASE_URL:?DATABASE_URL fehlt}"
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY fehlt: wohin gesichert wird (z. B. s3:https://s3.eu-central-1.ionoscloud.com/<bucket>/hype oder sftp:sicherung@<host>:/hype)}"
: "${RESTIC_PASSWORD_FILE:?RESTIC_PASSWORD_FILE fehlt: Datei mit dem Schlüssel des Repositorys (ohne ihn ist keine Sicherung lesbar; getrennt vom Server aufbewahren)}"
export RESTIC_REPOSITORY RESTIC_PASSWORD_FILE

MEDIA="${MEDIA_DIR:-$PWD/media}"
# restic itself; may be a container (`docker run … restic/restic`), as long as it sees the same paths.
read -r -a RESTIC_CMD <<<"${RESTIC:-restic}"
# Staging for the dumps; the restic container (if any) must see it under the same path.
STAGING="${BACKUP_STAGING:-/var/tmp/hype-sicherung}"
HOST_TAG="${BACKUP_HOST:-hype}"

command -v node >/dev/null || fail "node fehlt (liest DATABASE_URL)."
url_part() { node -e 'const u = new URL(process.argv[1]); console.log(process.argv[2] === "user" ? decodeURIComponent(u.username) : u.pathname.slice(1))' "$DATABASE_URL" "$1"; }
DB_USER="$(url_part user)"
DB_NAME="$(url_part db)"
url_for() { node -e 'const u = new URL(process.argv[1]); u.pathname = "/" + process.argv[2]; console.log(u.toString())' "$DATABASE_URL" "$1"; }

# The Postgres tools: in the database's container (PG_CONTAINER, e.g. hype-postgres-1), or on
# this machine against DATABASE_URL.
pg() {
  local tool="$1" db="$2"
  shift 2
  if [ -n "${PG_CONTAINER:-}" ]; then
    docker exec -i "$PG_CONTAINER" "$tool" -U "$DB_USER" -d "$db" "$@"
  else
    command -v "$tool" >/dev/null || fail "$tool fehlt. PG_CONTAINER setzen oder die Postgres-Werkzeuge installieren."
    "$tool" -d "$(url_for "$db")" "$@"
  fi
}
restic() { "${RESTIC_CMD[@]}" "$@"; }

# Tables whose rows a restore must bring back.
KEY_TABLES=(cms.pages cms.projekte cms.media cms.users cms.audit_log buero.kunden buero.rechnungen buero.nummernkreise)

# Rows of the audit log whose hash or link does not hold (0 = the chain is intact).
AUDIT_BROKEN_SQL="select count(*) from (select hash = cms.audit_hash(prev_hash, id, at, user_id, user_email, action, target_type, target_id, details) as ok_hash, prev_hash = coalesce(lag(hash) over (order by id), 'GENESIS') as ok_link from cms.audit_log) x where not (ok_hash and ok_link)"
