#!/usr/bin/env python3
"""Пересобирает manifest.json — индекс всех скиллов для роутера.

Запускать после добавления, удаления или перемещения скиллов между
.claude/skills/ и .claude/skills-library/.

  reindex.py            пересобрать
  reindex.py --check    только проверить целостность, ничего не писать
"""
import collections
import json
import os
import re
import sys

STOP = set("""the a an and or of for to in on with use used using when this that is are be as by
from it its your you not no all any if then else at into out up down over under more most other
some such only own same so than too very can will just should now what which who whom whose how
why where skill skills user users make makes made get gets getting give gives given need needs
needed want wants help helps also them they their there here about after before between during
each few many much must may might shall would could does did done doing have has had having""".split())


def find_root():
    d = os.path.abspath(os.path.dirname(__file__))
    for _ in range(8):
        if os.path.isdir(os.path.join(d, ".claude", "skills-library")):
            return d
        nd = os.path.dirname(d)
        if nd == d:
            break
        d = nd
    sys.exit("не найден корень проекта с .claude/skills-library/")


ROOT = find_root()
LIB = os.path.join(ROOT, ".claude", "skills-library")
CORE = os.path.join(ROOT, ".claude", "skills")


def keywords(text, n=14):
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9\-]{2,}", text.lower())
    c = collections.Counter(w for w in words if w not in STOP and len(w) > 2)
    return [w for w, _ in c.most_common(n)]


def read_skill(d, cat, active, problems):
    f = os.path.join(d, "SKILL.md")
    if not os.path.isfile(f):
        return None
    name = os.path.basename(d)
    raw = open(f, encoding="utf-8", errors="ignore").read()
    m = re.search(r"^name:\s*(.+?)$", raw, re.M)
    fm_name = m.group(1).strip().strip("\"'") if m else ""
    if fm_name and fm_name != name:
        problems.append(f"имя не совпадает с папкой: {cat}/{name} -> name: {fm_name}")
    if not fm_name:
        problems.append(f"нет поля name: {cat}/{name}")
    m = re.search(r"^description:\s*(.*?)$", raw, re.M)
    desc = m.group(1).strip() if m else ""
    if m and desc in ("", ">", ">-", "|", "|-"):
        # YAML block scalar: the description is the indented lines that follow.
        tail = raw[m.end():].split("\n")[1:]
        block = []
        for line in tail:
            if line.strip() and not line.startswith((" ", "\t")):
                break
            block.append(line.strip())
        desc = " ".join(x for x in block if x)
    desc = desc.strip("\"'")[:400]
    if not desc:
        problems.append(f"нет описания: {cat}/{name}")
    body = raw[:8000]
    heads = " ".join(re.findall(r"^#{1,3}\s+(.+)$", body, re.M))
    # Text of the skill without frontmatter and code blocks: route.py searches it with a low
    # weight, so terms that only live inside the skill ("before/after", "offscreen") still hit.
    text = re.sub(r"\A---.*?^---\s*$", "", raw, flags=re.S | re.M)
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"\s+", " ", text)[:6000]
    refs = [x for x in os.listdir(d) if x.endswith(".md") and x != "SKILL.md"]
    sub = os.path.join(d, "references")
    if os.path.isdir(sub):
        refs += ["references/" + x for x in os.listdir(sub) if x.endswith(".md")]
    return {
        "name": name, "cat": cat, "active": active,
        "path": os.path.relpath(d, ROOT),
        "desc": desc,
        "kw": keywords(desc + " " + heads + " " + name.replace("-", " ")),
        "refs": sorted(refs)[:12],
        "body": text,
    }


def main():
    check_only = "--check" in sys.argv
    rows, problems = [], []
    for cat in sorted(os.listdir(LIB)):
        p = os.path.join(LIB, cat)
        if not os.path.isdir(p):
            continue
        for name in sorted(os.listdir(p)):
            d = os.path.join(p, name)
            if os.path.isdir(d):
                r = read_skill(d, cat, False, problems)
                if r:
                    rows.append(r)
    for name in sorted(os.listdir(CORE)):
        d = os.path.join(CORE, name)
        if os.path.isdir(d):
            r = read_skill(d, "core", True, problems)
            if r:
                rows.append(r)

    seen = collections.Counter(r["name"] for r in rows)
    for n, c in seen.items():
        if c > 1:
            problems.append(f"дубль имени в разных категориях: {n} ({c})")

    core_n = sum(1 for r in rows if r["active"])
    print(f"скиллов: {len(rows)}  ядро: {core_n}  библиотека: {len(rows) - core_n}")
    if problems:
        print(f"\nпроблемы ({len(problems)}):")
        for p in problems:
            print("  " + p)
    else:
        print("проблем нет")

    if check_only:
        return
    out = os.path.join(LIB, "manifest.json")
    json.dump(rows, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"индекс записан: {os.path.relpath(out, ROOT)} ({round(os.path.getsize(out)/1024)} КБ)")


if __name__ == "__main__":
    main()
