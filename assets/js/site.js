// =========================
// sudoxs_web - site.js
// - English-only comments by request
// - Safe DOM updates (no innerHTML for untrusted strings)
// =========================

// =========================
// Base Path Helpers
// =========================
function getBasePath() {
  const meta = document.querySelector('meta[name="site-base"]');
  const base = meta ? meta.getAttribute("content") : "";
  return base || ""; // "" or "/repo"
}

function withBase(urlPath) {
  const base = getBasePath();
  if (!urlPath) return base || "";

  // If already prefixed with base (avoid double prefix)
  if (base && urlPath.startsWith(base + "/")) return urlPath;

  if (!urlPath.startsWith("/")) return (base ? base + "/" : "/") + urlPath;
  return (base || "") + urlPath;
}

// =========================
// Drawer UI
// =========================
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("overlay");
const btnOpen = document.getElementById("drawerOpen");
const btnClose = document.getElementById("drawerClose");

function openDrawer() {
  if (!drawer || !overlay) return;
  drawer.classList.add("isOpen");
  drawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeDrawer() {
  if (!drawer || !overlay) return;
  drawer.classList.remove("isOpen");
  drawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
}

btnOpen?.addEventListener("click", openDrawer);
btnClose?.addEventListener("click", closeDrawer);
overlay?.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (e) => {
  // Only close when drawer is open
  if (e.key === "Escape" && drawer?.classList.contains("isOpen")) closeDrawer();
});

// =========================
// State
// =========================
let INDEX = null;
let CURRENT_FOLDER = "/content";
let TREE = null;

// =========================
// Data Load
// =========================
async function loadIndex() {
  const res = await fetch(withBase("/assets/search_index.json"), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load search_index.json");
  return res.json();
}

// =========================
// Tree Helpers
// =========================
function splitPath(p) {
  return (p || "").replace(/^\/+/, "").split("/").filter(Boolean);
}

function isUnderContent(pathArr) {
  return pathArr.length > 0 && pathArr[0] === "content";
}

function buildTree(items) {
  const root = { name: "/", children: new Map(), items: [] };

  for (const it of items) {
    const ref = it.url || it.path || "";
    const parts = splitPath(ref);
    if (!isUnderContent(parts)) continue;

    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        node.items.push({
          kind: it.type, // "file" | "page"
          name: it.type === "page" ? (it.title || seg) : (it.name || seg),
          url: it.url,
          path: it.path,
          fullPath: "/" + parts.join("/")
        });
      } else {
        if (!node.children.has(seg)) {
          node.children.set(seg, { name: seg, children: new Map(), items: [] });
        }
        node = node.children.get(seg);
      }
    }
  }

  return root;
}

function findNodeByPath(treeRoot, folderPath) {
  const parts = splitPath(folderPath);
  let node = treeRoot;

  for (const seg of parts) {
    if (!node.children.has(seg)) return null;
    node = node.children.get(seg);
  }
  return node;
}

// =========================
// DOM Helpers (safe)
// =========================
function el(tag, className) {
  const x = document.createElement(tag);
  if (className) x.className = className;
  return x;
}

function setDrawerBreadcrumb(text) {
  const bc = document.getElementById("drawerBreadcrumb");
  if (!bc) return;
  bc.textContent = text;
}

function getDrawerList() {
  return document.getElementById("drawerList");
}

// =========================
// Drawer Explorer Rendering
// =========================
function renderFolder(folderPath) {
  CURRENT_FOLDER = folderPath;

  const list = getDrawerList();
  if (!list) return;

  list.textContent = "";

  const node = findNodeByPath(TREE, folderPath);
  if (!node) {
    const msg = el("div", "muted small");
    msg.textContent = "Folder not found in index.";
    list.appendChild(msg);
    setDrawerBreadcrumb(folderPath);
    return;
  }

  setDrawerBreadcrumb(folderPath);

  // Back item (except /content)
  if (folderPath !== "/content") {
    const backRow = el("div", "drawerItem");
    const left = el("div", "drawerItem__left");

    const icon = el("div", "icon");
    icon.textContent = "↩";
    const name = el("div", "drawerItem__name");
    name.textContent = ".. (Back)";

    left.appendChild(icon);
    left.appendChild(name);

    const btn = el("button", "drawerItem__btn");
    btn.type = "button";
    btn.textContent = "Up";
    btn.addEventListener("click", () => {
      const parts = splitPath(folderPath);
      parts.pop();
      const up = "/" + parts.join("/");
      renderFolder(up || "/content");
    });

    backRow.appendChild(left);
    backRow.appendChild(btn);
    list.appendChild(backRow);
  }

  // Folders
  const folders = [...node.children.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const f of folders) {
    const row = el("div", "drawerItem");

    const left = el("div", "drawerItem__left");
    const icon = el("div", "icon");
    icon.textContent = "📁";
    const name = el("div", "drawerItem__name");
    name.textContent = f.name;

    left.appendChild(icon);
    left.appendChild(name);

    const btn = el("button", "drawerItem__btn");
    btn.type = "button";
    btn.textContent = "Open";
    btn.addEventListener("click", () => renderFolder(`${folderPath}/${f.name}`));

    row.appendChild(left);
    row.appendChild(btn);
    list.appendChild(row);
  }

  // Files/pages
  const items = [...node.items].sort((a, b) => a.name.localeCompare(b.name));
  for (const it of items) {
    const row = el("div", "drawerItem");

    const left = el("div", "drawerItem__left");
    const icon = el("div", "icon");
    icon.textContent = it.kind === "page" ? "📝" : "📄";
    const name = el("div", "drawerItem__name");
    name.textContent = it.name;

    left.appendChild(icon);
    left.appendChild(name);

    const a = el("a", "link");
    a.href = withBase(it.url);
    a.textContent = "Open";
    a.rel = "noopener";
    a.addEventListener("click", () => closeDrawer());

    row.appendChild(left);
    row.appendChild(a);
    list.appendChild(row);
  }

  if (folders.length === 0 && items.length === 0) {
    const msg = el("div", "muted small");
    msg.textContent = "This folder is empty.";
    list.appendChild(msg);
  }
}

// =========================
// Content File Tree (ASCII)
// - Renders full /content directory as nested lists
// - Files/pages are links
// - Requires an element: <div id="contentTree" class="file-tree"></div>
// =========================
function renderContentTree(mountId = "contentTree", rootPath = "/content") {
  const mount = document.getElementById(mountId);
  if (!mount || !TREE) return;

  mount.textContent = "";

  const rootNode = findNodeByPath(TREE, rootPath);
  if (!rootNode) {
    const msg = el("div", "muted small");
    msg.textContent = "Content folder not found in index.";
    mount.appendChild(msg);
    return;
  }

  const ul = el("ul");
  mount.appendChild(ul);
  buildNodeList(rootNode, rootPath, ul);
}

function buildNodeList(node, folderPath, parentUl) {
  const folders = [...node.children.values()].sort((a, b) => a.name.localeCompare(b.name));
  const items = [...node.items].sort((a, b) => a.name.localeCompare(b.name));

  // Folders
  for (const f of folders) {
    const li = el("li");

    const row = el("span", "tree-row");

    const toggle = el("button", "tree-toggle");
    toggle.type = "button";
    toggle.textContent = "Open";

    const label = el("span");
    label.textContent = `📁 ${f.name}`;

    row.appendChild(toggle);
    row.appendChild(label);
    li.appendChild(row);

    const childUl = el("ul");
    childUl.hidden = true;
    li.appendChild(childUl);

    const childPath = `${folderPath}/${f.name}`;
    let isOpen = false;

    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      toggle.textContent = isOpen ? "Close" : "Open";
      childUl.hidden = !isOpen;

      // Lazy render once
      if (isOpen && childUl.childNodes.length === 0) {
        buildNodeList(f, childPath, childUl);
      }
    });

    parentUl.appendChild(li);
  }

  // Files/pages
  for (const it of items) {
    const li = el("li");

    const a = el("a", "tree-link");
    a.href = withBase(it.url);
    a.rel = "noopener";
    a.textContent = `${it.kind === "page" ? "📝" : "📄"} ${it.name}`;

    li.appendChild(a);
    parentUl.appendChild(li);
  }

  if (folders.length === 0 && items.length === 0) {
    const li = el("li");
    li.textContent = "(empty)";
    parentUl.appendChild(li);
  }
}

// =========================
// Secure Search (results inside drawer)
// =========================
function normalize(s) {
  return (s || "").toLowerCase().trim();
}

function attachSearch(allItems) {
  const input = document.getElementById("searchInput");
  const meta = document.getElementById("searchMeta");
  const list = getDrawerList();
  if (!input || !meta || !list) return;

  input.addEventListener("input", () => {
    const q = normalize(input.value);

    if (!q) {
      meta.textContent = "";
      renderFolder(CURRENT_FOLDER);
      return;
    }

    const matches = allItems
      .filter(x => {
        const where = normalize(`${x.path || ""} ${x.url || ""}`);
        // Accept both "content/" and "/content/"
        return where.includes("content/") || where.includes("/content/");
      })
      .filter(x => {
        const title = x.type === "page" ? x.title : x.name;
        const hay = normalize(`${title || ""} ${x.body || ""} ${x.path || ""} ${x.url || ""}`);
        return hay.includes(q);
      })
      .slice(0, 40);

    meta.textContent = matches.length === 0 ? "No results" : `${matches.length} result(s)`;
    setDrawerBreadcrumb(`/search: ${q}`);

    list.textContent = "";

    for (const m of matches) {
      const row = el("div", "drawerItem");

      const left = el("div", "drawerItem__left");
      const icon = el("div", "icon");
      icon.textContent = m.type === "page" ? "📝" : "📄";

      const name = el("div", "drawerItem__name");
      name.textContent = (m.type === "page" ? m.title : m.name) || "Untitled";

      left.appendChild(icon);
      left.appendChild(name);

      const a = el("a", "link");
      a.href = withBase(m.url);
      a.textContent = "Open";
      a.rel = "noopener";
      a.addEventListener("click", () => closeDrawer());

      row.appendChild(left);
      row.appendChild(a);
      list.appendChild(row);
    }
  });
}

// =========================
// Boot
// =========================
(async function boot() {
  try {
    INDEX = await loadIndex();

    const all = [
      ...(INDEX.pages || []).map(p => ({
        type: "page",
        title: p.title,
        url: p.url,
        path: p.path,
        body: p.body
      })),

      ...(INDEX.files || []).map(f => ({
        type: "file",
        name: f.name,
        url: f.url,
        path: f.path
      }))
    ];

    TREE = buildTree(all);
    window.__TREE__ = TREE;

    attachSearch(all);

    // Initial view: content root inside drawer
    renderFolder("/content");

    // Optional: render full content tree if #contentTree exists on page
    renderContentTree("contentTree", "/content");
  } catch (e) {
    console.error(e);
    const list = getDrawerList();
    if (list) list.textContent = "Failed to load index.";
  }
})();


// =========================
// Loading Screen
// - Hide on DOM ready (faster UX than window.load)
// - Fade out smoothly, then optionally remove from layout
// =========================
(function initLoadingScreen() {
  function hideLoader() {
    const loader = document.getElementById("loadingScreen");
    if (!loader) return;

    // fade out
    loader.classList.add("is-hidden");
    loader.setAttribute("aria-hidden", "true");

    // optional: remove after transition
    window.setTimeout(() => {
      loader.classList.add("is-gone");
    }, 420);
  }

  // Hide as soon as the DOM is ready (not waiting for images/fonts)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideLoader, { once: true });
  } else {
    hideLoader();
  }
})();
