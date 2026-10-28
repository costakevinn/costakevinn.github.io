import json, re
from pathlib import Path
d = json.loads(Path("assets/projects/projects.json").read_text(encoding="utf-8"))["projects"]
def block(cat):
    out = []
    for p in d:
        c = p["project-content"]
        if c["category"] == cat:
            out.append(f"**{p['project-name']}**  \n{c['description']}  \n→ {c['github-link']}  \n")
    return "\n".join(out)
new = ("## Selected Projects\n\n### Machine Learning\n\n" + block("ml")
       + "\n---\n\n### Data & Analytics\n\n" + block("data") + "\n---\n\n")
r = Path("README.md"); s = r.read_text(encoding="utf-8")
s2, n = re.subn(r"## Selected Projects\n.*?(?=## Core Competencies)", lambda m: new, s, flags=re.S)
assert n == 1
r.write_text(s2, encoding="utf-8")
