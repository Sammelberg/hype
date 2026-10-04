#!/usr/bin/env bash
# First setup on the server, once, idempotent: deploy/.env with fresh secrets (kept if it
# exists) and the nightly jobs in this user's crontab. No root needed.
# Usage: deploy/einrichten.sh [--ohne-cron]   then: deploy/inhalt.sh < dump, deploy/admin.sh <e-mail>, deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
here=$(pwd)

secret() { openssl rand -base64 64 | tr -d '/+=\n' | cut -c1-"$1"; }
if [ ! -f .env ]; then
  sed -e "s|^FORM_SECRET=$|FORM_SECRET=$(secret 48)|" \
    -e "s|^CRON_SECRET=$|CRON_SECRET=$(secret 48)|" \
    -e "s|^MAIL_SECRET=$|MAIL_SECRET=$(secret 48)|" \
    -e "s|^POSTGRES_PASSWORD=$|POSTGRES_PASSWORD=$(secret 40)|" .env.example >.env
  chmod 600 .env
  echo "deploy/.env angelegt (Geheimnisse erzeugt). Domain prüfen: NEXT_PUBLIC_SERVER_URL."
else
  echo "deploy/.env besteht – bleibt, wie sie ist."
fi

if [ "${1:-}" = "--ohne-cron" ]; then exit 0; fi

# Retention every night (the Datenschutzerklärung promises it), scheduled publishing every
# five minutes. Marked lines, so a second run replaces them instead of adding more.
mark="# hype-aufgaben"
{
  crontab -l 2>/dev/null | grep -v "$mark" || true
  echo "15 3 * * * $here/aufgabe.sh aufbewahrung >>$HOME/hype-aufgaben.log 2>&1 $mark"
  echo "*/5 * * * * $here/aufgabe.sh geplant >>$HOME/hype-aufgaben.log 2>&1 $mark"
} | crontab -
echo "Crontab: Aufbewahrung nachts, geplante Veröffentlichung alle 5 Minuten."
