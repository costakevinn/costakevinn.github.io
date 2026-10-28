#!/usr/bin/env python3
"""Sanity checks for the portfolio JSON/assets. Stdlib only. Run from repo root."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
P = ROOT / "assets/projects"
errors, warnings = [], []

def load(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"missing file: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as e:
        errors.append(f"invalid JSON in {path.relative_to(ROOT)}: {e}")
    return None

projects = load(P / "projects.json")
icons = load(P / "tech-icons.json")
if projects is None or icons is None:
    for e in errors: print("ERROR:", e)
    sys.exit(1)

CATS = {"ml", "data"}
seen = set()
used = set()
for i, p in enumerate(projects.get("projects", []), 1):
    tag = f"project #{i}"
    name = p.get("project-name")
    nick = p.get("project-nickname")
    c = p.get("project-content") or {}
    tag = f"{nick or name or tag}"
    if not name: errors.append(f"{tag}: missing project-name")
    if not nick: errors.append(f"{tag}: missing project-nickname")
    elif not re.fullmatch(r"[a-z0-9_-]+", nick):
        errors.append(f"{tag}: nickname must match [a-z0-9_-]+")
    if nick in seen: errors.append(f"{tag}: duplicate nickname")
    seen.add(nick)
    if not c.get("description"): errors.append(f"{tag}: missing description")
    if c.get("category") not in CATS:
        errors.append(f"{tag}: category {c.get('category')!r} not in {sorted(CATS)}")
    if not re.fullmatch(r"https://github\.com/[\w.-]+/[\w.-]+/?", c.get("github-link", "")):
        errors.append(f"{tag}: github-link missing or not a github.com/owner/repo URL")
    techs = c.get("techs") or []
    if not techs: warnings.append(f"{tag}: no techs")
    for t in techs:
        used.add(t)
        if t not in icons:
            warnings.append(f"{tag}: tech {t!r} has no entry in tech-icons.json (text pill, no footer icon)")
    if len(c.get("skills") or []) > 4:
        warnings.append(f"{tag}: more than 4 skills; only the first 4 are shown")
    if nick and not any((P / "project-pics" / f"{nick}{e}").exists() for e in (".png", ".jpg", ".jpeg")):
        warnings.append(f"{tag}: no cover image project-pics/{nick}.(png|jpg|jpeg)")

for tech, fn in icons.items():
    if not (P / "tech-icons-pics" / fn).exists():
        errors.append(f"tech-icons.json: {tech!r} -> {fn} not found in tech-icons-pics/")
for tech in sorted(set(icons) - used):
    warnings.append(f"icon {tech!r} is mapped but not used by any project (not shown in footer)")

for w in warnings: print("WARN: ", w)
for e in errors: print("ERROR:", e)
print(f"\n{len(projects.get('projects', []))} projects, {len(icons)} icons, {len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)
