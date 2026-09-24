#!/usr/bin/env bash
# Copies the core skills listed in vendored-skills.txt from ~/.claude/skills into this project's
# .claude/skills, so they travel with git (other machines, cloud sessions, projects from the
# template). Each listed skill is replaced wholesale; VCS and dependency folders are skipped.
# Source override: VENDOR_SKILLS_SRC=/path/to/skills.
set -euo pipefail

SRC="${VENDOR_SKILLS_SRC:-$HOME/.claude/skills}"
ROUTER="$(cd "$(dirname "$0")/.." && pwd)"
DST="$(cd "$ROUTER/.." && pwd)"

missing=0
while read -r name; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  if [ ! -d "$SRC/$name" ]; then
    echo "fehlt in $SRC: $name" >&2
    missing=1
    continue
  fi
  rsync -a --delete --exclude .git --exclude .github --exclude node_modules --exclude __pycache__ \
    "$SRC/$name/" "$DST/$name/"
  echo "  $name"
done < "$ROUTER/vendored-skills.txt"

# Vendored skills keep their upstream formatting: keep them out of `prettier --check` (CI).
IGNORE="$(cd "$DST/../.." && pwd)/.prettierignore"
BEGIN="# BEGIN vendored skills (vendor-skills.sh)"
END="# END vendored skills"
{
  sed "/^$BEGIN\$/,/^$END\$/d" "$IGNORE"
  echo "$BEGIN"
  grep -v '^#' "$ROUTER/vendored-skills.txt" | sed '/^$/d; s#^#.claude/skills/#'
  echo "$END"
} > "$IGNORE.tmp"
mv "$IGNORE.tmp" "$IGNORE"

exit "$missing"
