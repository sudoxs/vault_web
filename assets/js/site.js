// =========================
// Vault — site.js
// =========================

// =========================
// Base path
// =========================
function getBase() {
  const m = document.querySelector('meta[name="site-base"]');
  return m ? m.getAttribute("content") : "";
}

function withBase(path) {
  const base = getBase();
  if (!path) return base || "";
  if (base && path.startsWith(base + "/")) return path;
  if (!path.startsWith("/")) return (base ? base + "/" : "/") + path;
  return (base || "") + path;
}

// =========================
// Drawer
// =========================
const drawer  = document.getElementById("drawer");
const overlay = document.getElementById("overlay");
const btnOpen = document.getElementById("drawerOpen");
const btnClose= document.getElementById("drawerClose");

function openDrawer()  {
  drawer?.classList.add("isOpen");
  drawer?.setAttribute("aria-hidden","false");
  if (overlay) overlay.hidden = false;
}
function closeDrawer() {
  drawer?.classList.remove("isOpen");
  drawer?.setAttribute("aria-hidden","true");
  if (overlay) overlay.hidden = true;
}

btnOpen?.addEventListener("click", openDrawer);
btnClose?.addEventListener("click", closeDrawer);
overlay?.addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && drawer?.classList.contains("isOpen")) closeDrawer();
});

// =========================
// State
// =========================
let INDEX = null;
let TREE  = null;
let CONTENT_DIR = "/content";
let CURRENT_FOLDER = CONTENT_DIR;

// =========================
// Fetch index
// =========================
async function loadIndex() {
  const res = await fetch(withBase("/assets/search_index.json"), { cache: "no-store" });
  if (!res.ok) throw new Error("search_index.json not found");
  return res.json();
}

// =========================
// Tree helpers
// =========================
function splitPath(p) {
  return (p || "").replace(/^\/+/, "").split("/").filter(Boolean);
}

function isUnderContentDir(parts) {
  const dir = CONTENT_DIR.replace(/^\/+/, "");
  return parts.length > 0 && parts[0] === dir;
}

function buildTree(items) {
  const root = { name: "/", children: new Map(), items: [] };

  for (const it of items) {
    const ref   = it.url || it.path || "";
    const parts = splitPath(ref);
    if (!isUnderContentDir(parts)) continue;

    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const seg    = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        node.items.push({
          kind:     it.type,
          name:     it.type === "page" ? (it.title || seg) : (it.name || seg),
          url:      it.url,
          path:     it.path,
          fullPath: "/" + parts.join("/"),
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

function findNode(root, folderPath) {
  const parts = splitPath(folderPath);
  let node = root;
  for (const seg of parts) {
    if (!node.children.has(seg)) return null;
    node = node.children.get(seg);
  }
  return node;
}

// =========================
// DOM helpers
// =========================
function el(tag, cls) {
  const x = document.createElement(tag);
  if (cls) x.className = cls;
  return x;
}

function setBC(text) {
  const bc = document.getElementById("drawerBreadcrumb");
  if (bc) bc.textContent = text;
}

// =========================
// Render drawer folder
// =========================
function renderFolder(folderPath) {
  CURRENT_FOLDER = folderPath;
  const list = document.getElementById("drawerList");
  if (!list) return;

  list.textContent = "";

  const node = findNode(TREE, folderPath);
  if (!node) {
    const msg = el("div", "muted small");
    msg.textContent = "Folder not found.";
    list.appendChild(msg);
    setBC(folderPath);
    return;
  }

  setBC(folderPath);

  // Back button
  if (folderPath !== CONTENT_DIR) {
    const backRow  = el("div", "drawerItem");
    const left     = el("div", "drawerItem__left");
    const icon     = el("div", "icon");
    icon.textContent = "↩";
    const name     = el("div", "drawerItem__name");
    name.textContent = ".. (Back)";
    left.appendChild(icon); left.appendChild(name);

    const btn = el("button", "drawerItem__btn");
    btn.type = "button"; btn.textContent = "Up";
    btn.addEventListener("click", () => {
      const parts = splitPath(folderPath);
      parts.pop();
      renderFolder("/" + parts.join("/") || CONTENT_DIR);
    });

    backRow.appendChild(left); backRow.appendChild(btn);
    list.appendChild(backRow);
  }

  // Folders
  const folders = [...node.children.values()].sort((a,b) => a.name.localeCompare(b.name));
  for (const f of folders) {
    const row  = el("div", "drawerItem");
    const left = el("div", "drawerItem__left");
    const icon = el("div", "icon");
    icon.textContent = "📁";
    const name = el("div", "drawerItem__name");
    name.textContent = f.name;
    left.appendChild(icon); left.appendChild(name);

    const btn = el("button", "drawerItem__btn");
    btn.type = "button"; btn.textContent = "Open";
    btn.addEventListener("click", () => renderFolder(`${folderPath}/${f.name}`));

    row.appendChild(left); row.appendChild(btn);
    list.appendChild(row);
  }

  // Files / pages
  const items = [...node.items].sort((a,b) => a.name.localeCompare(b.name));
  for (const it of items) {
    const row  = el("div", "drawerItem");
    const left = el("div", "drawerItem__left");
    const icon = el("div", "icon");
    icon.textContent = it.kind === "page" ? "📝" : fileIcon(it.url || "");
    const name = el("div", "drawerItem__name");
    name.textContent = it.name;
    left.appendChild(icon); left.appendChild(name);

    const a = el("a", "link");
    a.href = withBase(it.url);
    a.textContent = "Open";
    a.rel = "noopener";
    a.addEventListener("click", closeDrawer);

    row.appendChild(left); row.appendChild(a);
    list.appendChild(row);
  }

  if (folders.length === 0 && items.length === 0) {
    const msg = el("div", "muted small");
    msg.textContent = "This folder is empty.";
    list.appendChild(msg);
  }
}

// =========================
// File tree (map page)
// =========================
function renderContentTree(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount || !TREE) return;

  mount.textContent = "";

  const rootNode = findNode(TREE, CONTENT_DIR);
  if (!rootNode) {
    const msg = el("div", "muted small");
    msg.textContent = "Content folder not found in index.";
    mount.appendChild(msg);
    return;
  }

  const ul = el("ul");
  mount.appendChild(ul);
  buildNodeList(rootNode, CONTENT_DIR, ul);
}

function buildNodeList(node, folderPath, parentUl) {
  const folders = [...node.children.values()].sort((a,b) => a.name.localeCompare(b.name));
  const items   = [...node.items].sort((a,b) => a.name.localeCompare(b.name));

  for (const f of folders) {
    const li      = el("li");
    const row     = el("span", "tree-row");
    const toggle  = el("button", "tree-toggle");
    toggle.type   = "button";
    toggle.textContent = "Open";
    const label   = el("span");
    label.textContent = `📁 ${f.name}`;
    row.appendChild(toggle); row.appendChild(label);
    li.appendChild(row);

    const childUl = el("ul");
    childUl.hidden = true;
    li.appendChild(childUl);

    let open = false;
    toggle.addEventListener("click", () => {
      open = !open;
      toggle.textContent = open ? "Close" : "Open";
      childUl.hidden = !open;
      if (open && childUl.childNodes.length === 0) {
        buildNodeList(f, `${folderPath}/${f.name}`, childUl);
      }
    });

    parentUl.appendChild(li);
  }

  for (const it of items) {
    const li = el("li");
    const a  = el("a", "tree-link");
    a.href   = withBase(it.url);
    a.rel    = "noopener";
    a.textContent = `${it.kind === "page" ? "📝" : fileIcon(it.url || "")} ${it.name}`;
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
// Search
// =========================
function attachSearch(allItems) {
  const input = document.getElementById("searchInput");
  const meta  = document.getElementById("searchMeta");
  const list  = document.getElementById("drawerList");
  if (!input || !meta || !list) return;

  const dirSegment = CONTENT_DIR.replace(/^\/+/, "");

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();

    if (!q) {
      meta.textContent = "";
      renderFolder(CURRENT_FOLDER);
      return;
    }

    const matches = allItems
      .filter(x => {
        const ref = (x.path || x.url || "").toLowerCase();
        return ref.includes(`${dirSegment}/`) || ref.includes(`/${dirSegment}/`);
      })
      .filter(x => {
        const title = x.type === "page" ? x.title : x.name;
        const hay   = `${title || ""} ${x.body || ""} ${x.path || ""} ${x.url || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);

    meta.textContent = matches.length === 0 ? "No results" : `${matches.length} result(s)`;
    setBC(`/search: ${q}`);
    list.textContent = "";

    for (const m of matches) {
      const row  = el("div", "drawerItem");
      const left = el("div", "drawerItem__left");
      const icon = el("div", "icon");
      icon.textContent = m.type === "page" ? "📝" : "📄";
      const name = el("div", "drawerItem__name");
      name.textContent = (m.type === "page" ? m.title : m.name) || "Untitled";
      left.appendChild(icon); left.appendChild(name);

      const a = el("a", "link");
      a.href  = withBase(m.url);
      a.textContent = "Open";
      a.rel   = "noopener";
      a.addEventListener("click", closeDrawer);

      row.appendChild(left); row.appendChild(a);
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

    // Read content_dir from index (set by _config.yml)
    if (INDEX.content_dir) {
      CONTENT_DIR    = "/" + INDEX.content_dir.replace(/^\/+|\/+$/g, "");
      CURRENT_FOLDER = CONTENT_DIR;
    }

    // Update breadcrumb placeholder
    setBC(CONTENT_DIR);

    const all = [
      ...(INDEX.pages || []).map(p => ({ type: "page", title: p.title, url: p.url, path: p.path, body: p.body })),
      ...(INDEX.files || []).map(f => ({ type: "file", name: f.name,  url: f.url,  path: f.path })),
    ];

    TREE = buildTree(all);
    attachSearch(all);
    renderFolder(CONTENT_DIR);
    renderContentTree("contentTree");
  } catch(e) {
    console.error(e);
    const list = document.getElementById("drawerList");
    if (list) list.textContent = "Failed to load index. Run jekyll build first.";
  }
})();

// =========================
// Loading screen
// =========================
(function() {
  function hide() {
    const s = document.getElementById("loadingScreen");
    if (!s) return;
    s.classList.add("is-hidden");
    s.setAttribute("aria-hidden", "true");
    setTimeout(() => s.classList.add("is-gone"), 420);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hide, { once: true });
  } else {
    hide();
  }
})();

// =========================
// aria-expanded sync for drawer button
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("drawerOpen");
  if (!btn) return;
  const obs = new MutationObserver(() => {
    btn.setAttribute("aria-expanded", drawer?.classList.contains("isOpen") ? "true" : "false");
  });
  if (drawer) obs.observe(drawer, { attributes: true, attributeFilter: ["class"] });
});

// =========================
// Media file viewer
// Detects images/video/audio in the drawer file list and renders previews
// Also renders inline media on dedicated static file pages
// =========================
const IMG_EXT   = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i;
const VIDEO_EXT = /\.(mp4|webm|ogv|mov)$/i;
const AUDIO_EXT = /\.(mp3|ogg|wav|flac|aac|m4a)$/i;

function fileIcon(url) {
  if (IMG_EXT.test(url))   return "🖼";
  if (VIDEO_EXT.test(url)) return "🎬";
  if (AUDIO_EXT.test(url)) return "🎵";
  if (/\.pdf$/i.test(url)) return "📕";
  if (/\.(zip|tar|gz|rar|7z)$/i.test(url)) return "📦";
  if (/\.(md|txt)$/i.test(url)) return "📝";
  return "📄";
}

function isMedia(url) {
  return IMG_EXT.test(url) || VIDEO_EXT.test(url) || AUDIO_EXT.test(url);
}

// Override the drawerItem creation for files to use richer icons
const _origRenderFolder = renderFolder;
// Patch: replace file icon logic inside drawerItem rendering
// (already uses fileIcon via the icon element — hook into boot instead)

function injectMediaPreview() {
  const mount = document.getElementById("page-content");
  if (!mount) return;

  // If this page is a static file served directly (no Jekyll layout),
  // the URL itself is the file path. Only applies to raw static files.
  const url = window.location.pathname;

  if (IMG_EXT.test(url)) {
    const wrap = document.createElement("div");
    wrap.className = "media-wrap";
    const img = document.createElement("img");
    img.src = url;
    img.alt = url.split("/").pop();
    img.style.maxHeight = "80vh";
    wrap.appendChild(img);
    mount.prepend(wrap);
  } else if (VIDEO_EXT.test(url)) {
    const wrap = document.createElement("div");
    wrap.className = "media-wrap";
    const vid = document.createElement("video");
    vid.src = url; vid.controls = true;
    wrap.appendChild(vid);
    mount.prepend(wrap);
  } else if (AUDIO_EXT.test(url)) {
    const wrap = document.createElement("div");
    wrap.className = "media-wrap";
    const aud = document.createElement("audio");
    aud.src = url; aud.controls = true;
    wrap.appendChild(aud);
    mount.prepend(wrap);
  }
}

// Run media detection on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectMediaPreview, { once: true });
} else {
  injectMediaPreview();
}
