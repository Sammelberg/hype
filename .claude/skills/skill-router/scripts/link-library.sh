#!/usr/bin/env bash
# Links the shared skill library (~/Schreibtisch/claude) into this project and rebuilds the index.
# Library categories are linked as-is; core skills of the library that neither this project
# nor ~/.claude/skills provides are linked into the extra category `kern`.
# Safe to re-run: the link directory is rebuilt from scratch. The source is never modified.
set -euo pipefail

SRC="${SKILL_LIBRARY_SRC:-$HOME/Schreibtisch/claude/.claude}"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
DST="$ROOT/.claude/skills-library"

[ -d "$SRC/skills-library" ] || { echo "Bibliothek nicht gefunden: $SRC/skills-library" >&2; exit 1; }

rm -rf "$DST"
mkdir -p "$DST/kern"

for cat in "$SRC"/skills-library/*/; do
  ln -s "${cat%/}" "$DST/$(basename "$cat")"
done

for skill in "$SRC"/skills/*/; do
  name="$(basename "$skill")"
  [ -e "$ROOT/.claude/skills/$name" ] && continue
  [ -e "$HOME/.claude/skills/$name" ] && continue
  ln -s "${skill%/}" "$DST/kern/$name"
done

python3 "$ROOT/.claude/skills/skill-router/scripts/reindex.py"
