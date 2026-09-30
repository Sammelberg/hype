#!/usr/bin/env bash
# Checks E-Rechnungen with the Mustang validator (EN 16931, XRechnung rules, ZUGFeRD/Factur-X,
# PDF/A-3) — a second, independent opinion beside the KoSIT test (src/buero/logik/
# xrechnung.kosit.test.ts). Runs Java in a container; the validator is downloaded once into the
# Docker volume `starter-mustang` and checked against its SHA-256 (pinned on first use from the
# copy the port project had validated with). Nothing leaves the machine but that download.
#   scripts/pruefe-e-rechnung.sh RE-2026-0001.xml     one file (a downloaded XRechnung)
#   scripts/pruefe-e-rechnung.sh .e-rechnung-proben   every .xml/.pdf in a folder
# Exit 1 when any file is invalid; Mustang's report lands beside each file as <name>.pruefung.xml.
set -uo pipefail
version=2.26.0
jar=Mustang-CLI-$version.jar
sha=42d7868cb68264874a7b8cab4c3587b03b23ccc7cd72373da917f66758bb9736
ziel=$(realpath "${1:?Datei oder Ordner angeben: scripts/pruefe-e-rechnung.sh rechnung.xml}")

if [ -d "$ziel" ]; then
  dir=$ziel
  mapfile -t dateien < <(find "$ziel" -maxdepth 1 -type f \( -name '*.xml' -o -name '*.pdf' \) ! -name '*.pruefung.xml' -printf '%f\n' | sort)
else
  dir=$(dirname "$ziel")
  dateien=("$(basename "$ziel")")
fi
[ ${#dateien[@]} -gt 0 ] || { echo "Keine .xml- oder .pdf-Dateien in $ziel" >&2; exit 1; }

docker run --rm -v starter-mustang:/opt/mustang eclipse-temurin:21-jre sh -c "
  [ -f /opt/mustang/$jar ] || wget -q -O /opt/mustang/$jar \
    https://github.com/ZUGFeRD/mustangproject/releases/download/core-$version/$jar
  echo '$sha  /opt/mustang/$jar' | sha256sum -c --status || { echo 'Prüfsumme des Validators stimmt nicht' >&2; rm -f /opt/mustang/$jar; exit 3; }
" || exit 3

fehler=0
for d in "${dateien[@]}"; do
  bericht="$dir/${d%.*}.pruefung.xml"
  docker run --rm -v starter-mustang:/opt/mustang:ro -v "$dir:/in:ro" eclipse-temurin:21-jre \
    java -jar /opt/mustang/$jar --action validate --source "/in/$d" --no-notices --disable-file-logging \
    2>/dev/null >"$bericht"
  if grep -q '<summary status="valid"' "$bericht"; then
    printf 'gültig    %s\n' "$d"
  else
    fehler=1
    printf 'UNGÜLTIG  %s\n' "$d"
    grep -oE '<error[^>]*>[^<]*' "$bericht" | sed -E 's/<error[^>]*>/            /' | sort -u
  fi
done
exit $fehler
