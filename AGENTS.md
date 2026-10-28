# AGENTS.md — Portfolio maintenance guide

Static site (no build step) for https://costakevinn.github.io, served by GitHub Pages.
Read this before changing anything. Works for humans and AI tools alike.

## 1. How the site works

| File | Role |
|---|---|
| `index.html` | Home: hero, ML carousel, Data carousel, education, closing, footer |
| `pages/projects.html` | All projects grid + filter chips (`data-filter`) |
| `pages/contact.html` | Contact page |
| `script.js` | Fetches JSON and **renders every card, carousel and footer icon** |
| `style.css` | Layout/components. **No raw colors here** |
| `config.css` | Design tokens (colors, shadows, radii) as CSS variables |
| `assets/projects/projects.json` | **Source of truth for projects** |
| `assets/projects/tech-icons.json` | Map: tech name -> icon filename |
| `assets/projects/tech-icons-pics/` | Tech icon files |
| `assets/projects/project-pics/` | Project cover images |
| `assets/icons/social/`, `assets/icons/edu/` | Hero social icons, education logos (hard-coded in `index.html`) |
| `Dockerfile`, `nginx.conf` | Local preview only (nginx:alpine); not used by GitHub Pages |

Repo: `costakevinn/costakevinn.github.io`, branch `main` (remote via SSH).

Projects are NOT written in the HTML. Cards, carousels, tech icons and the footer icon row are
all generated at runtime from the two JSON files. **Adding a project = editing JSON + adding images.**

All URLs are absolute (`/assets/...`), so the site must be served from the domain root
(`costakevinn.github.io` or the local nginx), not from a sub-path.

## 2. Add a new project

1. Pick a `project-nickname`: lowercase, only `a-z 0-9 - _`, no spaces, no quotes
   (it is also the cover image filename and is inserted into an inline `onerror` JS string).
2. Add the cover image: `assets/projects/project-pics/<nickname>.png` (or `.jpg` / `.jpeg`).
   Lookup order is png, jpg, jpeg. If none exist the cover is silently hidden.
   Filenames are **case-sensitive** on GitHub Pages. Recommended ~16:9, wide, light file (<300 KB).
3. Add an entry to the `projects` array in `assets/projects/projects.json`:

```json
{
  "project-name": "My Project",
  "project-nickname": "my-project",
  "project-content": {
    "description": "One or two sentences, plain text (no HTML).",
    "techs": ["Python", "PyTorch", "Docker"],
    "skills": ["Probabilistic Modeling", "Model Evaluation", "Feature Engineering", "Time Series"],
    "github-link": "https://github.com/costakevinn/my-project",
    "category": "ml"
  }
}
```

4. Every tech in `techs` must exist in `tech-icons.json` (section 4), otherwise it shows as a text pill.
5. Run `python3 scripts/check_portfolio.py` (section 7) and preview locally.
6. Run `python3 scripts/sync_readme.py` to regenerate the "Selected Projects" list in `README.md` from `projects.json` (so README and site never disagree).

Real example to copy (from the current file): `filingpt`, `probnn`, `gpredict`, `thesis`, `time_series`,
`paraminsight`, `optlearn`, `chinook`, `retailsql` (the last one has a `.jpeg` cover).

Field rules:
- `project-name`: title on the card.
- `description`: rendered as escaped text; HTML is not supported.
- `skills`: only the **first 4** are shown, and only on `pages/projects.html` (not in the home carousels).
- `techs`: icon order on the card = array order.
- `github-link`: used for both the cover link and the "View on GitHub" button.
- Order on screen = order in the array. Today ML projects come first, then Data; within a category the
  order is the array order. Put the new entry where you want it to appear.
- `time_series` shows underscores are allowed in nicknames (`[a-z0-9_-]`).

## 3. Classification (`category`)

`category` decides where a project appears:

| `category` | Home carousel | Tag on card | `projects.html` |
|---|---|---|---|
| `"ml"` | "Machine Learning Projects" | ML | yes |
| `"data"` | "Data Projects" | Data | yes |
| anything else | **nowhere on home** | Data (fallback) | yes, but filters won't match |

Current split (9 projects): **ml** = FilinGPT, ProbNN, GPredict, Probabilistic ML Thesis,
Time-Series Distance Estimation; **data** = ParamInsight, OptLearn, ChinookAnalytics, RetailSQL.
Note: the root `README.md` lists ParamInsight and OptLearn under "Machine Learning" and
Time-Series under "Data & Analytics" — the opposite of the site. Decide which is right and keep both in sync.

Rule of thumb: models, training, probabilistic/statistical learning -> `ml`;
SQL, ETL, modeling of databases, analytics, pipelines -> `data`.
Values are exact lowercase strings. A typo (`"ML"`, `"Data "`) makes the project vanish from the home page.

### Adding a new category (e.g. `"systems"`) — all of these are required
1. `index.html`: copy a whole `<section class="home-section container">` block, change the title/subtitle
   and the 3 ids (`<x>-carousel`, `<x>-prev`, `<x>-next`).
2. `script.js` -> `renderHomeCarousels()`: add the filter, the `innerHTML` injection, the two
   `bindCarouselButtons(...)` / `scrollToCard(...)` calls for the new ids.
3. `script.js` -> `renderProjectCard()`: tag is `category === "ml" ? "ML" : "Data"`; extend it with the new label.
4. `pages/projects.html`: add a chip next to the existing ones
   (`All` = `all`, `Machine Learning` = `ml`, `Data & Analytics` = `data`), e.g.
   `<button class="chip" data-filter="systems" type="button">Systems</button>`
   (the filter compares `chip.dataset.filter` with the project's `category`).
5. Use the new value in `projects.json`.

## 4. Technologies and the icons

Two separate things share the word "icons":

**A) Icons on each card** and **B) the icon row in the footer (all pages)** — both come from `techs` + `tech-icons.json`.

- `tech-icons.json` is a flat map `{ "<Tech name>": "<filename>" }`; the file lives in
  `assets/projects/tech-icons-pics/<filename>`.
  Example: `"PyTorch": "pytorch.svg"`.
- The key must match the string used in a project's `techs` **exactly** (case and spaces).
- No mapping -> card shows a text pill (`.tech-pill`) and the tech **does not appear in the footer**.
- Footer = unique techs used by at least one project, **that have an icon**, sorted alphabetically.
  So a tech only shows in the footer once a project uses it. Nothing to edit in the footer itself.

### Add a new technology
1. Put the icon in `assets/projects/tech-icons-pics/` (SVG preferred, square, ~24-64 px viewBox,
   transparent background, lowercase filename without spaces).
2. Add `"Tech Name": "file.svg"` to `assets/projects/tech-icons.json`.
3. Use `"Tech Name"` in the `techs` of at least one project.
4. Run the check script. Icons are displayed at 22 px (cards) and 24 px (footer).

Currently mapped (16): Python, NumPy, Pandas, SciPy, Matplotlib, scikit-learn, TensorFlow, Keras, PyTorch,
OpenCV, PostgreSQL, SQL, Docker, Jupyter, Astropy, JSONL. Keras, OpenCV and Jupyter are mapped but not used
by any project yet, so they don't show in the footer (13 icons shown today). Note the exact spelling:
`scikit-learn` (lowercase), `PyTorch`, `PostgreSQL`, `JSONL`.

Reuse the existing spelling for known techs (see current keys in `tech-icons.json`) —
do not create `"Pytorch"` next to `"PyTorch"`.

### Worked example: new project that uses a library not in the site yet (MediaPipe)

Goal: project `gesture-demo`, category `ml`, techs Python + OpenCV + MediaPipe. MediaPipe has no icon yet.

1. Get an icon for the new tech: look for an SVG on https://simpleicons.org or https://devicon.dev
   (check the license; official logos are normally fine for a "tech used" badge). If none exists,
   skip the icon: the tech still shows as a text pill, and you can add the icon later.
2. Save it as `assets/projects/tech-icons-pics/mediapipe.svg` (lowercase, no spaces; SVG, square, transparent).
3. Register it in `assets/projects/tech-icons.json` (add a comma to the previous line):
   `"MediaPipe": "mediapipe.svg"`
4. Add the cover `assets/projects/project-pics/gesture-demo.png`.
5. Add the project to `assets/projects/projects.json`:
   ```json
   {
     "project-name": "Gesture Demo",
     "project-nickname": "gesture-demo",
     "project-content": {
       "description": "Real-time hand gesture recognition using landmark detection.",
       "techs": ["Python", "OpenCV", "MediaPipe"],
       "skills": ["Computer Vision", "Real-Time Inference", "Feature Engineering", "Model Evaluation"],
       "category": "ml",
       "github-link": "https://github.com/costakevinn/gesture-demo"
     }
   }
   ```
6. `python3 scripts/check_portfolio.py` -> no ERROR, and no warning about `MediaPipe`.
7. Preview and confirm: card shows 3 tech icons, project is in the ML carousel, and MediaPipe's icon
   now appears in the footer (this happens automatically because a project uses it).

Order matters: if a project lists a tech that is not yet in `tech-icons.json`, the site still works but shows a
gray text pill and no footer icon, and the check script warns. That warning means "do steps 1-3".

### Other icon sets (hard-coded in `index.html`, not JSON-driven)
- Social pills on home: `assets/icons/social/*.svg` (`linkedin`, `github`, `gmail`).
- `pages/contact.html` is also hard-coded: cards for LinkedIn, GitHub, Email (+ copy button), WhatsApp, Telegram
  (`whatsapp.svg`, `telegram.svg`). `email.svg` exists but is unused. To add a contact channel, copy a
  `<a class="card card-link">` block and add the svg to `assets/icons/social/`.
- The e-mail address appears in 3 places (home mailto, home copy button, contact page): change all together.
- Education logos: `assets/icons/edu/` (`ufes.png`, `ifes.svg`); styled grayscale in `style.css` (`.edu-logo`).
- Favicon / profile: `assets/img/favicon.png`, `assets/img/profile.jpg` (also used as `og:image`).

## 5. Edit, reorder or remove a project

Everything is in `assets/projects/projects.json`. No HTML changes are needed for any of these.

**Edit a project** (description, link, techs, skills, name): change the fields of its entry.
Rules from sections 2-4 still apply (valid `category`, tech names identical to `tech-icons.json` keys,
new tech = new icon + mapping).

**Change its category** (`"ml"` <-> `"data"`): change only `category`. The card moves to the other home
carousel and the tag changes. Then run `sync_readme.py` so the README moves it too.

**Reorder**: move the entry inside the `projects` array. Home carousels keep the array order within each
category; `pages/projects.html` shows the array order across all projects.

**Change a cover image**: save the new file as `assets/projects/project-pics/<nickname>.png`.
Lookup order is `.png`, then `.jpg`, then `.jpeg`, so an old `.png` hides a new `.jpg`/`.jpeg`:
**delete the old file when the extension changes**. Hard refresh (Ctrl+Shift+R) to see it.

**Rename a project's nickname**: also rename its cover file to the same new name, otherwise the cover disappears.
(Changing only `project-name` is safe.)

**Remove a project**:
1. Delete its whole `{ ... }` block from the array (watch the commas: no comma after the last item).
2. Delete its cover from `project-pics/`.
3. Run `check_portfolio.py` and `sync_readme.py`.
4. Technologies: nothing to do. If no other project uses a tech, its icon leaves the footer by itself.
   The check script then warns "mapped but not used"; the mapping and icon file can stay for later, or be
   deleted from `tech-icons.json` and `tech-icons-pics/` if you will not use them again.

**JSON pitfalls**: double quotes only, no trailing comma, a missing comma between entries breaks the whole site
(empty carousels and grid). `check_portfolio.py` reports invalid JSON with the line number.

After any change: run the checks in the "Verify before every push" section, then commit and push.

## 6. Style rules
- Colors, shadows, radii, opacities: only in `config.css` as variables. `style.css` must use `var(--...)`.
- Keep the site dependency-free: no framework, no build step, no npm.
- Mobile matters: the carousel arrows are hidden below 640 px; cards use `flex-basis` percentages. Check at ~380 px.

## 7. Verify before every push

Run: `python3 scripts/check_portfolio.py` (stdlib only). It checks: valid JSON, required fields,
`category` values, duplicate nicknames, `github-link` format, every tech has an icon mapping,
icon files exist, cover image exists for each project, `skills` > 4 (warning).

Then preview (Docker, nothing installed on the host):
```bash
docker build -t portfolio . && docker run --rm -p 8080:80 portfolio
# open http://localhost:8080  (Ctrl+Shift+R)
```
Checklist in the browser:
- [ ] Home: the project is in the right carousel; arrows work; cover loads.
- [ ] `/pages/projects.html`: card appears; filter chips (All / ML / Data) show/hide it; 4 skill pills at most.
- [ ] Tech icons show on the card (no gray text pills unless intended).
- [ ] Footer shows the new tech icon (hover shows name).
- [ ] DevTools console has no red errors / no 404 in Network.
- [ ] Narrow window (~380 px): layout OK.

### Cache gotchas (most common "it didn't update" causes)
- `projects.html` and the footer cache both JSONs in **`sessionStorage`**
  (`portfolio.projects.json`, `portfolio.tech-icons.json`). After editing JSON, open a **new tab/window**
  or run `sessionStorage.clear()` in the console, otherwise you see old data.
- GitHub Pages can take 1–10 minutes to publish after a push; hard refresh afterwards.
- Docker preview serves the image copy: rebuild (`docker build`) after each change.
- Expected, harmless 404s: a cover that is `.jpeg` (e.g. `retailsql`) first tries `.png` and `.jpg`, so the
  console shows 404s before it loads. Prefer `.png` for new covers to avoid the noise.

## 8. Deploy
`git add -A && git commit -m "Add <project>" && git push` to the branch GitHub Pages publishes
(`main`; confirm in repo Settings -> Pages). Never commit secrets (`.env*`, keys).

## 9. Notes for AI tools
- Do not hand-write project cards into HTML; edit JSON only.
- Do not invent technologies, links or metrics. Ask for the real repo URL and description.
- Keep `category` to the exact allowed values; keep tech names identical to `tech-icons.json` keys.
- Make the smallest change that works, run the check script, and report what you verified.
- Do not change existing projects' order or text unless asked.
