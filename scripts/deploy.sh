#!/usr/bin/env bash
# Rolls a new version out on the server (README → Деплой): fetch, install, migrate, build,
# restart, check. Pages whose seed text changed are passed by slug and taken over one by one
# (`pnpm seed --nur`, never the full seed on real content); --reihenfolge also applies the
# navigation order from the seed.
#
#   scripts/deploy.sh                                   code and schema only
#   scripts/deploy.sh --seiten "startseite e-rechnung"  plus these pages from the seed
#   scripts/deploy.sh --seiten "…" --reihenfolge        plus the navigation order
set -euo pipefail
cd "$(dirname "$0")/.."

seiten=""
reihenfolge=false
while [ $# -gt 0 ]; do
  case "$1" in
    --seiten) seiten="$2"; shift 2 ;;
    --reihenfolge) reihenfolge=true; shift ;;
    *) echo "Unbekannte Option: $1" >&2; exit 1 ;;
  esac
done

echo "→ Stand holen"
git pull --ff-only

echo "→ Abhängigkeiten"
pnpm install --frozen-lockfile

echo "→ Datenbank-Migrationen"
pnpm migrate

for slug in $seiten; do
  echo "→ Seite „$slug“ aus dem Seed"
  pnpm seed --nur "$slug" --force
done
if [ "$reihenfolge" = true ]; then
  echo "→ Reihenfolge der Navigation"
  pnpm seed --reihenfolge --force
fi

echo "→ Build"
pnpm build

echo "→ Neustart"
sudo systemctl restart schwarzwald

echo "→ Prüfung"
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT:-3003}/"; then
    echo "✓ Läuft."
    exit 0
  fi
  sleep 2
done
echo "✗ Die Seite antwortet nicht: journalctl -u schwarzwald -n 100" >&2
exit 1
