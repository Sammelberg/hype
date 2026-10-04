#!/usr/bin/env bash
# Links the shared skill library into this project and rebuilds the index. The source is the local
# working copy (~/Schreibtisch/claude/.claude) where it exists; elsewhere — cloud sessions, another
# machine — a clone of the repository Sammelberg/skills, kept in .claude/.skills-quelle (gitignored)
# and updated on every run.
# Library categories are linked as-is; core skills of the library that neither this project
# nor ~/.claude/skills provides are linked into the extra category `kern`.
# Safe to re-run: the link directory is rebuilt from scratch. The source is never modified.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
DST="$ROOT/.claude/skills-library"
REPO="${SKILL_LIBRARY_REPO:-https://github.com/Sammelberg/skills}"
SRC="${SKILL_LIBRARY_SRC:-$HOME/Schreibtisch/claude/.claude}"

if [ -z "${SKILL_LIBRARY_SRC:-}" ] && [ ! -d "$SRC/skills-library" ]; then
  SRC="$ROOT/.claude/.skills-quelle"
  if [ -d "$SRC/.git" ]; then
    git -C "$SRC" pull --quiet --ff-only || echo "Bibliothek nicht aktualisiert, nutze den Stand vor Ort." >&2
  else
    echo "Bibliothek wird geladen: $REPO" >&2
    git clone --quiet --depth 1 "$REPO" "$SRC"
  fi
fi

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
