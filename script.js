async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}

function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   Copy helpers
========================= */
function wireCopyButtons() {
  const buttons = document.querySelectorAll("[data-copy]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy") || "";
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);

        // visual feedback
        btn.classList.add("is-copied");

        // if it has a label
        const txt = btn.querySelector(".copy-text");
        const old = txt ? txt.textContent : null;
        if (txt) txt.textContent = "Copied!";

        // if it's inline copy button
        const oldInline = btn.textContent;
        if (btn.classList.contains("copy-inline")) btn.textContent = "Copied!";

        setTimeout(() => {
          btn.classList.remove("is-copied");
          if (txt && old !== null) txt.textContent = old;
          if (btn.classList.contains("copy-inline")) btn.textContent = oldInline;
        }, 1400);
      } catch (e) {
        console.error(e);
      }
    });
  });
}

/* =========================
   Assets helpers
========================= */
function getTechIconSrc(tech, techIconMap) {
  const filename = techIconMap[tech];
  if (!filename) return null;
  return `/assets/projects/tech-icons-pics/${filename}`;
}

function getProjectImageCandidates(nickname) {
  return [
    `/assets/projects/project-pics/${nickname}.png`,
    `/assets/projects/project-pics/${nickname}.jpg`,
    `/assets/projects/project-pics/${nickname}.jpeg`,
  ];
}

function renderTechBadges(techs, techIconMap) {
  return (techs || [])
    .map((t) => {
      const src = getTechIconSrc(t, techIconMap);
      if (!src) return `<span class="tech-pill">${escapeHTML(t)}</span>`;

      return `
        <img
          class="tech-icon"
          src="${src}"
          alt="${escapeHTML(t)}"
          title="${escapeHTML(t)}"
          loading="lazy"
          decoding="async"
        />
      `;
    })
    .join("");
}

/* =========================
   Card renderers
========================= */

function renderSkillsPills(skills) {
  const top = (skills || []).slice(0, 4); // ajuste: 3 ou 4 fica ótimo
  if (!top.length) return "";

  return `
    <div class="project-skills" aria-label="Key skills">
      <div class="skills-label">Key skills</div>
      <div class="skills-row">
        ${top.map((s) => `<span class="skill-pill">${escapeHTML(s)}</span>`).join("")}
      </div>
    </div>
  `;
}



function renderProjectCard(project, techIconMap, showSkills = false) {
  const name = project["project-name"];
  const nick = project["project-nickname"];
  const content = project["project-content"];
  const desc = content.description;
  const techs = content.techs || [];
  const skills = content.skills || [];
  const github = content["github-link"];
  const category = content.category;

  const [img1, img2, img3] = getProjectImageCandidates(nick);

  return `
    <article class="project-card" data-category="${escapeHTML(category)}">
      <a class="project-cover" href="${escapeHTML(github)}" target="_blank" rel="noopener noreferrer">
        <img
          class="project-cover-img"
          src="${img1}"
          alt="${escapeHTML(name)} cover"
          loading="lazy"
          decoding="async"
          onerror="this.onerror=null; this.src='${img2}'; this.onerror=function(){ this.onerror=null; this.src='${img3}'; this.onerror=function(){ this.style.display='none'; }; };"
        />
      </a>

      <div class="project-body">
        <div class="project-head">
          <h3 class="project-title">${escapeHTML(name)}</h3>
          <span class="tag">${category === "ml" ? "ML" : "Data"}</span>
        </div>

        <p class="project-desc">${escapeHTML(desc)}</p>

        <div class="project-techs">
          ${renderTechBadges(techs, techIconMap)}
        </div>

        ${showSkills ? renderSkillsPills(skills) : ""}

        <div class="project-actions">
          <a class="btn btn-ghost" href="${escapeHTML(github)}" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderCarouselCard(project, techIconMap) {
  const inner = renderProjectCard(project, techIconMap, false);
  return inner.replace('class="project-card"', 'class="carousel-card"');
}

/* =========================
   Projects page filter
========================= */
function setActiveChip(chips, filter) {
  chips.forEach((c) => c.classList.toggle("active", c.dataset.filter === filter));
}

function applyFilter(filter) {
  const cards = document.querySelectorAll(".project-card");
  cards.forEach((card) => {
    if (filter === "all") {
      card.style.display = "";
      return;
    }
    card.style.display = card.dataset.category === filter ? "" : "none";
  });
}

async function renderProjectsPage() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

const [projectsData, techIconMap] = await Promise.all([
  loadJSONCached("portfolio.projects.json", "/assets/projects/projects.json"),
  loadJSONCached("portfolio.tech-icons.json", "/assets/projects/tech-icons.json"),
]);

  grid.innerHTML = (projectsData.projects || [])
    .map((p) => renderProjectCard(p, techIconMap, true))
    .join("");

  const chips = Array.from(document.querySelectorAll(".chip"));
  if (chips.length) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.dataset.filter;
        setActiveChip(chips, filter);
        applyFilter(filter);
      });
    });
  }
}

/* =========================
   Carousel logic
========================= */
function findClosestCardIndex(viewport) {
  const cards = Array.from(viewport.querySelectorAll(".carousel-card"));
  if (!cards.length) return 0;

  const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
  let bestIdx = 0;
  let bestDist = Infinity;

  cards.forEach((card, i) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(cardCenter - viewportCenter);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  });

  return bestIdx;
}

function scrollToCard(viewport, index) {
  const cards = Array.from(viewport.querySelectorAll(".carousel-card"));
  if (!cards.length) return;

  const i = Math.max(0, Math.min(index, cards.length - 1));
  const card = cards[i];

  const left = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
  viewport.scrollTo({ left, behavior: "smooth" });
}

function bindCarouselButtons(viewportId, prevId, nextId) {
  const viewport = document.getElementById(viewportId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  if (!viewport || !prev || !next) return;

  const EPS = 2; // tolerância (pixel rounding)

  function updateButtons() {
    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;

    // Se não tem overflow (poucos cards), desativa ambos
    if (maxScrollLeft <= EPS) {
      prev.disabled = true;
      next.disabled = true;
      return;
    }

    prev.disabled = viewport.scrollLeft <= EPS;
    next.disabled = viewport.scrollLeft >= (maxScrollLeft - EPS);
  }

  prev.addEventListener("click", () => {
    const idx = findClosestCardIndex(viewport);
    scrollToCard(viewport, idx - 1);
    // Atualiza depois do smooth scroll começar
    setTimeout(updateButtons, 220);
  });

  next.addEventListener("click", () => {
    const idx = findClosestCardIndex(viewport);
    scrollToCard(viewport, idx + 1);
    setTimeout(updateButtons, 220);
  });

  viewport.addEventListener("scroll", () => {
    requestAnimationFrame(updateButtons);
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(updateButtons);
  });

  // Estado inicial
  updateButtons();
}

async function renderHomeCarousels() {
  const mlViewport = document.getElementById("ml-carousel");
  const dataViewport = document.getElementById("data-carousel");
  if (!mlViewport && !dataViewport) return;

  const projectsData = await loadJSON("/assets/projects/projects.json");
  const techIconMap = await loadJSON("/assets/projects/tech-icons.json");

  const all = projectsData.projects || [];
  const mlProjects = all.filter((p) => p?.["project-content"]?.category === "ml");
  const dataProjects = all.filter((p) => p?.["project-content"]?.category === "data");

  if (mlViewport) mlViewport.innerHTML = mlProjects.map((p) => renderCarouselCard(p, techIconMap)).join("");
  if (dataViewport) dataViewport.innerHTML = dataProjects.map((p) => renderCarouselCard(p, techIconMap)).join("");

  bindCarouselButtons("ml-carousel", "ml-prev", "ml-next");
  bindCarouselButtons("data-carousel", "data-prev", "data-next");

  if (mlViewport) requestAnimationFrame(() => scrollToCard(mlViewport, 0));
  if (dataViewport) requestAnimationFrame(() => scrollToCard(dataViewport, 0));
}

/* =========================
   Footer Tech Stack (global, auto, cached)
========================= */
async function loadJSONCached(cacheKey, path) {
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (_) {}
  }

  const data = await loadJSON(path);
  sessionStorage.setItem(cacheKey, JSON.stringify(data));
  return data;
}

async function renderGlobalTechFooter() {
  const mount = document.getElementById("global-tech-stack");
  if (!mount) return;

  try {
    const [projectsData, iconMap] = await Promise.all([
      loadJSONCached("portfolio.projects.json", "/assets/projects/projects.json"),
      loadJSONCached("portfolio.tech-icons.json", "/assets/projects/tech-icons.json"),
    ]);

    // Collect unique techs used across all projects
    const used = new Set();
    for (const p of projectsData.projects || []) {
      const techs = p?.["project-content"]?.techs || [];
      techs.forEach((t) => used.add(t));
    }

    // Only techs with mapped icons, sorted alphabetically
    const finalTechs = [...used]
      .filter((t) => iconMap[t])
      .sort((a, b) => a.localeCompare(b));

    mount.innerHTML = finalTechs
      .map((name) => {
        const file = iconMap[name];
        const src = `/assets/projects/tech-icons-pics/${file}`;
        return `
          <span class="footer-tech-icon" title="${escapeHTML(name)}" aria-label="${escapeHTML(name)}">
            <img src="${src}" alt="${escapeHTML(name)}" loading="lazy" decoding="async" />
          </span>
        `;
      })
      .join("");
  } catch (err) {
    console.error("[global-tech-footer]", err);
  }
}



function isInternalNavLink(a) {
  if (!a || !a.href) return false;

  // ignore new tabs / downloads
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;

  const href = a.getAttribute("href") || "";

  // ignore anchors and external protocols
  if (href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return false;

  try {
    const url = new URL(a.href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function enablePageTransitions() {
  requestAnimationFrame(() => {
    document.body.classList.add("is-enter");
  });

  window.addEventListener("pageshow", () => {
    document.body.classList.remove("is-exit");
    document.body.classList.add("is-enter");
  });

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!isInternalNavLink(a)) return;

    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    e.preventDefault();

    const href = a.href;

    document.body.classList.remove("is-enter");
    document.body.classList.add("is-exit");

    const go = () => { window.location.href = href; };

    // Se o browser não disparar transitionend (muito rápido), cai no fallback
    let done = false;

    const onEnd = (ev) => {
      if (ev.propertyName !== "opacity") return;
      if (done) return;
      done = true;
      document.body.removeEventListener("transitionend", onEnd);
      go();
    };

    document.body.addEventListener("transitionend", onEnd);

    // fallback mínimo (garante navegação mesmo se transitionend não vier)
    setTimeout(() => {
      if (done) return;
      done = true;
      document.body.removeEventListener("transitionend", onEnd);
      go();
    }, 50);
  });
}




/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", () => {

  enablePageTransitions(); // 👈 ADICIONE ESTA LINHA

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  wireCopyButtons();

  renderProjectsPage().catch(console.error);
  renderHomeCarousels().catch(console.error);
  renderGlobalTechFooter().catch(console.error);
});