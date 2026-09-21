/* MD Palette 0.1.1 */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MDPalettePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian11 = require("obsidian");

// src/workspace-adapter.ts
var import_obsidian = require("obsidian");
function groupOf(leaf) {
  const group = leaf?.parent;
  return group?.type === "tabs" && Array.isArray(group.children) ? group : void 0;
}
function activeIn(group) {
  return group?.children[group.currentTab] ?? group?.children[0];
}
function fileIn(app, leaf) {
  const path = leaf?.getViewState().state?.file;
  const file = typeof path === "string" ? app.vault.getAbstractFileByPath(path) : null;
  return file instanceof import_obsidian.TFile ? file : null;
}
function groupsIn(app) {
  const groups = /* @__PURE__ */ new Set();
  app.workspace.iterateAllLeaves((leaf) => {
    const g = groupOf(leaf);
    if (g) groups.add(g);
  });
  return [...groups];
}
function isCentral(app, group) {
  if (!group) return false;
  const root = activeIn(group)?.getRoot();
  return !!root && root !== app.workspace.leftSplit && root !== app.workspace.rightSplit;
}
function newTab(app, group) {
  return app.workspace.createLeafInParent(group, group.children.length);
}
function arrange(app, main, followers) {
  if (!followers.length) return false;
  const root = activeIn(main)?.getRoot();
  if (!root || !Array.isArray(root.children) || typeof root.setDirection !== "function") throw Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC791\uC5C5 \uACF5\uAC04 \uAD6C\uC870\uC785\uB2C8\uB2E4.");
  const branch = () => {
    let node = main;
    while (node.parent && node.parent !== root) node = node.parent;
    if (node.parent !== root) throw Error("\uBA54\uC778 \uD0ED\uC758 \uC704\uCE58\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    return node;
  };
  const ordered = () => root.direction === "vertical" && followers.every((g, i) => g.parent === root && root.children[root.children.indexOf(branch()) + i + 1] === g);
  if (ordered()) return false;
  for (const group of [main, ...followers]) {
    if (!group.parent || typeof group.parent.removeChild !== "function" || typeof group.parent.insertChild !== "function") throw Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uD0ED \uADF8\uB8F9 \uAD6C\uC870\uC785\uB2C8\uB2E4.");
  }
  if (root.direction !== "vertical") {
    const Constructor = import_obsidian.WorkspaceSplit;
    const stack = new Constructor(app.workspace, root.direction);
    if (typeof stack.insertChild !== "function") throw Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC791\uC5C5 \uACF5\uAC04 \uAD6C\uC870\uC785\uB2C8\uB2E4.");
    for (const child of [...root.children]) {
      root.removeChild(child);
      stack.insertChild(stack.children.length, child);
    }
    root.setDirection("vertical");
    root.insertChild(0, stack);
  }
  let anchor = branch();
  for (const group of followers) {
    if (group.parent === root && root.children[root.children.indexOf(anchor) + 1] === group) {
      anchor = group;
      continue;
    }
    const oldParent = group.parent;
    const oldIndex = oldParent.children.indexOf(group);
    oldParent.removeChild(group);
    if (!root.children.includes(anchor)) anchor = branch();
    try {
      root.insertChild(root.children.indexOf(anchor) + 1, group);
    } catch (error) {
      oldParent.insertChild(oldIndex, group);
      throw error;
    }
    anchor = group;
  }
  app.workspace.requestSaveLayout();
  return true;
}

// src/sidebar.ts
var import_obsidian9 = require("obsidian");

// src/card-view.ts
var import_obsidian4 = require("obsidian");

// src/cards-state.ts
var fileTypes = ["all", "md", "canvas", "pdf", "image", "video", "other"];
var displayModes = ["large", "medium", "small", "list", "details", "tiles"];
function readCards(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  const strings = (value) => Array.isArray(value) ? [...new Set(value.filter((s) => typeof s === "string"))] : [];
  const labels = [];
  if (Array.isArray(v.labels)) for (const l of v.labels) {
    if (l && typeof l.id === "string" && typeof l.name === "string" && /^#[\da-f]{6}$/i.test(l.color) && !labels.some((x) => x.id === l.id)) labels.push({ id: l.id, name: l.name, color: l.color });
  }
  const assignments = /* @__PURE__ */ Object.create(null);
  if (v.assignments && typeof v.assignments === "object") {
    for (const [path, id] of Object.entries(v.assignments)) if (labels.some((l) => l.id === id)) assignments[path] = id;
  }
  return {
    order: strings(v.order),
    labels: labels.filter((l) => Object.values(assignments).includes(l.id)),
    assignments,
    fileType: fileTypes.includes(v.fileType) ? v.fileType : "all",
    labelFilter: strings(v.labelFilter).filter((id) => Object.values(assignments).includes(id)),
    typeCollapsed: v.typeCollapsed === true,
    labelCollapsed: v.labelCollapsed === true,
    display: displayModes.includes(v.display) ? v.display : "medium",
    textSize: v.textSize === "small" || v.textSize === "large" ? v.textSize : "normal"
  };
}
function classify(extension) {
  const ext = extension.toLowerCase();
  if (["md", "canvas", "pdf"].includes(ext)) return ext;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "mkv", "ogv"].includes(ext)) return "video";
  return "other";
}
function bodyOnly(text) {
  return text.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)\s*(?:\r?\n|$)/, "");
}
function reorder(order, selected, target, after) {
  const moving = new Set(selected);
  if (target && moving.has(target)) return order;
  const block = order.filter((p) => moving.has(p)), rest = order.filter((p) => !moving.has(p));
  const index = target === null ? rest.length : rest.indexOf(target);
  if (index < 0) return order;
  rest.splice(index + (target !== null && after ? 1 : 0), 0, ...block);
  return rest;
}
function pruneLabels(state) {
  const used = new Set(Object.values(state.assignments));
  state.labels = state.labels.filter((l) => used.has(l.id));
  state.labelFilter = state.labelFilter.filter((id) => used.has(id));
}
function deleteLabel(state, id) {
  state.labels = state.labels.filter((label) => label.id !== id);
  state.labelFilter = state.labelFilter.filter((label) => label !== id);
  for (const path of Object.keys(state.assignments)) if (state.assignments[path] === id) delete state.assignments[path];
}

// src/thumbnails.ts
var import_obsidian2 = require("obsidian");
var icons = { md: "file-text", canvas: "layout-dashboard", pdf: "file-text", image: "image", video: "film", other: "file" };
var Thumbnails = class _Thumbnails {
  constructor(app, root) {
    this.app = app;
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        this.observer.unobserve(entry.target);
        const file = this.files.get(entry.target);
        if (file) this.waiting.push({ el: entry.target, file });
      }
      this.pump();
    }, { root, rootMargin: "120px" });
  }
  static cache = /* @__PURE__ */ new Map();
  observer;
  waiting = [];
  files = /* @__PURE__ */ new WeakMap();
  running = 0;
  stopped = false;
  disposers = /* @__PURE__ */ new Set();
  observe(el, file) {
    const cached = _Thumbnails.cache.get(file.path);
    if (cached?.key === `${file.stat.mtime}:${file.stat.size}`) {
      el.replaceChildren(...cached.nodes.map((n) => n.cloneNode(true)));
      el.dataset.preview = cached.kind;
      return;
    }
    this.fallback(el, file);
    this.files.set(el, file);
    this.observer.observe(el);
  }
  destroy() {
    this.stopped = true;
    this.observer.disconnect();
    this.waiting = [];
    for (const dispose of this.disposers) dispose();
    this.disposers.clear();
  }
  fallback(el, file) {
    el.empty();
    (0, import_obsidian2.setIcon)(el.createDiv({ cls: "mdp-preview-fallback" }), icons[classify(file.extension)] ?? "file");
    el.dataset.preview = "fallback";
  }
  pump() {
    while (!this.stopped && this.running < 2 && this.waiting.length) {
      const item = this.waiting.shift();
      this.running++;
      const key = `${item.file.stat.mtime}:${item.file.stat.size}`;
      void this.draw(item.el, item.file).then(() => {
        if (this.stopped || item.el.dataset.preview === "fallback" || key !== `${item.file.stat.mtime}:${item.file.stat.size}`) return;
        const copy = item.el.cloneNode(true);
        const source = item.el.querySelector("canvas"), dest = copy.querySelector("canvas");
        if (source && dest) {
          const img = document.createElement("img");
          img.src = source.toDataURL();
          img.alt = item.file.name;
          dest.replaceWith(img);
        }
        _Thumbnails.cache.delete(item.file.path);
        _Thumbnails.cache.set(item.file.path, { key, kind: item.el.dataset.preview, nodes: Array.from(copy.childNodes) });
        while (_Thumbnails.cache.size > 64) _Thumbnails.cache.delete(_Thumbnails.cache.keys().next().value);
      }).catch((error) => {
        if (!this.stopped) {
          this.fallback(item.el, item.file);
          item.el.dataset.previewError = String(error);
        }
      }).finally(() => {
        this.running--;
        this.pump();
      });
    }
  }
  async draw(el, file) {
    if (this.stopped || !el.isConnected) return;
    const type = classify(file.extension);
    if (type === "md") {
      const text = bodyOnly(await this.app.vault.cachedRead(file));
      if (this.stopped) return;
      el.empty();
      const body = el.createDiv({ cls: "mdp-preview-markdown" });
      const component = new import_obsidian2.Component();
      component.load();
      const dispose = () => component.unload();
      this.disposers.add(dispose);
      const preview = (text.slice(0, 1800) || "(\uBCF8\uBB38 \uC5C6\uC74C)").replace(/!\[\[/g, "[[").replace(/!\[([^\]]*)\]\(/g, "[$1](");
      await import_obsidian2.MarkdownRenderer.render(this.app, preview, body, file.path, component);
      if (this.stopped) {
        dispose();
        this.disposers.delete(dispose);
        return;
      }
      body.querySelectorAll("input").forEach((input) => {
        input.disabled = true;
      });
      el.dataset.preview = "md";
    } else if (type === "image") {
      el.empty();
      const img = el.createEl("img", { attr: { src: this.app.vault.getResourcePath(file), alt: file.name, draggable: "false" } });
      img.onerror = () => {
        if (!this.stopped) this.fallback(el, file);
      };
      el.dataset.preview = "image";
    } else if (type === "canvas") {
      const data = JSON.parse(await this.app.vault.cachedRead(file));
      if (this.stopped) return;
      const nodes = (Array.isArray(data.nodes) ? data.nodes : []).filter((n) => [n.x, n.y, n.width, n.height].every(Number.isFinite) && n.width > 0 && n.height > 0).slice(0, 500);
      if (!nodes.length) return;
      const minX = Math.min(...nodes.map((n) => n.x)), minY = Math.min(...nodes.map((n) => n.y));
      const width = Math.max(...nodes.map((n) => n.x + n.width)) - minX, height = Math.max(...nodes.map((n) => n.y + n.height)) - minY;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `${minX - 20} ${minY - 20} ${width + 40} ${height + 40}`);
      for (const edge of (Array.isArray(data.edges) ? data.edges : []).slice(0, 1e3)) {
        const a = nodes.find((n) => n.id === edge.fromNode), b = nodes.find((n) => n.id === edge.toNode);
        if (!a || !b) continue;
        const line = document.createElementNS(svg.namespaceURI, "line");
        for (const [k, v] of Object.entries({ x1: a.x + a.width / 2, y1: a.y + a.height / 2, x2: b.x + b.width / 2, y2: b.y + b.height / 2, stroke: "var(--text-muted)", "stroke-width": 3 })) line.setAttribute(k, String(v));
        svg.append(line);
      }
      for (const n of nodes) {
        const rect = document.createElementNS(svg.namespaceURI, "rect");
        for (const [k, v] of Object.entries({ x: n.x, y: n.y, width: n.width, height: n.height, rx: 8, fill: "var(--background-secondary)", stroke: "var(--interactive-accent)", "stroke-width": 3 })) rect.setAttribute(k, String(v));
        svg.append(rect);
        const text = document.createElementNS(svg.namespaceURI, "text");
        text.setAttribute("x", String(n.x + 10));
        text.setAttribute("y", String(n.y + 30));
        text.setAttribute("fill", "var(--text-normal)");
        text.setAttribute("font-size", "22");
        text.textContent = String(n.text ?? n.file ?? n.url ?? n.label ?? "").slice(0, Math.max(5, n.width / 13));
        svg.append(text);
      }
      el.empty();
      el.append(svg);
      el.dataset.preview = "canvas";
    } else if (type === "pdf") {
      const lib = await (0, import_obsidian2.loadPdfJs)();
      if (this.stopped) return;
      const task = lib.getDocument({ data: new Uint8Array(await this.app.vault.readBinary(file)), isEvalSupported: false });
      const dispose = () => {
        void task.destroy().catch(() => {
        });
      };
      this.disposers.add(dispose);
      try {
        const pdf = await task.promise;
        if (this.stopped) return;
        const page = await pdf.getPage(1), original = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(1, 380 / original.width) });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        if (!this.stopped) {
          el.empty();
          el.append(canvas);
          el.dataset.preview = "pdf";
        }
      } finally {
        this.disposers.delete(dispose);
        dispose();
      }
    } else if (type === "video") {
      await new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "auto";
        video.muted = true;
        const cleanup = () => {
          clearTimeout(timer);
          video.onloadeddata = video.onerror = null;
          video.removeAttribute("src");
          video.load();
          this.disposers.delete(cancel);
        };
        const cancel = () => {
          cleanup();
          resolve();
        };
        const timer = window.setTimeout(() => {
          cleanup();
          reject(Error("Video preview timeout"));
        }, 8e3);
        this.disposers.add(cancel);
        video.onerror = () => {
          cleanup();
          reject(Error("Unsupported video"));
        };
        video.onloadeddata = () => {
          if (!this.stopped && video.videoWidth) {
            const canvas = document.createElement("canvas");
            canvas.width = 380;
            canvas.height = 380 * video.videoHeight / video.videoWidth;
            canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
            el.empty();
            el.append(canvas);
            el.createSpan({ cls: "mdp-video-badge", text: "\u25B6" });
            el.dataset.preview = "video";
          }
          cleanup();
          resolve();
        };
        video.src = this.app.vault.getResourcePath(file);
      });
    }
  }
};

// src/card-reorder.ts
function findCardDrop(cards, point, bounds, columns) {
  if (point.x < bounds.left || point.x > bounds.right || point.y < bounds.top || point.y > bounds.bottom) return null;
  let nearest, distance = Infinity;
  for (const card of cards) {
    if (card.bottom < bounds.top || card.top > bounds.bottom) continue;
    const dx = point.x - (card.left + card.right) / 2, dy = point.y - (card.top + card.bottom) / 2;
    const next = dx * dx + dy * dy;
    if (next < distance) {
      distance = next;
      nearest = card;
    }
  }
  return nearest ? { card: nearest, after: columns ? point.x > (nearest.left + nearest.right) / 2 : point.y > (nearest.top + nearest.bottom) / 2 } : null;
}
var CardReorder = class {
  constructor(grid, commit) {
    this.grid = grid;
    this.commit = commit;
    this.win = grid.ownerDocument.defaultView;
    this.overlay = grid.ownerDocument.createElement("div");
    this.overlay.className = "mdp-drop-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    const options = { signal: this.controller.signal };
    grid.addEventListener("dragover", (event) => {
      if (!this.paths.size) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      this.point = { x: event.clientX, y: event.clientY };
      this.schedule();
    }, options);
    grid.addEventListener("dragleave", (event) => {
      if (!(event.relatedTarget instanceof Node) || !grid.contains(event.relatedTarget)) {
        this.point = null;
        this.hide();
      }
    }, options);
    grid.addEventListener("drop", (event) => {
      if (!this.paths.size) return;
      event.preventDefault();
      event.stopPropagation();
      this.point = { x: event.clientX, y: event.clientY };
      this.draw();
      const target = this.target, paths = [...this.paths];
      this.clear();
      if (target) this.commit(paths, target.card.path, target.after);
    }, options);
    grid.addEventListener("dragend", () => this.clear(), options);
    grid.addEventListener("scroll", () => {
      this.cards = null;
      if (this.point) this.schedule();
    }, { ...options, passive: true });
    this.win.addEventListener("resize", () => this.clear(), options);
    this.win.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.clear();
    }, { ...options, capture: true });
  }
  overlay;
  controller = new AbortController();
  cards = null;
  point = null;
  target = null;
  frame = 0;
  paths = /* @__PURE__ */ new Set();
  columns = false;
  win;
  start(paths) {
    this.clear();
    this.paths = new Set(paths);
    for (const el of Array.from(this.grid.querySelectorAll(".mdp-card"))) if (this.paths.has(el.dataset.path)) el.classList.add("is-dragging");
    this.columns = this.win.getComputedStyle(this.grid).gridTemplateColumns.split(" ").filter(Boolean).length > 1;
  }
  destroy() {
    this.clear();
    this.controller.abort();
  }
  schedule() {
    if (!this.frame) this.frame = this.win.requestAnimationFrame(() => {
      this.frame = 0;
      this.draw();
    });
  }
  draw() {
    if (!this.point || !this.paths.size) return;
    if (!this.cards) this.cards = Array.from(this.grid.querySelectorAll(".mdp-card")).flatMap((el) => {
      if (!el.dataset.path || this.paths.has(el.dataset.path)) return [];
      const r = el.getBoundingClientRect();
      return [{ path: el.dataset.path, left: r.left, right: r.right, top: r.top, bottom: r.bottom }];
    });
    const rect = this.grid.getBoundingClientRect();
    this.target = findCardDrop(this.cards, this.point, { path: "", left: rect.left, right: rect.left + this.grid.clientWidth, top: rect.top, bottom: rect.bottom }, this.columns);
    if (!this.target) {
      this.hide();
      return;
    }
    const { card, after } = this.target;
    const x = this.columns ? Math.max(rect.left + 2, Math.min(rect.right - 6, after ? card.right + 2 : card.left - 6)) : card.left;
    const y = this.columns ? Math.max(rect.top + 2, card.top) : Math.max(rect.top + 2, Math.min(rect.bottom - 6, after ? card.bottom + 2 : card.top - 6));
    const width = this.columns ? 4 : card.right - card.left;
    const height = this.columns ? Math.max(0, Math.min(rect.bottom - 2, card.bottom) - y) : 4;
    Object.assign(this.overlay.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
    this.overlay.dataset.target = card.path;
    this.overlay.dataset.side = after ? "after" : "before";
    this.overlay.dataset.axis = this.columns ? "vertical" : "horizontal";
    if (!this.overlay.isConnected) this.grid.ownerDocument.body.append(this.overlay);
  }
  hide() {
    this.overlay.remove();
    this.target = null;
  }
  clear() {
    if (this.frame) this.win.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.point = null;
    this.cards = null;
    this.paths.clear();
    this.hide();
    for (const el of Array.from(this.grid.querySelectorAll(".is-dragging"))) el.classList.remove("is-dragging");
  }
};

// src/new-linked-note.ts
var import_obsidian3 = require("obsidian");
var NewLinkedNoteModal = class extends import_obsidian3.Modal {
  constructor(plugin, main, folder) {
    super(plugin.app);
    this.plugin = plugin;
    this.main = main;
    this.folder = folder;
  }
  onOpen() {
    this.titleEl.setText("\uC0C8 \uB9C1\uD06C \uD30C\uC77C \uCD94\uAC00");
    this.contentEl.addClass("mdp-new-note");
    this.contentEl.createEl("p", { text: "\uBE48 Markdown \uD30C\uC77C\uC744 \uB9CC\uB4E4\uACE0 \uD604\uC7AC Main\uC5D0 \uC5F0\uACB0\uD569\uB2C8\uB2E4." });
    this.contentEl.createDiv({ text: `Main: ${this.main.path}`, cls: "mdp-muted" });
    const label = this.contentEl.createEl("label", { text: "\uD30C\uC77C \uC774\uB984" });
    const input = label.createEl("input", { type: "text", attr: { "aria-label": "\uC0C8 \uB9C1\uD06C \uD30C\uC77C \uC774\uB984", placeholder: "\uC0C8 \uB178\uD2B8", maxlength: "183" } });
    const path = this.contentEl.createDiv({ cls: "mdp-new-note-path mdp-muted" });
    this.contentEl.createDiv({ text: "Obsidian\uC758 \uC0C8 \uB178\uD2B8 \uC800\uC7A5 \uC704\uCE58 \uC124\uC815\uC744 \uB530\uB985\uB2C8\uB2E4.", cls: "mdp-muted" });
    const error = this.contentEl.createDiv({ cls: "mdp-new-note-error", attr: { role: "alert" } });
    const actions = this.contentEl.createDiv({ cls: "mdp-modal-actions" });
    const cancel = actions.createEl("button", { text: "\uCDE8\uC18C" });
    const submit = actions.createEl("button", { text: "\uB9CC\uB4E4\uACE0 \uC5F0\uACB0", cls: "mod-cta" });
    let pending = false;
    const preview = () => {
      error.setText("");
      try {
        path.setText(`\uC800\uC7A5 \uC704\uCE58: ${this.plugin.newLinkedNotePath(this.main, input.value || "\uC0C8 \uB178\uD2B8")}`);
      } catch (e) {
        path.setText("");
        error.setText(e instanceof Error ? e.message : String(e));
      }
    };
    input.oninput = preview;
    cancel.onclick = () => this.close();
    const apply = async () => {
      if (pending) return;
      pending = true;
      input.disabled = submit.disabled = cancel.disabled = true;
      error.setText("");
      try {
        await this.plugin.createLinkedNote(this.main, input.value, this.folder);
        this.close();
      } catch (e) {
        error.setText(e instanceof Error ? e.message : String(e));
      } finally {
        pending = false;
        input.disabled = submit.disabled = cancel.disabled = false;
        input.focus();
      }
    };
    submit.onclick = () => {
      void apply();
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter" && !e.isComposing) {
        e.preventDefault();
        void apply();
      }
    };
    preview();
    input.focus();
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/card-view.ts
var typeNames = ["\uC804\uCCB4", "MD", "Canvas", "PDF", "\uC774\uBBF8\uC9C0", "\uC601\uC0C1", "\uAE30\uD0C0"];
var modeNames = ["\uD070 \uC544\uC774\uCF58", "\uC911\uAC04 \uC544\uC774\uCF58", "\uC791\uC740 \uC544\uC774\uCF58", "\uBAA9\uB85D", "\uC790\uC138\uD788", "\uD0C0\uC77C"];
var ConnectionPicker = class extends import_obsidian4.FuzzySuggestModal {
  constructor(plugin, main) {
    super(plugin.app);
    this.plugin = plugin;
    this.main = main;
    this.setPlaceholder("\uC5F0\uACB0\uD560 \uAE30\uC874 Vault \uD30C\uC77C \uC120\uD0DD");
  }
  getItems() {
    return this.app.vault.getFiles().filter((f) => f !== this.main);
  }
  getItemText(file) {
    return file.path;
  }
  onChooseItem(file) {
    this.plugin.run(() => this.plugin.addConnection(this.main, file));
  }
};
var LabelEditor = class extends import_obsidian4.Modal {
  constructor(plugin, paths) {
    super(plugin.app);
    this.plugin = plugin;
    this.paths = paths;
  }
  chosen;
  onOpen() {
    this.chosen = this.paths ? void 0 : this.plugin.cards.labels[0];
    this.draw();
  }
  draw() {
    this.contentEl.empty();
    this.titleEl.setText(this.paths ? "\uC0C8 Label \uB9CC\uB4E4\uAE30" : "\uB77C\uBCA8 \uAD00\uB9AC");
    if (!this.paths && !this.chosen) {
      this.contentEl.createEl("p", { text: "\uC0AC\uC6A9 \uC911\uC778 \uB77C\uBCA8\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." });
      return;
    }
    const layout = this.contentEl.createDiv({ cls: "mdp-label-editor" });
    const members = /* @__PURE__ */ new Map();
    for (const [path, id] of Object.entries(this.plugin.cards.assignments)) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian4.TFile) {
        const files = members.get(id) ?? [];
        files.push(file);
        members.set(id, files);
      }
    }
    if (!this.paths) {
      const list = layout.createDiv({ cls: "mdp-label-list" });
      for (const label of this.plugin.cards.labels) {
        const b = list.createEl("button", { text: `${label.name} (${members.get(label.id)?.length ?? 0})`, cls: this.chosen?.id === label.id ? "is-selected" : "" });
        b.style.borderLeft = `6px solid ${label.color}`;
        b.onclick = () => {
          this.chosen = label;
          this.draw();
        };
      }
    }
    const form = layout.createDiv({ cls: "mdp-label-form" });
    const nameLabel = form.createEl("label", { text: "\uC774\uB984" });
    const name = nameLabel.createEl("input", { type: "text", value: this.chosen?.name ?? "", attr: { "aria-label": "\uB77C\uBCA8 \uC774\uB984", maxlength: "80" } });
    const colorLabel = form.createEl("label", { text: "\uC0C9\uC0C1" });
    const color = colorLabel.createEl("input", { type: "color", value: this.chosen?.color ?? this.accent(), attr: { "aria-label": "\uB77C\uBCA8 \uC0C9\uC0C1" } });
    if (!this.paths && this.chosen) {
      const files = members.get(this.chosen.id) ?? [];
      form.createDiv({ text: `\uC0AC\uC6A9 \uD30C\uC77C ${files.length}\uAC1C \xB7 \uC804\uCCB4 Vault`, cls: "mdp-label-members-title" });
      const list = form.createDiv({ cls: "mdp-label-members" });
      for (const file of files.sort((a, b) => a.path.localeCompare(b.path))) {
        const row = list.createDiv({ cls: "mdp-label-member", attr: { title: file.path } });
        row.createDiv({ text: file.name });
        row.createDiv({ text: file.parent?.path || "/", cls: "mdp-muted" });
        this.plugin.bindFilePreview(row, file);
      }
    }
    const actions = form.createDiv({ cls: "mdp-modal-actions" });
    if (!this.paths && this.chosen) {
      actions.createEl("button", { text: "\uB77C\uBCA8 \uC0AD\uC81C", cls: "mod-warning mdp-delete-label" }).onclick = () => {
        if (form.querySelector(".mdp-label-delete-confirm")) return;
        const confirmation = form.createDiv({ cls: "mdp-label-delete-confirm" });
        confirmation.createEl("p", { text: `\u2018${this.chosen.name}\u2019 \uB77C\uBCA8\uACFC \uD30C\uC77C\uC5D0 \uBD99\uC740 \uD45C\uC2DC\uB97C \uC0AD\uC81C\uD569\uB2C8\uB2E4. \uD30C\uC77C\uC740 \uADF8\uB300\uB85C \uB0A8\uC2B5\uB2C8\uB2E4.` });
        confirmation.createEl("button", { text: "\uCDE8\uC18C" }).onclick = () => confirmation.remove();
        confirmation.createEl("button", { text: "\uB77C\uBCA8\uB9CC \uC0AD\uC81C", cls: "mod-warning" }).onclick = () => {
          deleteLabel(this.plugin.cards, this.chosen.id);
          this.plugin.cardsChanged();
          this.chosen = this.plugin.cards.labels[0];
          this.draw();
        };
      };
    }
    actions.createEl("button", { text: "\uCDE8\uC18C" }).onclick = () => this.close();
    const apply = actions.createEl("button", { text: this.paths ? "\uB9CC\uB4E4\uAE30" : "\uC801\uC6A9", cls: "mod-cta" });
    apply.onclick = () => {
      const title = name.value.trim();
      if (!title) {
        new import_obsidian4.Notice("\uB77C\uBCA8 \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
        name.focus();
        return;
      }
      const cards = this.plugin.cards;
      if (cards.labels.some((l) => l.name === title && l.id !== this.chosen?.id)) {
        new import_obsidian4.Notice("\uAC19\uC740 \uC774\uB984\uC758 \uB77C\uBCA8\uC774 \uC788\uC2B5\uB2C8\uB2E4.");
        return;
      }
      if (this.paths) {
        const paths = this.paths.filter((p) => this.app.vault.getAbstractFileByPath(p) instanceof import_obsidian4.TFile);
        if (!paths.length) {
          this.close();
          return;
        }
        const label = { id: crypto.randomUUID(), name: title, color: color.value };
        cards.labels.push(label);
        for (const path of paths) cards.assignments[path] = label.id;
      } else if (this.chosen && cards.labels.includes(this.chosen)) {
        this.chosen.name = title;
        this.chosen.color = color.value;
      }
      pruneLabels(cards);
      this.plugin.cardsChanged();
      this.close();
    };
    if (this.paths) name.focus();
  }
  accent() {
    const probe = this.contentEl.createSpan();
    probe.style.color = "var(--interactive-accent)";
    const rgb = getComputedStyle(probe).color.match(/\d+/g);
    probe.remove();
    return rgb && rgb.length >= 3 ? "#" + rgb.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("") : "#808080";
  }
  onClose() {
    this.contentEl.empty();
  }
};
var CardView = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  thumbnails;
  selected = /* @__PURE__ */ new Set();
  anchor;
  active;
  mainPath;
  reorderDrag;
  root;
  visible = [];
  scrollTop = 0;
  restoreFrame;
  destroy() {
    if (this.restoreFrame !== void 0) cancelAnimationFrame(this.restoreFrame);
    this.thumbnails?.destroy();
    this.thumbnails = void 0;
    this.reorderDrag?.destroy();
    this.reorderDrag = void 0;
  }
  render(root) {
    this.destroy();
    this.root = root;
    const main = this.plugin.mainFile;
    if (!main) return;
    const parent = root.parentNode, nextSibling = root.nextSibling;
    root.remove();
    if (main.path !== this.mainPath) {
      this.selected.clear();
      this.anchor = this.active = void 0;
      this.mainPath = main.path;
      this.scrollTop = 0;
    }
    const state = this.plugin.cards;
    root.className = "mdp-card-view";
    const actions = root.createDiv({ cls: "mdp-connection-actions" });
    const add = actions.createEl("button", { cls: "mdp-add-connection", text: "+ \uC5F0\uACB0 \uD30C\uC77C \uCD94\uAC00" });
    add.onclick = () => {
      const file = this.plugin.mainFile;
      if (!file) {
        new import_obsidian4.Notice("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB97C \uBA3C\uC800 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.");
        return;
      }
      new ConnectionPicker(this.plugin, file).open();
    };
    actions.createEl("button", { cls: "mdp-new-linked-note", text: "+ \uC0C8 \uB9C1\uD06C \uD30C\uC77C \uCD94\uAC00" }).onclick = () => {
      const file = this.plugin.mainFile;
      if (file) new NewLinkedNoteModal(this.plugin, file).open();
    };
    const typeSection = this.section(root, "\uD30C\uC77C \uC720\uD615 \uD544\uD130", state.typeCollapsed, () => {
      state.typeCollapsed = !state.typeCollapsed;
      this.plugin.cardsChanged();
    });
    if (!state.typeCollapsed) for (let i = 0; i < fileTypes.length; i++) this.chip(typeSection, typeNames[i], state.fileType === fileTypes[i], () => {
      state.fileType = fileTypes[i];
      this.plugin.cardsChanged();
    });
    const labelSection = this.section(root, "Label \uD544\uD130", state.labelCollapsed, () => {
      state.labelCollapsed = !state.labelCollapsed;
      this.plugin.cardsChanged();
    });
    if (!state.labelCollapsed) {
      this.chip(labelSection, "All", !state.labelFilter.length, () => {
        state.labelFilter = [];
        this.plugin.cardsChanged();
      });
      for (const label of state.labels) this.chip(labelSection, label.name, state.labelFilter.includes(label.id), () => {
        state.labelFilter = state.labelFilter.includes(label.id) ? state.labelFilter.filter((id) => id !== label.id) : [...state.labelFilter, label.id];
        this.plugin.cardsChanged();
      });
      this.chip(labelSection, "\uB77C\uBCA8 \uAD00\uB9AC\u2026", false, () => new LabelEditor(this.plugin).open());
    }
    const controls = root.createDiv({ cls: "mdp-card-controls" });
    this.select(controls, "\uBCF4\uAE30 \uD615\uC2DD", [...displayModes], modeNames, state.display, (value) => {
      state.display = value;
      this.plugin.cardsChanged();
    });
    this.select(controls, "\uD14D\uC2A4\uD2B8 \uD06C\uAE30", ["small", "normal", "large"], ["\uC791\uAC8C", "\uBCF4\uD1B5", "\uD06C\uAC8C"], state.textSize, (value) => {
      state.textSize = value;
      this.plugin.cardsChanged();
    });
    const connected = this.plugin.connectedFiles();
    this.visible = connected.filter((f) => (state.fileType === "all" || classify(f.extension) === state.fileType) && (!state.labelFilter.length || state.labelFilter.includes(state.assignments[f.path])));
    const visiblePaths = new Set(this.visible.map((f) => f.path));
    this.selected = new Set([...this.selected].filter((p) => visiblePaths.has(p)));
    if (this.active && !visiblePaths.has(this.active)) this.active = void 0;
    root.createDiv({ cls: "mdp-card-count mdp-muted", text: `${this.visible.length}\uAC1C \uD30C\uC77C` });
    const grid = root.createDiv({ cls: `mdp-card-grid mdp-display-${state.display} mdp-text-${state.textSize}`, attr: { role: "listbox", "aria-label": "\uC5F0\uACB0 \uD30C\uC77C \uCE74\uB4DC", "aria-multiselectable": "true" } });
    grid.addEventListener("scroll", () => {
      this.scrollTop = grid.scrollTop;
    }, { passive: true });
    if (!this.visible.length) grid.createDiv({ cls: "mdp-muted mdp-no-cards", text: connected.length ? "\uD544\uD130\uC5D0 \uB9DE\uB294 \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." : "\uC5F0\uACB0\uB41C \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC704 \uBC84\uD2BC\uC73C\uB85C \uAE30\uC874 \uD30C\uC77C\uC744 \uC5F0\uACB0\uD558\uC138\uC694." });
    this.thumbnails = new Thumbnails(this.plugin.app, grid);
    this.reorderDrag = new CardReorder(grid, (paths, target, after) => {
      const next = reorder(state.order, paths, target, after);
      if (next.every((p, i) => p === state.order[i])) return;
      const elements = Array.from(grid.querySelectorAll(".mdp-card"));
      const anchor = elements.find((el) => el.dataset.path === target);
      if (!anchor) return;
      const moved = new Set(paths), fragment = grid.ownerDocument.createDocumentFragment();
      for (const el of elements) if (moved.has(el.dataset.path)) fragment.append(el);
      grid.insertBefore(fragment, after ? anchor.nextSibling : anchor);
      state.order = next;
      const rank = new Map(next.map((path, index) => [path, index]));
      this.visible.sort((a, b) => rank.get(a.path) - rank.get(b.path));
      this.plugin.saveCardOrder();
    });
    grid.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const index = displayModes.indexOf(state.display), next = Math.max(0, Math.min(displayModes.length - 1, index + (e.deltaY > 0 ? 1 : -1)));
      if (next !== index) {
        state.display = displayModes[next];
        this.plugin.cardsChanged();
      }
    }, { passive: false });
    for (const file of this.visible) {
      const card = grid.createDiv({ cls: "mdp-card", attr: { "data-path": file.path, role: "option", tabindex: "0", draggable: "true", title: file.path } });
      card.classList.add("mdp-file-card");
      this.plugin.bindFilePreview(card, file);
      card.createDiv({ cls: "mdp-card-name mdp-file-title", text: file.name });
      const preview = card.createDiv({ cls: "mdp-preview", attr: { "aria-hidden": "true" } });
      if (state.display !== "list" && state.display !== "details") this.thumbnails.observe(preview, file);
      else (0, import_obsidian4.setIcon)(preview, classify(file.extension) === "image" ? "image" : "file-text");
      const info = card.createDiv({ cls: "mdp-card-info" });
      const label = state.labels.find((l) => l.id === state.assignments[file.path]);
      if (label) {
        const badge = info.createSpan({ cls: "mdp-label-badge", text: label.name });
        badge.style.setProperty("--mdp-label-color", label.color);
      }
      if (state.display === "details" || state.display === "tiles") {
        info.createDiv({ cls: "mdp-card-detail", text: `${file.parent?.path || "/"} \xB7 ${file.extension.toUpperCase()}` });
        info.createDiv({ cls: "mdp-card-detail", text: `${new Date(file.stat.mtime).toLocaleDateString()} \xB7 ${Math.ceil(file.stat.size / 1024)} KB` });
      }
      const more = card.createEl("button", { cls: "mdp-card-more", attr: { "aria-label": `${file.name} \uBA54\uB274` } });
      (0, import_obsidian4.setIcon)(more, "more-vertical");
      more.onclick = (e) => {
        e.stopPropagation();
        this.context(e, file);
      };
      card.onclick = (e) => {
        this.selection(e, file);
      };
      card.ondblclick = (e) => {
        if (e.target.closest("button")) return;
        this.selected = /* @__PURE__ */ new Set([file.path]);
        this.active = this.anchor = file.path;
        this.paint();
        this.plugin.openFileGesture(file, e);
      };
      card.oncontextmenu = (e) => {
        e.preventDefault();
        this.context(e, file);
      };
      card.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.selected = /* @__PURE__ */ new Set([file.path]);
          this.active = file.path;
          this.paint();
          this.open(file);
        }
        if (e.key === " ") {
          e.preventDefault();
          this.selection(e, file);
        }
      };
      card.ondragstart = (e) => {
        if (!this.selected.has(file.path)) {
          this.selected = /* @__PURE__ */ new Set([file.path]);
          this.active = this.anchor = file.path;
          this.paint();
        }
        const paths = this.visible.map((f) => f.path).filter((p) => this.selected.has(p));
        e.dataTransfer?.setData("application/x-md-palette-reorder", this.mainPath);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        if (paths.length === 1) this.plugin.reuseDrag.startFile(e, file);
        this.reorderDrag?.start(paths);
      };
    }
    this.paint();
    parent?.insertBefore(root, nextSibling);
    const savedScroll = this.scrollTop;
    if (savedScroll) this.restoreFrame = requestAnimationFrame(() => {
      grid.scrollTop = savedScroll;
      this.restoreFrame = void 0;
    });
  }
  selection(e, file) {
    if (e.shiftKey && this.anchor && this.visible.some((f) => f.path === this.anchor)) {
      const a = this.visible.findIndex((f) => f.path === this.anchor), b = this.visible.indexOf(file);
      if (!e.ctrlKey && !e.metaKey) this.selected.clear();
      for (const item of this.visible.slice(Math.min(a, b), Math.max(a, b) + 1)) this.selected.add(item.path);
    } else if (e.ctrlKey || e.metaKey) {
      this.selected.has(file.path) ? this.selected.delete(file.path) : this.selected.add(file.path);
      this.anchor = file.path;
    } else {
      this.selected = /* @__PURE__ */ new Set([file.path]);
      this.anchor = file.path;
    }
    this.active = file.path;
    this.paint();
  }
  paint() {
    this.root?.querySelectorAll(".mdp-card").forEach((el) => {
      const selected = this.selected.has(el.dataset.path);
      el.classList.toggle("is-selected", selected);
      el.classList.toggle("is-active", el.dataset.path === this.active);
      el.setAttribute("aria-selected", String(selected));
    });
  }
  open(file) {
    this.plugin.run(() => this.plugin.openIn("sub", file));
  }
  context(event, file) {
    if (!this.selected.has(file.path)) {
      this.selected = /* @__PURE__ */ new Set([file.path]);
      this.active = this.anchor = file.path;
      this.paint();
    }
    const paths = [...this.selected], multi = paths.length > 1, state = this.plugin.cards;
    const menu = new import_obsidian4.Menu();
    if (!multi) {
      menu.addItem((item) => item.setTitle("Sub Space\uC5D0\uC11C \uC5F4\uAE30").setIcon("link").onClick(() => this.open(file)));
    }
    menu.addItem((item) => {
      item.setTitle(multi ? "Label \uC77C\uAD04 \uC801\uC6A9" : "Label \uC9C0\uC815/\uAD50\uCCB4").setIcon("tag").setDisabled(!state.labels.length);
      const sub = item.setSubmenu();
      for (const label of state.labels) sub.addItem((i) => i.setTitle(label.name).setChecked(paths.every((p) => state.assignments[p] === label.id)).onClick(() => {
        for (const p of paths) state.assignments[p] = label.id;
        pruneLabels(state);
        this.plugin.cardsChanged();
      }));
    });
    menu.addItem((item) => item.setTitle(multi ? "Label \uC77C\uAD04 \uC81C\uAC70" : "\uD604\uC7AC Label \uC81C\uAC70").setIcon("tag").setDisabled(!paths.some((p) => state.assignments[p])).onClick(() => {
      for (const p of paths) delete state.assignments[p];
      pruneLabels(state);
      this.plugin.cardsChanged();
    }));
    menu.addItem((item) => item.setTitle("\uC0C8 Label \uB9CC\uB4E4\uAE30").setIcon("plus").onClick(() => new LabelEditor(this.plugin, paths).open()));
    menu.addItem((item) => item.setTitle("Label \uAD00\uB9AC\u2026").setIcon("settings").onClick(() => new LabelEditor(this.plugin).open()));
    menu.showAtMouseEvent(event);
  }
  section(root, title, collapsed, toggle) {
    const section = root.createDiv({ cls: "mdp-filter-section" });
    const button = section.createEl("button", { text: `${title} ${collapsed ? "\u25B8" : "\u25BE"}`, cls: "mdp-filter-toggle", attr: { "aria-expanded": String(!collapsed) } });
    button.onclick = toggle;
    return section.createDiv({ cls: "mdp-filter-chips" });
  }
  chip(root, title, selected, action) {
    const b = root.createEl("button", { text: title, cls: selected ? "mdp-chip is-selected" : "mdp-chip", attr: { "aria-pressed": String(selected) } });
    b.onclick = action;
  }
  select(root, title, values, names, value, action) {
    const label = root.createEl("label", { text: title });
    const select = label.createEl("select", { attr: { "aria-label": title } });
    values.forEach((v, i) => select.createEl("option", { value: v, text: names[i] }));
    select.value = value;
    select.onchange = () => action(select.value);
  }
};

// src/connections-view.ts
var import_obsidian6 = require("obsidian");

// src/native-local-graph.ts
var import_obsidian5 = require("obsidian");
var NativeLocalGraph = class {
  constructor(plugin, leaf) {
    this.plugin = plugin;
    this.leaf = leaf;
  }
  view;
  observer;
  opening;
  mount(host, main) {
    host.addClass("mdp-native-graph");
    const registry = this.plugin.app.viewRegistry;
    const factory = registry?.viewByType?.localgraph;
    if (!factory) {
      this.destroy();
      host.createDiv({ cls: "mdp-muted", text: "Obsidian \uC124\uC815 \u2192 \uCF54\uC5B4 \uD50C\uB7EC\uADF8\uC778\uC5D0\uC11C \uADF8\uB798\uD504 \uBCF4\uAE30\uB97C \uCF1C\uC8FC\uC138\uC694." });
      return;
    }
    if (!this.view) {
      const view = factory(this.leaf);
      if (!view.engine?.getOptions || !view.engine?.setOptions || !view.renderer || !view.update || !view.open || !view.close) {
        void view.close?.();
        host.createDiv({ cls: "mdp-muted", text: "\uC774 Obsidian \uBC84\uC804\uC758 \uAE30\uBCF8 \uB85C\uCEEC \uADF8\uB798\uD504\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
        return;
      }
      this.view = view;
      view.containerEl.addClass("mdp-native-graph-view");
      view.onFileOpen = () => {
      };
      view.onOptionsChange = () => {
        if (this.view !== view) return;
        this.plugin.connections.graphOptions = structuredClone(view.engine.getOptions());
        this.plugin.saveConnections();
      };
      const nativeClick = view.renderer.onNodeClick;
      const nativeRightClick = view.renderer.onNodeRightClick;
      view.renderer.onNodeClick = (event, path, type) => {
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (file instanceof import_obsidian5.TFile) this.plugin.run(() => this.plugin.openIn("sub", file));
        else if (type === "tag") nativeClick.call(view.renderer, event, path, type);
      };
      view.renderer.onNodeRightClick = (event, path, type) => {
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof import_obsidian5.TFile)) {
          if (type === "tag") nativeRightClick.call(view.renderer, event, path, type);
          return;
        }
        const menu = new import_obsidian5.Menu();
        menu.addItem((item) => item.setTitle("Sub Space\uC5D0\uC11C \uC5F4\uAE30").setIcon("link").onClick(() => this.plugin.run(() => this.plugin.openIn("sub", file))));
        menu.showAtMouseEvent(event);
      };
      view.file = main;
      this.opening = view.open(host).then(() => {
        if (this.view !== view) return;
        view.engine.setOptions(this.plugin.connections.graphOptions ?? { close: true });
        view.update();
        view.onResize();
      }).catch((error) => {
        console.error("MD Palette native Local Graph:", error);
        if (this.view === view) {
          this.destroy();
          host.createDiv({ cls: "mdp-muted", text: "\uAE30\uBCF8 \uB85C\uCEEC \uADF8\uB798\uD504\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." });
        }
      });
    } else {
      host.append(this.view.containerEl);
      if (this.view.file !== main) {
        this.view.file = main;
        this.view.update();
      }
      this.view.onResize();
    }
    this.observer?.disconnect();
    this.observer = new ResizeObserver(() => this.view?.onResize());
    this.observer.observe(host);
  }
  detach() {
    this.observer?.disconnect();
    this.view?.containerEl.remove();
  }
  destroy() {
    this.observer?.disconnect();
    this.observer = void 0;
    const view = this.view;
    this.view = void 0;
    if (view) void view.close().catch((error) => console.error("MD Palette graph cleanup:", error));
    this.opening = void 0;
  }
};

// src/connections-state.ts
var sectionKeys = ["backlinks", "outgoing", "graph"];
function readConnections(value) {
  const state = { heights: { backlinks: 25, outgoing: 25, graph: 50 }, collapsed: { backlinks: false, outgoing: false, graph: false } };
  if (!value || typeof value !== "object") return state;
  const raw = value;
  if (raw.graphOptions && typeof raw.graphOptions === "object" && !Array.isArray(raw.graphOptions)) state.graphOptions = structuredClone(raw.graphOptions);
  for (const key of sectionKeys) {
    const n = raw.heights?.[key];
    if (typeof n === "number" && Number.isFinite(n) && n > 0) state.heights[key] = Math.max(1, Math.min(1e3, n));
    state.collapsed[key] = raw.collapsed?.[key] === true;
  }
  return state;
}
function relations(links, main, markdownPaths) {
  const outgoing = Object.keys(links[main] ?? {}).filter((p) => p !== main && markdownPaths.has(p) && links[main][p] > 0);
  const backlinks = Object.keys(links).filter((p) => p !== main && markdownPaths.has(p) && links[p][main] > 0);
  return { backlinks: backlinks.sort((a, b) => a.localeCompare(b)), outgoing: outgoing.sort((a, b) => a.localeCompare(b)) };
}

// src/connections-view.ts
var ConnectionsView = class {
  constructor(plugin, leaf) {
    this.plugin = plugin;
    this.nativeGraph = new NativeLocalGraph(plugin, leaf);
    plugin.register(() => this.destroy());
  }
  root;
  mainPath = "";
  scroll = {};
  selected;
  cancelDrag;
  nativeGraph;
  relationKey = "";
  destroy() {
    this.prepareRender();
    this.nativeGraph.destroy();
  }
  isCurrent() {
    const main = this.plugin.mainFile;
    if (!main || main.path !== this.mainPath || !this.root?.isConnected) return false;
    return this.relationKey === JSON.stringify(relations(this.plugin.app.metadataCache.resolvedLinks, main.path, new Set(this.plugin.app.vault.getMarkdownFiles().map((f) => f.path))));
  }
  prepareRender() {
    this.nativeGraph.detach();
    this.cancelDrag?.();
    this.cancelDrag = void 0;
    if (this.root?.isConnected) for (const key of sectionKeys) {
      const body = this.root.querySelector(`[data-section="${key}"] .mdp-connection-content`);
      if (body) this.scroll[key] = body.scrollTop;
    }
  }
  render(root) {
    this.root = root;
    const main = this.plugin.mainFile;
    if (!main) return;
    if (main.path !== this.mainPath) {
      this.mainPath = main.path;
      this.scroll = {};
      this.selected = void 0;
    }
    root.className = "mdp-connections";
    const actions = root.createDiv({ cls: "mdp-connection-actions" });
    const add = actions.createEl("button", { cls: "mdp-add-connection", text: "+ \uC5F0\uACB0 \uD30C\uC77C \uCD94\uAC00" });
    add.onclick = () => {
      const current = this.plugin.mainFile;
      if (!current) {
        new import_obsidian6.Notice("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB97C \uBA3C\uC800 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.");
        return;
      }
      new ConnectionPicker(this.plugin, current).open();
    };
    actions.createEl("button", { cls: "mdp-new-linked-note", text: "+ \uC0C8 \uB9C1\uD06C \uD30C\uC77C \uCD94\uAC00" }).onclick = () => {
      const file = this.plugin.mainFile;
      if (file) new NewLinkedNoteModal(this.plugin, file).open();
    };
    const links = this.plugin.app.metadataCache.resolvedLinks;
    const related = relations(links, main.path, new Set(this.plugin.app.vault.getMarkdownFiles().map((f) => f.path)));
    this.relationKey = JSON.stringify(related);
    const stack = root.createDiv({ cls: "mdp-connection-sections" });
    for (const [i, key] of sectionKeys.entries()) {
      const section = stack.createDiv({ cls: "mdp-connection-section", attr: { "data-section": key } });
      const paths = key === "graph" ? [.../* @__PURE__ */ new Set([...related.backlinks, ...related.outgoing])] : related[key];
      const header = section.createEl("button", { cls: "mdp-connection-header", attr: { "aria-expanded": String(!this.plugin.connections.collapsed[key]) } });
      const icon = header.createSpan();
      (0, import_obsidian6.setIcon)(icon, this.plugin.connections.collapsed[key] ? "chevron-right" : "chevron-down");
      header.createSpan({ text: { backlinks: "Backlinks", outgoing: "Outgoing Links", graph: "Local Graph" }[key] });
      if (key !== "graph") header.createSpan({ cls: "mdp-muted", text: String(paths.length) });
      header.onclick = () => {
        this.plugin.connections.collapsed[key] = !this.plugin.connections.collapsed[key];
        header.setAttribute("aria-expanded", String(!this.plugin.connections.collapsed[key]));
        (0, import_obsidian6.setIcon)(icon, this.plugin.connections.collapsed[key] ? "chevron-right" : "chevron-down");
        this.layout(stack);
        this.plugin.saveConnections();
      };
      const body = section.createDiv({ cls: "mdp-connection-content" });
      if (key === "graph") this.nativeGraph.mount(body, main);
      else {
        if (!paths.length) body.createDiv({ cls: "mdp-muted mdp-connection-empty", text: key === "backlinks" ? "\uC5F0\uACB0\uB41C \uBC31\uB9C1\uD06C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." : "\uC544\uC6C3\uACE0\uC789 \uB9C1\uD06C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." });
        for (const path of paths) {
          const file = this.plugin.app.vault.getAbstractFileByPath(path);
          if (!(file instanceof import_obsidian6.TFile)) continue;
          const row = body.createDiv({ cls: "mdp-connection-row", attr: { tabindex: "0", role: "button", "data-path": path, "aria-label": path, title: path } });
          (0, import_obsidian6.setIcon)(row.createSpan({ cls: "mdp-connection-file-icon" }), "file-text");
          row.createSpan({ cls: "mdp-connection-name", text: file.name });
          this.fileEvents(row, file);
        }
        body.scrollTop = this.scroll[key] ?? 0;
      }
      if (i < 2) {
        const divider = stack.createDiv({ cls: "mdp-connection-divider", attr: { role: "separator", tabindex: "0", "aria-orientation": "horizontal", "aria-label": `${key} \uC601\uC5ED \uB192\uC774 \uC870\uC808`, "data-after": key } });
        divider.createSpan({ text: "\u283F" });
        divider.onpointerdown = (e) => this.resize(e, stack, i);
        divider.onkeydown = (e) => {
          if (!["ArrowUp", "ArrowDown"].includes(e.key)) return;
          const pair = this.resizePair(stack, i);
          if (!pair) return;
          e.preventDefault();
          this.adjust(pair, e.key === "ArrowDown" ? 16 : -16);
          this.layout(stack);
          this.plugin.saveConnections();
        };
      }
    }
    this.layout(stack);
  }
  layout(stack) {
    for (const key of sectionKeys) {
      const section = stack.querySelector(`[data-section="${key}"]`);
      const collapsed = this.plugin.connections.collapsed[key];
      section.classList.toggle("is-collapsed", collapsed);
      section.style.flex = collapsed ? "0 0 34px" : `${this.plugin.connections.heights[key]} 1 0px`;
    }
    for (const [i, divider] of Array.from(stack.querySelectorAll(".mdp-connection-divider")).entries()) {
      const pair = this.resizePair(stack, i);
      divider.classList.toggle("is-disabled", !pair);
      divider.setAttribute("aria-disabled", String(!pair));
      if (pair) divider.setAttribute("aria-valuenow", String(Math.round(pair.aHeight / (pair.aHeight + pair.bHeight) * 100)));
    }
  }
  resizePair(stack, boundary) {
    const visible = sectionKeys.filter((k) => !this.plugin.connections.collapsed[k]);
    const a = visible.filter((k) => sectionKeys.indexOf(k) <= boundary).at(-1);
    const b = visible.find((k) => sectionKeys.indexOf(k) > boundary);
    if (!a || !b) return;
    return { a, b, aHeight: stack.querySelector(`[data-section="${a}"]`).getBoundingClientRect().height, bHeight: stack.querySelector(`[data-section="${b}"]`).getBoundingClientRect().height, totalWeight: this.plugin.connections.heights[a] + this.plugin.connections.heights[b] };
  }
  adjust(pair, delta) {
    const total = pair.aHeight + pair.bHeight;
    const min = Math.min(60, total / 3);
    const height = Math.max(min, Math.min(total - min, pair.aHeight + delta));
    this.plugin.connections.heights[pair.a] = pair.totalWeight * height / total;
    this.plugin.connections.heights[pair.b] = pair.totalWeight * (total - height) / total;
  }
  resize(e, stack, boundary) {
    if (e.button !== 0) return;
    const pair = this.resizePair(stack, boundary);
    if (!pair) return;
    const target = e.currentTarget, startY = e.clientY;
    const original = { ...this.plugin.connections.heights };
    e.preventDefault();
    target.setPointerCapture(e.pointerId);
    const move = (event) => {
      this.adjust(pair, event.clientY - startY);
      this.layout(stack);
    };
    const stop = (cancel) => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", cancelEvent);
      target.ownerDocument.removeEventListener("keydown", escape);
      if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
      this.cancelDrag = void 0;
      if (cancel) this.plugin.connections.heights = original;
      this.layout(stack);
      if (!cancel) this.plugin.saveConnections();
    };
    const up = () => stop(false), cancelEvent = () => stop(true), escape = (event) => {
      if (event.key === "Escape") stop(true);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", cancelEvent);
    target.ownerDocument.addEventListener("keydown", escape);
    this.cancelDrag = () => stop(true);
  }
  fileEvents(element, file) {
    if (element instanceof HTMLElement) this.plugin.bindFilePreview(element, file);
    element.classList.toggle("is-selected", this.selected === file.path);
    element.addEventListener("click", () => {
      this.selected = file.path;
      for (const node of Array.from(this.root?.querySelectorAll("[data-path]") ?? [])) node.classList.toggle("is-selected", node.getAttribute("data-path") === file.path);
    });
    element.addEventListener("dblclick", (event) => this.plugin.openFileGesture(file, event));
    element.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.plugin.run(() => this.plugin.openIn("sub", file));
      }
    });
    element.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const menu = new import_obsidian6.Menu();
      menu.addItem((item) => item.setTitle("Sub Space\uC5D0\uC11C \uC5F4\uAE30").setIcon("link").onClick(() => this.plugin.run(() => this.plugin.openIn("sub", file))));
      menu.showAtMouseEvent(event);
    });
  }
};

// src/folder-view.ts
var import_obsidian7 = require("obsidian");

// src/folders-state.ts
var folderDisplayModes = ["compact", "large", "medium", "small", "list", "details", "tiles"];
var folderKey = (id) => "d:" + id;
var fileKey = (path) => "f:" + path;
function readDocumentFolders(raw) {
  const result = /* @__PURE__ */ Object.create(null);
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [path, value] of Object.entries(raw)) if (path.endsWith(".md")) result[path] = readFolders(value);
  }
  return result;
}
function readFolders(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  const folders = [];
  for (const f of Array.isArray(v.folders) ? v.folders : []) if (f && typeof f.id === "string" && f.id && typeof f.name === "string" && f.name.trim() && typeof f.parent === "string" && !folders.some((x) => x.id === f.id)) folders.push({ id: f.id, name: f.name, parent: f.parent });
  for (const f of folders) {
    const seen = /* @__PURE__ */ new Set([f.id]);
    let parent = f.parent;
    while (parent) {
      if (seen.has(parent)) {
        f.parent = "";
        break;
      }
      seen.add(parent);
      const next = folders.find((x) => x.id === parent);
      if (!next) {
        f.parent = "";
        break;
      }
      parent = next.parent;
    }
  }
  const exists = (id) => typeof id === "string" && (!id || folders.some((f) => f.id === id));
  const positions = /* @__PURE__ */ Object.create(null);
  if (v.positions && typeof v.positions === "object") {
    for (const [path, id] of Object.entries(v.positions)) if (exists(id)) positions[path] = id;
  }
  return {
    folders,
    positions,
    order: Array.isArray(v.order) ? [...new Set(v.order.filter((x) => typeof x === "string"))] : [],
    mode: v.mode === "tree" || v.mode === "folder" ? v.mode : "composite",
    display: folderDisplayModes.includes(v.display) ? v.display : "compact",
    current: exists(v.current) ? v.current : "",
    collapsed: Array.isArray(v.collapsed) ? v.collapsed.filter(exists) : [],
    treeSort: v.treeSort === "name" ? "name" : "manual",
    sort: ["manual", "name", "type", "mtime", "size"].includes(v.sort) ? v.sort : "manual",
    descending: v.descending === true,
    split: typeof v.split === "number" && Number.isFinite(v.split) ? Math.max(0.2, Math.min(0.8, v.split)) : 0.5,
    layout: v.layout === "horizontal" ? "horizontal" : "vertical"
  };
}
function ancestors(s, id) {
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  while (id && !seen.has(id)) {
    seen.add(id);
    const f = s.folders.find((x) => x.id === id);
    if (!f) break;
    result.unshift(id);
    id = f.parent;
  }
  return result;
}
function parentOf(s, key) {
  return key.startsWith("d:") ? s.folders.find((f) => folderKey(f.id) === key)?.parent ?? "" : s.positions[key.slice(2)] ?? "";
}
function canMove(s, keys, target) {
  if (target && !s.folders.some((f) => f.id === target)) return false;
  return keys.length > 0 && keys.every((key) => !key.startsWith("d:") || s.folders.some((f) => folderKey(f.id) === key) && !ancestors(s, target).includes(key.slice(2)));
}
function moveItems(s, keys, target, before) {
  if (!canMove(s, keys, target)) throw Error("\uC790\uAE30 \uC790\uC2E0\uC774\uB098 \uD558\uC704 \uD3F4\uB354\uB85C \uC774\uB3D9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  const selected = new Set(keys);
  const top = keys.filter((key) => !ancestors(s, parentOf(s, key)).some((id) => selected.has(folderKey(id))));
  if (before && top.includes(before)) return;
  for (const key of top) {
    if (key.startsWith("d:")) s.folders.find((f) => folderKey(f.id) === key).parent = target;
    else s.positions[key.slice(2)] = target;
  }
  const moving = new Set(top), ordered = [...s.order.filter((k) => moving.has(k)), ...top.filter((k) => !s.order.includes(k))];
  s.order = s.order.filter((k) => !moving.has(k));
  const index = before ? s.order.indexOf(before) : -1;
  s.order.splice(index < 0 ? s.order.length : index, 0, ...ordered);
}
function deleteFolder(s, id) {
  const folder = s.folders.find((f) => f.id === id);
  if (!folder) return;
  for (const f of s.folders) if (f.parent === id) f.parent = folder.parent;
  for (const path of Object.keys(s.positions)) if (s.positions[path] === id) s.positions[path] = folder.parent;
  if (s.current === id) s.current = folder.parent;
  s.folders = s.folders.filter((f) => f.id !== id);
  s.order = s.order.filter((k) => k !== folderKey(id));
  s.collapsed = s.collapsed.filter((k) => k !== id);
}

// src/folder-view.ts
var sortNames = { manual: "\uC0AC\uC6A9\uC790 \uC9C0\uC815", name: "\uC774\uB984", type: "\uC720\uD615", mtime: "\uC218\uC815 \uB0A0\uC9DC", size: "\uD06C\uAE30" };
var displayNames = ["\uC81C\uBAA9 \uCE74\uB4DC", "\uD070 \uC544\uC774\uCF58", "\uC911\uAC04 \uC544\uC774\uCF58", "\uC791\uC740 \uC544\uC774\uCF58", "\uBAA9\uB85D", "\uC790\uC138\uD788", "\uD0C0\uC77C"];
var nameCollator = new Intl.Collator(void 0, { numeric: true, sensitivity: "base" });
var NameModal = class extends import_obsidian7.Modal {
  constructor(plugin, parent, id) {
    super(plugin.app);
    this.plugin = plugin;
    this.parent = parent;
    this.id = id;
    this.main = plugin.mainFile;
  }
  main;
  onOpen() {
    this.titleEl.setText(this.id ? "\uAC00\uC0C1 \uD3F4\uB354 \uC774\uB984 \uBCC0\uACBD" : "\uC0C8 \uAC00\uC0C1 \uD3F4\uB354 \uB9CC\uB4E4\uAE30");
    const input = this.contentEl.createEl("input", { type: "text", value: this.plugin.folders.folders.find((f) => f.id === this.id)?.name ?? "", attr: { "aria-label": "\uAC00\uC0C1 \uD3F4\uB354 \uC774\uB984", maxlength: "120" } });
    const actions = this.contentEl.createDiv({ cls: "mdp-modal-actions" });
    actions.createEl("button", { text: "\uCDE8\uC18C" }).onclick = () => this.close();
    const apply = () => {
      const name = input.value.trim();
      if (!name || /[\r\n/\\]/.test(name)) {
        new import_obsidian7.Notice("\uD3F4\uB354 \uC774\uB984\uC5D0 \uACBD\uB85C \uAD6C\uBD84\uC790\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
        return;
      }
      this.plugin.run(async () => {
        await this.plugin.changeFolders((s) => {
          const existing = s.folders.find((f) => f.id === this.id), parent = existing?.parent ?? this.parent;
          if (parent && !s.folders.some((f) => f.id === parent)) throw Error("\uC0C1\uC704 \uD3F4\uB354\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
          if (s.folders.some((f) => f.parent === parent && f.name === name && f.id !== this.id)) throw Error("\uAC19\uC740 \uC774\uB984\uC758 \uAC00\uC0C1 \uD3F4\uB354\uAC00 \uC788\uC2B5\uB2C8\uB2E4.");
          if (this.id) {
            if (!existing) throw Error("\uD3F4\uB354\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
            existing.name = name;
          } else {
            const id = crypto.randomUUID();
            s.folders.push({ id, name, parent });
            s.order.push(folderKey(id));
          }
        }, this.main);
        this.close();
      });
    };
    actions.createEl("button", { text: "\uC800\uC7A5", cls: "mod-cta" }).onclick = apply;
    input.onkeydown = (e) => {
      if (e.key === "Enter") apply();
    };
    input.focus();
    input.select();
  }
  onClose() {
    this.contentEl.empty();
  }
};
var FolderConnectionPicker = class extends import_obsidian7.FuzzySuggestModal {
  constructor(plugin, main, folder) {
    super(plugin.app);
    this.plugin = plugin;
    this.main = main;
    this.folder = folder;
    this.setPlaceholder("\uC5F0\uACB0\uD560 \uAE30\uC874 Vault \uD30C\uC77C \uC120\uD0DD");
  }
  getItems() {
    return this.app.vault.getFiles().filter((f) => f !== this.main);
  }
  getItemText(file) {
    return file.path;
  }
  onChooseItem(file) {
    this.plugin.run(() => this.plugin.addFolderConnection(this.main, file, this.folder));
  }
};
var FolderView = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  root;
  thumbnails;
  query = "";
  history = [""];
  historyIndex = 0;
  selections = { tree: /* @__PURE__ */ new Set(), folder: /* @__PURE__ */ new Set() };
  anchors = {};
  drag;
  entries = [];
  main;
  initialized = false;
  resizeCleanup;
  scroll = { tree: 0, folder: 0 };
  restoreFrame;
  observers = [];
  destroy() {
    if (this.restoreFrame !== void 0) cancelAnimationFrame(this.restoreFrame);
    for (const observer of this.observers) observer.disconnect();
    this.observers = [];
    this.thumbnails?.destroy();
    this.thumbnails = void 0;
    this.resizeCleanup?.();
    this.resizeCleanup = void 0;
  }
  render(root) {
    this.destroy();
    this.root = root;
    root.className = "mdp-folder-view";
    const parent = root.parentNode, nextSibling = root.nextSibling;
    root.remove();
    const s = this.plugin.folders;
    if (!this.initialized) {
      this.history = [s.current];
      this.initialized = true;
    }
    if (this.main !== this.plugin.mainFile?.path) {
      this.main = this.plugin.mainFile?.path;
      this.history = [s.current];
      this.historyIndex = 0;
      this.selections.tree.clear();
      this.selections.folder.clear();
      this.drag = void 0;
      this.query = "";
      this.scroll = { tree: 0, folder: 0 };
    }
    const connected = this.plugin.connectedFiles(), known = new Set(s.order);
    let added = false;
    for (const key of [...s.folders.map((f) => folderKey(f.id)), ...connected.map((f) => fileKey(f.path))]) if (!known.has(key)) {
      s.order.push(key);
      known.add(key);
      added = true;
    }
    if (added) this.plugin.saveCardOrder();
    const files = connected.filter((f) => this.plugin.cards.fileType === "all" || classify(f.extension) === this.plugin.cards.fileType);
    this.entries = [...s.folders.map((f) => ({ key: folderKey(f.id), name: f.name, parent: f.parent, folder: f.id })), ...files.map((file) => ({ key: fileKey(file.path), name: file.name, parent: s.positions[file.path] ?? "", file }))];
    for (const surface of ["tree", "folder"]) this.selections[surface] = new Set([...this.selections[surface]].filter((k) => this.entries.some((e) => e.key === k)));
    const toolbar = root.createDiv({ cls: "mdp-folder-toolbar" });
    const filter = toolbar.createEl("select", { attr: { "aria-label": "\uD30C\uC77C \uC720\uD615" } });
    fileTypes.forEach((type, i) => filter.createEl("option", { value: type, text: ["\uC804\uCCB4 \uD30C\uC77C \uC720\uD615", "Markdown", "Canvas", "PDF", "\uC774\uBBF8\uC9C0", "\uC601\uC0C1", "\uAE30\uD0C0"][i] }));
    filter.value = this.plugin.cards.fileType;
    filter.onchange = () => {
      this.plugin.cards.fileType = filter.value;
      this.plugin.cardsChanged();
    };
    toolbar.createEl("button", { text: "\uBCF4\uAE30 \uD615\uC2DD \u25BE" }).onclick = (e) => this.viewMenu(e);
    const panels = root.createDiv({ cls: `mdp-folder-panels mdp-folder-${s.mode} mdp-folder-${s.layout}` });
    let tree;
    if (s.mode !== "folder") {
      tree = panels.createDiv({ cls: "mdp-folder-section mdp-tree-section" });
      const header = tree.createDiv({ cls: "mdp-folder-header" });
      header.createSpan({ text: "Virtual Folders (MD Palette)" });
      header.createEl("button", { text: sortNames[s.treeSort] + " \u25BE", attr: { "aria-label": "Tree \uC815\uB82C" } }).onclick = (e) => this.sortMenu(e, true);
      const list = tree.createDiv({ cls: "mdp-folder-tree", attr: { role: "tree", "aria-label": "\uAC00\uC0C1 \uD3F4\uB354 \uD2B8\uB9AC", "aria-multiselectable": "true" } });
      const rootRow = list.createDiv({ cls: "mdp-tree-root", text: "\u2302 \uC804\uCCB4 \uAC00\uC0C1 \uD3F4\uB354", attr: { tabindex: "0" } });
      rootRow.ondblclick = () => this.navigate("");
      rootRow.onkeydown = (e) => {
        if (e.key === "Enter") this.navigate("");
      };
      this.dropTarget(rootRow, "", "tree");
      rootRow.oncontextmenu = (e) => this.emptyMenu(e, "");
      const rows = [];
      const visit = (parent2, depth) => {
        for (const item of this.sorted(this.entries.filter((x) => x.parent === parent2), true)) {
          rows.push({ item, depth });
          if (item.folder && !s.collapsed.includes(item.folder)) visit(item.folder, depth + 1);
        }
      };
      visit("", 0);
      this.renderEntries(list, rows, "tree");
      list.oncontextmenu = (e) => {
        if (!e.target.closest("[data-key],.mdp-tree-root")) this.emptyMenu(e, "");
      };
      this.dropTarget(list, "", "tree");
      list.onscroll = () => {
        this.scroll.tree = list.scrollTop;
      };
    }
    const divider = s.mode === "composite" ? panels.createDiv({ cls: "mdp-folder-divider", attr: { role: "separator", tabindex: "0", "aria-label": "Tree / Folder \uC601\uC5ED \uD06C\uAE30", "aria-orientation": s.layout === "vertical" ? "horizontal" : "vertical" } }) : void 0;
    if (s.mode !== "tree") {
      const folder = panels.createDiv({ cls: "mdp-folder-section mdp-contents-section" });
      const header = folder.createDiv({ cls: "mdp-folder-header" });
      header.createSpan({ text: "Folder Contents" });
      header.createEl("button", { text: sortNames[s.sort] + (s.sort === "manual" ? " \u25BE" : s.descending ? " \u2193" : " \u2191"), attr: { "aria-label": "Folder \uC815\uB82C" } }).onclick = (e) => this.sortMenu(e);
      const nav = folder.createDiv({ cls: "mdp-folder-navigation" });
      this.iconButton(nav, "\uB4A4\uB85C", "arrow-left", () => this.historyMove(-1), this.historyIndex <= 0);
      this.iconButton(nav, "\uC55E\uC73C\uB85C", "arrow-right", () => this.historyMove(1), this.historyIndex >= this.history.length - 1);
      this.iconButton(nav, "\uC0C1\uC704 \uD3F4\uB354", "arrow-up", () => this.navigate(s.folders.find((f) => f.id === s.current)?.parent ?? ""), !s.current);
      const crumbs = nav.createDiv({ cls: "mdp-folder-breadcrumb", attr: { "aria-label": "\uAC00\uC0C1 \uD3F4\uB354 \uACBD\uB85C" } });
      for (const id of ["", ...ancestors(s, s.current)]) {
        const b = crumbs.createEl("button", { text: id ? s.folders.find((f) => f.id === id).name : "\uC804\uCCB4", attr: { "data-folder": id } });
        b.onclick = () => this.navigate(id);
        this.dropTarget(b, id, "folder");
      }
      const search = nav.createEl("input", { type: "search", value: this.query, placeholder: "\uD604\uC7AC \uD3F4\uB354\uC5D0\uC11C \uAC80\uC0C9\u2026", attr: { "aria-label": "\uD604\uC7AC \uD3F4\uB354\uC5D0\uC11C \uAC80\uC0C9" } });
      search.oninput = () => {
        this.query = search.value;
        this.scroll.folder = 0;
        this.redraw();
        const next = this.root?.querySelector("input[type=search]");
        next?.focus();
      };
      const grid = folder.createDiv({ cls: `mdp-card-grid mdp-folder-grid mdp-display-${s.display}`, attr: { role: "listbox", "aria-label": "\uAC00\uC0C1 \uD3F4\uB354 \uB0B4\uC6A9", "aria-multiselectable": "true" } });
      if (s.display !== "compact") this.thumbnails = new Thumbnails(this.plugin.app, grid);
      const query = this.query.trim().toLocaleLowerCase();
      const visible = this.sorted(this.entries.filter((x) => query ? (s.current === "" || ancestors(s, x.parent).includes(s.current)) && x.name.toLocaleLowerCase().includes(query) : x.parent === s.current));
      this.renderEntries(grid, visible.map((item) => ({ item, depth: 0 })), "folder");
      if (!visible.length) grid.createDiv({ cls: "mdp-muted mdp-no-cards", text: query ? "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." : "\uBE48 \uAC00\uC0C1 \uD3F4\uB354\uC785\uB2C8\uB2E4. \uBE48 \uACF5\uAC04\uC744 \uC6B0\uD074\uB9AD\uD574 \uD3F4\uB354\uB098 \uC5F0\uACB0 \uD30C\uC77C\uC744 \uCD94\uAC00\uD558\uC138\uC694." });
      grid.oncontextmenu = (e) => {
        if (!e.target.closest("[data-key]")) this.emptyMenu(e, s.current);
      };
      this.dropTarget(grid, s.current, "folder");
      grid.addEventListener("wheel", (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        const index = folderDisplayModes.indexOf(s.display), next = Math.max(0, Math.min(folderDisplayModes.length - 1, index + (e.deltaY > 0 ? 1 : -1)));
        if (next !== index) this.change((n) => {
          n.display = folderDisplayModes[next];
        });
      }, { passive: false });
      grid.onscroll = () => {
        this.scroll.folder = grid.scrollTop;
      };
    }
    if (tree && divider) {
      const size = () => {
        tree.style.flex = `0 0 calc(${s.split * 100}% - 5px)`;
        divider.setAttribute("aria-valuenow", String(Math.round(s.split * 100)));
      };
      size();
      divider.onpointerdown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        divider.setPointerCapture(e.pointerId);
        const initial = s.split;
        const move = (event) => {
          const r = panels.getBoundingClientRect();
          s.split = Math.max(0.2, Math.min(0.8, s.layout === "vertical" ? (event.clientY - r.top) / r.height : (event.clientX - r.left) / r.width));
          size();
        };
        const finish = () => {
          cleanup();
          this.change((n) => {
            n.split = s.split;
          });
        };
        const cancel = () => {
          s.split = initial;
          size();
          cleanup();
        };
        const cleanup = () => {
          divider.removeEventListener("pointermove", move);
          divider.removeEventListener("pointerup", finish);
          divider.removeEventListener("pointercancel", cancel);
          this.resizeCleanup = void 0;
        };
        divider.addEventListener("pointermove", move);
        divider.addEventListener("pointerup", finish);
        divider.addEventListener("pointercancel", cancel);
        this.resizeCleanup = cleanup;
      };
      divider.onkeydown = (e) => {
        if (["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          this.change((n) => {
            n.split = Math.max(0.2, Math.min(0.8, n.split + (["ArrowUp", "ArrowLeft"].includes(e.key) ? -0.05 : 0.05)));
          });
        }
      };
    }
    root.createDiv({ cls: "mdp-folder-notice mdp-muted", text: "\uC2E4\uC81C Vault \uACBD\uB85C\uB97C \uBC14\uAFB8\uC9C0 \uC54A\uB294 \uAC00\uC0C1 \uD3F4\uB354\uC785\uB2C8\uB2E4. Tree\uC640 Folder\uC758 \uC120\uD0DD\uC740 \uC11C\uB85C \uB3C5\uB9BD\uC801\uC785\uB2C8\uB2E4." });
    this.paint();
    parent?.insertBefore(root, nextSibling);
    const treeScroll = this.scroll.tree, folderScroll = this.scroll.folder;
    this.restoreFrame = requestAnimationFrame(() => {
      const tree2 = root.querySelector(".mdp-folder-tree"), grid = root.querySelector(".mdp-folder-grid");
      if (tree2 && treeScroll) tree2.scrollTop = treeScroll;
      if (grid && folderScroll) grid.scrollTop = folderScroll;
      this.restoreFrame = void 0;
    });
  }
  redraw() {
    if (this.root) {
      this.destroy();
      this.root.empty();
      this.render(this.root);
    }
  }
  renderEntries(root, rows, surface) {
    const visible = rows.map((row) => row.item);
    let count = 0;
    const sentinel = root.createDiv({ cls: "mdp-folder-sentinel", attr: { "aria-hidden": "true" } });
    const append = (limit = 80) => {
      const fragment = root.ownerDocument.createElement("div");
      for (let end = Math.min(rows.length, count + limit); count < end; count++) this.row(fragment, rows[count].item, surface, visible, rows[count].depth);
      const batch = root.ownerDocument.createDocumentFragment();
      while (fragment.firstChild) batch.append(fragment.firstChild);
      root.insertBefore(batch, sentinel);
      if (count === rows.length) {
        sentinel.remove();
        observer?.disconnect();
      } else if (observer) {
        observer.unobserve(sentinel);
        observer.observe(sentinel);
      }
      this.paint();
    };
    let observer;
    const restoreCount = this.scroll[surface] > 0 ? Math.ceil(this.scroll[surface] / (surface === "tree" ? 28 : 32)) + 80 : 80;
    append(restoreCount);
    if (count < rows.length) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) append();
      }, { root, rootMargin: "240px" });
      observer.observe(sentinel);
      this.observers.push(observer);
    }
  }
  change(fn) {
    this.plugin.run(() => this.plugin.changeFolders(fn));
  }
  iconButton(root, name, icon, action, disabled = false) {
    const b = root.createEl("button", { attr: { "aria-label": name, title: name } });
    (0, import_obsidian7.setIcon)(b, icon);
    b.disabled = disabled;
    b.onclick = action;
  }
  sorted(entries, tree = false) {
    const s = this.plugin.folders, sort = tree ? s.treeSort : s.sort, ranks = new Map(s.order.map((key, i) => [key, i]));
    return entries.sort((a, b) => {
      if (sort === "manual") return (ranks.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (ranks.get(b.key) ?? Number.MAX_SAFE_INTEGER);
      const name = () => nameCollator.compare(a.name, b.name);
      let n = sort === "name" ? name() : sort === "type" ? (a.folder ? "Folder" : a.file.extension).localeCompare(b.folder ? "Folder" : b.file.extension) : sort === "mtime" ? (a.file?.stat.mtime ?? 0) - (b.file?.stat.mtime ?? 0) : (a.file?.stat.size ?? 0) - (b.file?.stat.size ?? 0);
      n ||= name();
      return n * (!tree && s.descending ? -1 : 1);
    });
  }
  row(root, item, surface, visible, depth = 0) {
    const tree = surface === "tree", s = this.plugin.folders, compact = !tree && s.display === "compact";
    const el = root.createDiv({ cls: tree ? "mdp-folder-row" : "mdp-card mdp-folder-item", attr: { "data-key": item.key, "data-surface": surface, role: tree ? "treeitem" : "option", tabindex: "0", draggable: "true", title: item.file?.path ?? this.virtualPath(item.folder) } });
    if (item.file) this.plugin.bindFilePreview(el, item.file);
    if (compact) {
      const icon = el.createSpan({ cls: "mdp-compact-icon" });
      (0, import_obsidian7.setIcon)(icon, item.folder ? "folder" : classify(item.file.extension) === "image" ? "image" : item.file.extension === "canvas" ? "layout-dashboard" : "file-text");
      el.createDiv({ cls: "mdp-compact-title", text: item.name });
      el.setAttribute("aria-label", item.name);
      el.title = item.file ? `${item.file.path}
\uAC00\uC0C1 \uC704\uCE58: ${this.virtualPath(item.parent)}` : this.virtualPath(item.folder);
    } else {
      if (!tree && item.file) {
        el.classList.add("mdp-file-card");
        el.createDiv({ cls: "mdp-card-name mdp-file-title", text: item.name });
      }
      if (tree) {
        el.style.paddingLeft = `${6 + depth * 16}px`;
        el.setAttribute("aria-level", String(depth + 1));
      }
      if (tree && item.folder) {
        el.setAttribute("aria-expanded", String(!s.collapsed.includes(item.folder)));
        this.iconButton(el, `${item.name} \uC811\uAE30/\uD3BC\uCE58\uAE30`, s.collapsed.includes(item.folder) ? "chevron-right" : "chevron-down", () => this.change((n) => {
          n.collapsed = n.collapsed.includes(item.folder) ? n.collapsed.filter((id) => id !== item.folder) : [...n.collapsed, item.folder];
        }));
      }
      const preview = el.createDiv({ cls: tree ? "mdp-folder-icon" : "mdp-preview" });
      if (item.folder) (0, import_obsidian7.setIcon)(preview, "folder");
      else if (!tree && !["list", "details"].includes(s.display)) this.thumbnails?.observe(preview, item.file);
      else (0, import_obsidian7.setIcon)(preview, classify(item.file.extension) === "image" ? "image" : "file-text");
      const info = el.createDiv({ cls: "mdp-card-info" });
      if (tree || item.folder) info.createDiv({ cls: "mdp-card-name", text: item.name });
      if (!tree) {
        const label = this.plugin.cards.labels.find((l) => l.id === this.plugin.cards.assignments[item.file?.path ?? ""]);
        if (label) {
          const badge = info.createSpan({ cls: "mdp-label-badge", text: label.name });
          badge.style.setProperty("--mdp-label-color", label.color);
        }
        if (this.query.trim()) info.createDiv({ cls: "mdp-card-detail", text: this.virtualPath(item.parent) });
        if (["details", "tiles"].includes(s.display)) info.createDiv({ cls: "mdp-card-detail", text: item.folder ? "\uAC00\uC0C1 \uD3F4\uB354" : `${item.file.extension.toUpperCase()} \xB7 ${new Date(item.file.stat.mtime).toLocaleString()} \xB7 ${item.file.stat.size} B` });
      }
    }
    el.onclick = (e) => {
      if (e.target.closest("button")) return;
      this.select(item.key, surface, visible, e);
    };
    const open = () => item.folder ? this.navigate(item.folder) : this.plugin.run(() => this.plugin.openIn("sub", item.file));
    el.ondblclick = (e) => {
      if (e.target.closest("button")) return;
      if (item.folder) this.navigate(item.folder);
      else this.plugin.openFileGesture(item.file, e);
    };
    el.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        open();
      } else if (e.key === " ") {
        e.preventDefault();
        this.select(item.key, surface, visible, e);
      }
    };
    el.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.selections[surface].has(item.key)) this.select(item.key, surface, visible, e);
      const menu = new import_obsidian7.Menu();
      if (item.folder) {
        menu.addItem((i) => i.setTitle("\uC5F4\uAE30").onClick(open));
        menu.addItem((i) => i.setTitle("\uC0C8 \uAC00\uC0C1 \uD3F4\uB354 \uB9CC\uB4E4\uAE30").onClick(() => new NameModal(this.plugin, item.folder).open()));
        menu.addItem((i) => i.setTitle("\uC774\uB984 \uBCC0\uACBD").onClick(() => new NameModal(this.plugin, item.parent, item.folder).open()));
        menu.addItem((i) => i.setTitle("\uAC00\uC0C1 \uD3F4\uB354 \uC0AD\uC81C (\uB0B4\uC6A9\uC740 \uD55C \uB2E8\uACC4 \uC704\uB85C)").setIcon("folder-minus").onClick(() => this.change((n) => deleteFolder(n, item.folder))));
      } else {
        menu.addItem((i) => i.setTitle("Sub Space\uC5D0\uC11C \uC5F4\uAE30").onClick(open));
      }
      menu.showAtMouseEvent(e);
    };
    el.ondragstart = (e) => {
      if (!this.selections[surface].has(item.key)) this.select(item.key, surface, visible, e);
      this.drag = { keys: visible.filter((x) => this.selections[surface].has(x.key)).map((x) => x.key), main: this.main, surface };
      e.dataTransfer?.setData("application/x-md-palette-folder", this.main);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    };
    el.ondragend = () => {
      this.drag = void 0;
      this.clearDrop();
    };
    this.dropTarget(el, item.folder ?? item.parent, surface, item);
  }
  select(key, surface, visible, e) {
    const selected = this.selections[surface], anchor = this.anchors[surface];
    if (e.shiftKey && anchor && visible.some((x) => x.key === anchor)) {
      if (!e.ctrlKey && !e.metaKey) selected.clear();
      const a = visible.findIndex((x) => x.key === anchor), b = visible.findIndex((x) => x.key === key);
      for (const x of visible.slice(Math.min(a, b), Math.max(a, b) + 1)) selected.add(x.key);
    } else if (e.ctrlKey || e.metaKey) {
      selected.has(key) ? selected.delete(key) : selected.add(key);
      this.anchors[surface] = key;
    } else {
      selected.clear();
      selected.add(key);
      this.anchors[surface] = key;
    }
    this.paint();
  }
  paint() {
    this.root?.querySelectorAll("[data-key]").forEach((el) => {
      const selected = this.selections[el.dataset.surface].has(el.dataset.key);
      el.classList.toggle("is-selected", selected);
      el.setAttribute("aria-selected", String(selected));
    });
  }
  virtualPath(id) {
    return ["\uC804\uCCB4", ...ancestors(this.plugin.folders, id).map((k) => this.plugin.folders.folders.find((f) => f.id === k).name)].join(" / ");
  }
  navigate(id) {
    if (id && !this.plugin.folders.folders.some((f) => f.id === id)) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(id);
    this.historyIndex++;
    this.query = "";
    this.scroll.folder = 0;
    this.selections.folder.clear();
    this.change((s) => {
      s.current = id;
    });
  }
  historyMove(delta) {
    const index = this.historyIndex + delta;
    if (index < 0 || index >= this.history.length) return;
    this.historyIndex = index;
    const id = this.history[index];
    this.query = "";
    this.scroll.folder = 0;
    this.change((s) => {
      s.current = s.folders.some((f) => f.id === id) ? id : "";
    });
  }
  viewMenu(e) {
    const menu = new import_obsidian7.Menu(), s = this.plugin.folders;
    for (const [mode, name] of [["composite", "\uBCF5\uD569\uBDF0"], ["tree", "Tree\uBDF0"], ["folder", "Folder\uBDF0"]]) menu.addItem((i) => i.setTitle(name).setChecked(s.mode === mode).onClick(() => this.change((n) => {
      n.mode = mode;
    })));
    menu.addSeparator();
    folderDisplayModes.forEach((mode, index) => menu.addItem((i) => i.setTitle(displayNames[index]).setChecked(s.display === mode).onClick(() => this.change((n) => {
      n.display = mode;
    }))));
    menu.addSeparator();
    for (const [layout, name] of [["vertical", "\uC0C1\uD558 \uBD84\uD560"], ["horizontal", "\uC88C\uC6B0 \uBD84\uD560"]]) menu.addItem((i) => i.setTitle(name).setChecked(s.layout === layout).onClick(() => this.change((n) => {
      n.layout = layout;
    })));
    menu.showAtMouseEvent(e);
  }
  sortMenu(e, tree = false) {
    const menu = new import_obsidian7.Menu(), s = this.plugin.folders;
    for (const sort of tree ? ["manual", "name"] : Object.keys(sortNames)) menu.addItem((i) => i.setTitle(sortNames[sort]).setChecked((tree ? s.treeSort : s.sort) === sort).onClick(() => this.change((n) => {
      if (tree) n.treeSort = sort;
      else n.sort = sort;
    })));
    if (!tree) {
      menu.addSeparator();
      for (const [descending, name] of [[false, "\uC624\uB984\uCC28\uC21C"], [true, "\uB0B4\uB9BC\uCC28\uC21C"]]) menu.addItem((i) => i.setTitle(name).setChecked(s.descending === descending).setDisabled(s.sort === "manual").onClick(() => this.change((n) => {
        n.descending = descending;
      })));
    }
    menu.showAtMouseEvent(e);
  }
  emptyMenu(e, parent) {
    e.preventDefault();
    e.stopPropagation();
    const menu = new import_obsidian7.Menu();
    menu.addItem((i) => i.setTitle("\uC0C8 \uAC00\uC0C1 \uD3F4\uB354 \uB9CC\uB4E4\uAE30").setIcon("folder-plus").onClick(() => new NameModal(this.plugin, parent).open()));
    menu.addItem((i) => i.setTitle("\uC5F0\uACB0 \uD30C\uC77C \uCD94\uAC00").setIcon("link").onClick(() => {
      const main = this.plugin.mainFile;
      if (!main) {
        new import_obsidian7.Notice("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB97C \uBA3C\uC800 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.");
        return;
      }
      new FolderConnectionPicker(this.plugin, main, parent).open();
    }));
    menu.addItem((i) => i.setTitle("\uC0C8 \uB9C1\uD06C \uD30C\uC77C \uCD94\uAC00").setIcon("file-plus").onClick(() => {
      const main = this.plugin.mainFile;
      if (main) new NewLinkedNoteModal(this.plugin, main, parent).open();
    }));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle("\uBCF4\uAE30 \uD615\uC2DD\u2026").onClick(() => this.viewMenu(e)));
    menu.addItem((i) => i.setTitle("\uC815\uB82C \uAE30\uC900\u2026").onClick(() => this.sortMenu(e)));
    menu.showAtMouseEvent(e);
  }
  clearDrop() {
    this.root?.querySelectorAll(".mdp-folder-drop,.mdp-folder-forbidden,.mdp-folder-before").forEach((el) => el.classList.remove("mdp-folder-drop", "mdp-folder-forbidden", "mdp-folder-before"));
  }
  dropTarget(el, target, surface, item) {
    const proposal = (e) => {
      const s = this.plugin.folders, manual = (surface === "tree" ? s.treeSort : s.sort) === "manual";
      const edge = !!item && (!item.folder || e.clientY < el.getBoundingClientRect().top + Math.min(12, el.clientHeight * 0.2));
      const folder = edge ? item.parent : target;
      const before = edge && manual && !this.query ? item?.key : void 0;
      const same = this.drag?.keys.every((k) => parentOf(s, k) === folder);
      const valid = !!this.drag && this.drag.main === this.plugin.mainFile?.path && this.drag.keys.every((k) => this.entries.some((x) => x.key === k)) && canMove(s, this.drag.keys, folder) && !(same && (!manual || !!this.query && !!item));
      return { folder, before, valid };
    };
    el.ondragover = (e) => {
      if (!this.drag) return;
      e.preventDefault();
      e.stopPropagation();
      const p = proposal(e);
      this.clearDrop();
      el.classList.add(p.valid ? p.before ? "mdp-folder-before" : "mdp-folder-drop" : "mdp-folder-forbidden");
      if (e.dataTransfer) e.dataTransfer.dropEffect = p.valid ? "move" : "none";
    };
    el.ondragleave = (e) => {
      if (!el.contains(e.relatedTarget)) el.classList.remove("mdp-folder-drop", "mdp-folder-forbidden", "mdp-folder-before");
    };
    el.ondrop = (e) => {
      if (!this.drag) return;
      e.preventDefault();
      e.stopPropagation();
      const p = proposal(e), keys = this.drag.keys;
      this.drag = void 0;
      this.clearDrop();
      if (!p.valid) {
        new import_obsidian7.Notice("\uC774 \uC704\uCE58\uB85C \uC774\uB3D9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
        return;
      }
      this.change((s) => moveItems(s, keys, p.folder, p.before));
    };
  }
};

// src/metadata-view.ts
var import_obsidian8 = require("obsidian");

// src/metadata-model.ts
var metadataSections = [["footnotes", "\uAC01\uC8FC"], ["highlights", "Highlights"], ["tasks", "Tasks"], ["blocks", "Block Reference"], ["links", "Links"]];
var blank = (value) => value.replace(/[^\r\n]/g, " ");
function metadataMask(text, frontmatter = true) {
  let result = text;
  if (frontmatter) result = result.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)(?:\r?\n|$)/, blank);
  result = result.replace(/%%[\s\S]*?%%|<!--[\s\S]*?-->/g, blank);
  const lines = result.split("\n");
  let fence = "", length = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (m && m[1][0] === fence && m[1].length >= length && lines[i].slice(m[0].length).trim() === "") fence = "";
      lines[i] = blank(lines[i]);
    } else if (m) {
      fence = m[1][0];
      length = m[1].length;
      lines[i] = blank(lines[i]);
    }
  }
  result = lines.join("\n").replace(/(`+)([^`]|(?!\1)`)*?\1/g, blank);
  return result;
}
var escaped = (text, offset) => {
  let n = 0;
  while (offset > 0 && text[--offset] === "\\") n++;
  return n % 2 === 1;
};
function parseMetadata(text, blockRanges = []) {
  const out = { footnotes: [], highlights: [], tasks: [], blocks: [], links: [] };
  const masked = metadataMask(text);
  const lines = text.split("\n");
  const safeLines = masked.split("\n");
  const starts = [];
  let cursor = 0;
  for (const line of lines) {
    starts.push(cursor);
    cursor += line.length + 1;
  }
  const definitions = /* @__PURE__ */ new Map();
  const definitionRanges = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^ {0,3}\[\^([^\]]+)\]:/.test(safeLines[i])) continue;
    const m = lines[i].match(/^ {0,3}\[\^([^\]]+)\]:[ \t]*/);
    let last = i;
    while (last + 1 < lines.length && (/^(?: {4}|\t)\S|^(?: {4}|\t)\s*\S/.test(lines[last + 1]) || lines[last + 1].trim() === "" && /^(?: {4}|\t)\S/.test(lines[last + 2] ?? ""))) last++;
    const from = starts[i] + m[0].length, to = starts[last] + lines[last].replace(/\r$/, "").length;
    const content = text.slice(from, to).replace(/\r?\n(?: {4}|\t)/g, "\n");
    const item = { kind: "footnotes", id: m[1], offset: starts[i], end: to, from, to, prefix: lines.slice(i + 1, last + 1).find((l) => /^(?: {4}|\t)/.test(l))?.match(/^( {4}|\t)/)?.[1] ?? "    ", text: content };
    definitions.set(m[1], [...definitions.get(m[1]) ?? [], item]);
    definitionRanges.push([starts[i], to]);
    i = last;
  }
  for (const m of masked.matchAll(/\[\^([^\]\n]+)\]/g)) {
    const offset = m.index;
    if (escaped(text, offset) || definitionRanges.some(([from, to]) => offset >= from && offset < to)) continue;
    const defs = definitions.get(m[1]);
    if (!defs) continue;
    const start = text.lastIndexOf("\n", offset) + 1;
    const end = text.indexOf("\n", offset);
    out.footnotes.push({ ...defs[0], offset, context: text.slice(start, end < 0 ? text.length : end).replace(/\[\^[^\]]+\]/g, ""), duplicate: defs.length > 1 });
  }
  for (const m of masked.matchAll(/(?<![=])==(?=\S)([\s\S]*?\S)==(?![=])/g)) {
    if (!escaped(text, m.index) && !m[1].includes("\n\n")) out.highlights.push({ kind: "highlights", offset: m.index, end: m.index + m[0].length, text: text.slice(m.index + 2, m.index + m[0].length - 2) });
  }
  for (let i = 0; i < lines.length; i++) {
    const task = safeLines[i].match(/^\s*(?:>\s*)*(?:[-+*]|\d+[.)])\s+\[([ xX])\]\s+/);
    if (task) {
      const from = starts[i] + task[0].indexOf("[") + 1;
      out.tasks.push({ kind: "tasks", offset: starts[i], end: starts[i] + lines[i].length, text: lines[i].slice(task[0].length).trimEnd(), checked: task[1] !== " ", from, to: from + 1 });
    }
    const block = safeLines[i].match(/(?:^|\s)\^([A-Za-z0-9-]+)\s*\r?$/);
    if (block) {
      const offset = starts[i] + block.index + block[0].indexOf("^");
      const cached = blockRanges.find((r) => r.start <= offset && r.end >= offset);
      let first = i;
      if (lines[i].trim() === "^" + block[1]) {
        first--;
        while (first >= 0 && !lines[first].trim()) first--;
      }
      while (first > 0 && safeLines[first - 1].trim() && !/\^[A-Za-z0-9-]+\s*$/.test(safeLines[first - 1])) first--;
      const from = cached?.start ?? starts[Math.max(0, first)];
      out.blocks.push({ kind: "blocks", id: block[1], offset, end: starts[i] + lines[i].length, text: text.slice(from, offset).trim() });
    }
  }
  const blockCounts = /* @__PURE__ */ new Map();
  for (const item of out.blocks) blockCounts.set(item.id, (blockCounts.get(item.id) ?? 0) + 1);
  for (const item of out.blocks) item.duplicate = blockCounts.get(item.id) > 1;
  const linkText = metadataMask(text, false);
  const occupied = [];
  const add = (offset, length, target, label) => {
    if (escaped(text, offset)) return;
    occupied.push([offset, offset + length]);
    out.links.push({ kind: "links", offset, end: offset + length, target: target.trim(), text: label.trim() || target.trim() });
  };
  for (const m of linkText.matchAll(/!?\[\[([^\]\n]+)\]\]/g)) {
    const [target, ...label] = m[1].split("|");
    add(m.index, m[0].length, target, label.join("|"));
  }
  for (const m of linkText.matchAll(/!?\[([^\]\n]*)\]\(/g)) {
    const start = m.index;
    if (occupied.some(([a, b]) => start >= a && start < b)) continue;
    let end = start + m[0].length, depth = 1;
    for (; end < linkText.length && linkText[end] !== "\n"; end++) {
      if (escaped(text, end)) continue;
      if (linkText[end] === "(") depth++;
      if (linkText[end] === ")" && --depth === 0) break;
    }
    if (depth !== 0) continue;
    const raw = text.slice(start + m[0].length, end).trim();
    const target = raw.startsWith("<") ? raw.slice(1, raw.indexOf(">")) : raw.replace(/\s+["'][\s\S]*$/, "");
    if (target) add(start, end + 1 - start, target.replace(/\\([()])/g, "$1"), m[1]);
  }
  const refs = /* @__PURE__ */ new Map();
  for (const m of linkText.matchAll(/^ {0,3}\[([^\]^]+)\]:\s*<?(\S+?)>?(?:\s+["'][^\n]*|\s*)$/gm)) {
    refs.set(m[1].toLowerCase(), m[2]);
    occupied.push([m.index, m.index + m[0].length]);
  }
  for (const m of linkText.matchAll(/!?\[([^\]\n^]+)\](?:\[([^\]\n]*)\])?/g)) {
    if (occupied.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const target = refs.get((m[2] || m[1]).toLowerCase());
    if (target) add(m.index, m[0].length, target, m[1]);
  }
  for (const m of linkText.matchAll(/https?:\/\/[^\s<>"'\]]+/gi)) {
    if (occupied.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const target = m[0].replace(/[.,;!?]+$/, "");
    add(m.index, target.length, target, target);
  }
  out.links.sort((a, b) => a.offset - b.offset);
  return out;
}
function footnoteReplacement(item, value, source) {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  return value.replace(/\r\n/g, "\n").split("\n").join(newline + (item.prefix ?? "    "));
}

// src/metadata-view.ts
var MetadataView = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  host;
  list;
  input;
  file;
  source = "";
  result;
  serial = 0;
  query = "";
  filter = "all";
  searchCollapsed = /* @__PURE__ */ new Set();
  draft = false;
  pending = false;
  limits = {};
  isMounted() {
    return !!this.host?.isConnected;
  }
  destroy() {
    this.serial++;
    this.host = void 0;
    this.list = void 0;
    this.file = void 0;
    this.result = void 0;
    this.draft = false;
  }
  render(host) {
    this.destroy();
    this.host = host;
    host.className = "mdp-metadata";
    const search = host.createDiv({ cls: "mdp-metadata-search" });
    (0, import_obsidian8.setIcon)(search.createSpan(), "search");
    this.input = search.createEl("input", { type: "search", placeholder: "\uBA54\uD0C0\uB370\uC774\uD130 \uAC80\uC0C9\u2026", attr: { "aria-label": "\uBA54\uD0C0\uB370\uC774\uD130 \uC804\uCCB4 \uAC80\uC0C9" } });
    this.input.value = this.query;
    this.input.addEventListener("input", () => {
      if (this.draft) this.draft = false;
      this.query = this.input.value;
      this.searchCollapsed.clear();
      this.limits = {};
      this.draw();
    });
    this.list = host.createDiv({ cls: "mdp-metadata-sections" });
    void this.refresh();
  }
  async refresh() {
    const file = this.plugin.mainFile;
    if (!this.host || !file) return;
    const serial = ++this.serial;
    try {
      const text = await this.plugin.mainText(file);
      if (serial !== this.serial || this.plugin.mainFile !== file || !this.host) return;
      if (this.file === file && this.draft) return;
      if (this.file === file && this.source === text && this.result) return;
      if (this.file !== file) {
        this.draft = false;
        this.limits = {};
        this.searchCollapsed.clear();
      }
      this.file = file;
      this.source = text;
      this.result = parseMetadata(text);
      const seen = /* @__PURE__ */ new Set();
      this.result.links = this.result.links.filter((item) => {
        const target = this.resolve(item);
        if (!target.url) return false;
        const key = target.url;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      this.draw();
    } catch (error) {
      if (serial === this.serial) new import_obsidian8.Notice(`\uBA54\uD0C0\uB370\uC774\uD130\uB97C \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ${String(error)}`);
    }
  }
  resolve(item) {
    let target = item.target ?? "";
    try {
      target = decodeURI(target);
    } catch {
    }
    if (/^https?:\/\//i.test(target)) {
      try {
        return { url: new URL(item.target).href, subpath: "" };
      } catch {
        return { subpath: "" };
      }
    }
    const hash = target.indexOf("#"), path = hash < 0 ? target : target.slice(0, hash), subpath = hash < 0 ? "" : target.slice(hash);
    const file = path ? this.plugin.app.metadataCache.getFirstLinkpathDest(path, this.file.path) : this.file;
    return { file: file ?? void 0, subpath };
  }
  draw() {
    if (!this.list || !this.result || !this.file) return;
    const scroll = this.host?.closest(".view-content")?.scrollTop ?? 0;
    this.list.empty();
    const query = this.query.trim().toLocaleLowerCase();
    for (const [kind, label] of metadataSections) {
      const all = this.result[kind];
      const items = all.filter((item) => (!query || [item.text, item.context, item.id, item.target].join(" ").toLocaleLowerCase().includes(query)) && (kind !== "tasks" || this.filter === "all" || item.checked === (this.filter === "done")));
      const section = this.list.createEl("section", { cls: "mdp-metadata-section", attr: { "data-kind": kind } });
      const collapsed = query ? this.searchCollapsed.has(kind) : this.plugin.metadataCollapsed.includes(kind);
      const toggle = section.createEl("button", { cls: "mdp-metadata-toggle", attr: { "aria-expanded": String(!collapsed) } });
      toggle.createSpan({ text: label });
      toggle.createSpan({ text: String(items.length), cls: "mdp-muted mdp-metadata-count" });
      (0, import_obsidian8.setIcon)(toggle.createSpan({ cls: "mdp-metadata-chevron" }), collapsed ? "chevron-right" : "chevron-down");
      const body = section.createDiv({ cls: "mdp-metadata-body" });
      body.hidden = collapsed;
      toggle.onclick = () => {
        const next = !body.hidden;
        body.hidden = next;
        toggle.setAttribute("aria-expanded", String(!next));
        (0, import_obsidian8.setIcon)(toggle.querySelector(".mdp-metadata-chevron"), next ? "chevron-right" : "chevron-down");
        if (query) {
          if (next) this.searchCollapsed.add(kind);
          else this.searchCollapsed.delete(kind);
        } else {
          this.plugin.metadataCollapsed = this.plugin.metadataCollapsed.filter((k) => k !== kind);
          if (next) this.plugin.metadataCollapsed.push(kind);
          this.plugin.saveMetadata();
        }
      };
      if (kind === "tasks") {
        const filters = body.createDiv({ cls: "mdp-tabs mdp-task-filters" });
        for (const [value, title] of [["all", "\uC804\uCCB4"], ["todo", "\uBBF8\uC644\uB8CC"], ["done", "\uC644\uB8CC"]]) {
          const count = all.filter((i) => (!query || i.text.toLocaleLowerCase().includes(query)) && (value === "all" || i.checked === (value === "done"))).length;
          const button = filters.createEl("button", { text: `${title} (${count})`, cls: this.filter === value ? "is-selected" : "", attr: { "aria-pressed": String(this.filter === value) } });
          button.onclick = () => {
            this.filter = value;
            this.draft = false;
            this.draw();
          };
        }
      }
      if (!items.length) body.createDiv({ text: query ? "\uAC80\uC0C9 \uACB0\uACFC \uC5C6\uC74C" : "\uD56D\uBAA9 \uC5C6\uC74C", cls: "mdp-muted mdp-metadata-empty" });
      const limit = this.limits[kind] ?? 100;
      for (const item of items.slice(0, limit)) this.item(body, item);
      if (items.length > limit) {
        const more = body.createEl("button", { text: `\uB354 \uBCF4\uAE30 (${items.length - limit}\uAC1C)`, cls: "mdp-metadata-more" });
        more.onclick = () => {
          this.limits[kind] = limit + 100;
          this.draft = false;
          this.draw();
        };
      }
    }
    const scroller = this.host?.closest(".view-content");
    if (scroller) scroller.scrollTop = scroll;
  }
  item(parent, item) {
    const file = this.file, original = this.source;
    const row = parent.createDiv({ cls: `mdp-metadata-item mdp-meta-${item.kind}${item.checked ? " is-complete" : ""}` });
    if (item.kind !== "tasks") {
      row.draggable = true;
      row.title = "\uB04C\uC5B4\uC11C Main/Sub \uBB38\uC11C \uB610\uB294 Sub Canvas\uC5D0 \uCD94\uAC00";
      row.ondragstart = (event) => {
        if (event.target.closest("textarea,input,.mdp-footnote-edit,.mdp-footnote-actions") || item.kind === "footnotes" && this.draft) {
          event.preventDefault();
          return;
        }
        this.plugin.reuseDrag.startMetadata(event, file, original, item);
      };
    }
    const go = () => this.plugin.run(() => this.plugin.navigateMain(file, item.offset));
    if (item.kind === "tasks") {
      const checkbox = row.createEl("input", { type: "checkbox", attr: { "aria-label": `${item.text} \uC644\uB8CC` } });
      checkbox.checked = !!item.checked;
      checkbox.onchange = () => {
        if (this.pending) {
          checkbox.checked = !!item.checked;
          return;
        }
        this.pending = true;
        checkbox.disabled = true;
        void this.plugin.patchMain(file, original, item.from, item.to, checkbox.checked ? "x" : " ").catch((error) => {
          checkbox.checked = !!item.checked;
          new import_obsidian8.Notice(String(error.message ?? error));
        }).finally(() => {
          this.pending = false;
          checkbox.disabled = false;
          void this.refresh();
        });
      };
    }
    const content = row.createDiv({ cls: "mdp-metadata-content" });
    if (item.kind === "links") {
      const target = this.resolve(item);
      const button = content.createEl("button", { cls: "mdp-metadata-text", text: item.text });
      content.createDiv({ cls: "mdp-muted mdp-metadata-source", text: target.url ? "\uC6F9 \uB9C1\uD06C" : target.file ? target.file.extension.toUpperCase() : "\uB300\uC0C1 \uD30C\uC77C \uC5C6\uC74C" });
      button.onclick = (event) => {
        if (this.plugin.mainFile !== file) return;
        if (target.url) {
          const menu = new import_obsidian8.Menu();
          menu.addItem((i) => i.setTitle("\uC635\uC2DC\uB514\uC5B8 \uC6F9\uBDF0\uC5B4\uB85C \uC5F4\uAE30").setIcon("globe").onClick(() => this.plugin.run(() => this.plugin.openMetadataWeb(target.url, false))));
          menu.addItem((i) => i.setTitle("\uAE30\uBCF8 \uBE0C\uB77C\uC6B0\uC800\uB85C \uC5F4\uAE30").setIcon("external-link").onClick(() => this.plugin.run(() => this.plugin.openMetadataWeb(target.url, true))));
          menu.showAtMouseEvent(event);
        } else if (target.file) this.plugin.run(() => this.plugin.openMetadataFile(target.file, target.subpath));
        else new import_obsidian8.Notice("\uB300\uC0C1 \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC6D0\uB798 \uB9C1\uD06C\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.");
      };
      return;
    }
    if (item.id) {
      const line = content.createDiv({ cls: "mdp-metadata-id" });
      line.createEl("code", { text: item.kind === "blocks" ? "^" + item.id : "[^" + item.id + "]" });
      if (item.duplicate) line.createSpan({ text: "\uC911\uBCF5 ID", cls: "mdp-metadata-duplicate" });
    }
    if (item.context) {
      const context = content.createEl("button", { text: item.context, cls: "mdp-metadata-text mdp-footnote-context" });
      context.onclick = go;
      content.createDiv({ text: "\uBCF8\uBB38 \uBB38\uB9E5", cls: "mdp-muted mdp-metadata-source" });
    }
    const text = content.createEl("button", { cls: "mdp-metadata-text", text: item.text });
    text.onclick = go;
    if (item.kind === "highlights") content.createDiv({ cls: "mdp-muted mdp-metadata-source", text: `${file.name} \xB7 ${original.slice(0, item.offset).split("\n").length}\uBC88\uC9F8 \uC904` });
    if (item.kind === "footnotes") {
      const edit = content.createEl("button", { text: "\uD3B8\uC9D1", cls: "mdp-footnote-edit" });
      edit.disabled = !!item.duplicate;
      edit.onclick = () => {
        if (this.draft) {
          new import_obsidian8.Notice("\uD3B8\uC9D1 \uC911\uC778 \uAC01\uC8FC\uB97C \uBA3C\uC800 \uC800\uC7A5\uD558\uAC70\uB098 \uCDE8\uC18C\uD574\uC8FC\uC138\uC694.");
          return;
        }
        this.draft = true;
        text.hidden = true;
        edit.hidden = true;
        const input = content.createEl("textarea", { cls: "mdp-footnote-input", attr: { "aria-label": "\uAC01\uC8FC \uB0B4\uC6A9" } });
        input.value = item.text;
        const actions = content.createDiv({ cls: "mdp-footnote-actions" });
        const save = actions.createEl("button", { text: "\uC800\uC7A5", cls: "mod-cta" });
        const cancel = actions.createEl("button", { text: "\uCDE8\uC18C" });
        const done = () => {
          this.draft = false;
          this.result = void 0;
          void this.refresh();
        };
        cancel.onclick = done;
        save.onclick = () => {
          save.disabled = true;
          cancel.disabled = true;
          void this.plugin.patchMain(file, original, item.from, item.to, footnoteReplacement(item, input.value, original)).then(done).catch((error) => {
            new import_obsidian8.Notice(String(error.message ?? error));
            done();
          });
        };
        input.focus();
      };
    }
  }
};

// src/sidebar.ts
var VIEW_TYPE = "md-palette-sidebar";
var PaletteView = class extends import_obsidian9.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.cards = new CardView(plugin);
    this.connections = new ConnectionsView(plugin, leaf);
    this.folders = new FolderView(plugin);
    this.metadata = new MetadataView(plugin);
  }
  cards;
  connections;
  folders;
  metadata;
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "MD Palette";
  }
  getIcon() {
    return "panels-top-left";
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
    this.cards.destroy();
    this.connections.destroy();
    this.folders.destroy();
    this.metadata.destroy();
  }
  render() {
    if (this.plugin.topView === "metadata" && this.plugin.mainFile && this.metadata.isMounted()) {
      const context2 = this.contentEl.querySelector(".mdp-main-context span:last-child");
      if (context2) context2.textContent = `Main \xB7 ${this.plugin.mainFile.name}`;
      void this.metadata.refresh();
      return;
    }
    this.metadata.destroy();
    if (this.plugin.topView === "link" && this.plugin.linkView === "connections" && this.connections.isCurrent()) return;
    this.cards.destroy();
    this.folders.destroy();
    this.connections.prepareRender();
    if (!(this.plugin.mainFile && this.plugin.topView === "link" && this.plugin.linkView === "connections")) this.connections.destroy();
    const root = this.contentEl;
    root.empty();
    root.addClass("mdp-sidebar");
    const heading = root.createDiv({ cls: "mdp-heading" });
    (0, import_obsidian9.setIcon)(heading.createSpan({ cls: "mdp-heading-icon" }), "panels-top-left");
    heading.createSpan({ text: "MD Palette" });
    const context = root.createDiv({ cls: "mdp-main-context" });
    (0, import_obsidian9.setIcon)(context.createSpan(), "book-open");
    context.createSpan({ text: this.plugin.mainFile ? `Main \xB7 ${this.plugin.mainFile.name}` : "Main \uC5C6\uC74C" });
    const top = root.createDiv({ cls: "mdp-tabs", attr: { role: "tablist", "aria-label": "MD Palette \uBCF4\uAE30" } });
    for (const [value, title] of [["link", "Link View"], ["metadata", "Metadata View"]]) {
      this.tab(top, title, this.plugin.topView === value, () => this.plugin.selectView(value));
    }
    if (this.plugin.topView === "link") {
      const tabs = root.createDiv({ cls: "mdp-tabs mdp-link-tabs", attr: { role: "tablist", "aria-label": "Link View \uD615\uC2DD" } });
      for (const [value, title] of [["card", "Card"], ["connections", "Connections"], ["folder", "Folder"]]) {
        this.tab(tabs, title, this.plugin.linkView === value, () => this.plugin.selectView("link", value));
      }
    }
    const body = root.createDiv({ cls: "mdp-empty", attr: { role: "tabpanel" } });
    if (!this.plugin.mainGroup) {
      (0, import_obsidian9.setIcon)(body.createDiv({ cls: "mdp-empty-icon" }), "book-open");
      body.createEl("p", { text: "\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB97C \uBA3C\uC800 \uC9C0\uC815\uD574\uC8FC\uC138\uC694." });
      body.createEl("p", { text: "Markdown \uD0ED \uC81C\uBAA9\uC744 \uC6B0\uD074\uB9AD\uD55C \uB4A4 \u201C\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB85C \uC9C0\uC815\u201D\uC744 \uC120\uD0DD\uD558\uC138\uC694.", cls: "mdp-muted" });
    } else if (!this.plugin.mainFile) {
      body.createEl("p", { text: "\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uC5D0\uC11C\uB294 Markdown \uD30C\uC77C\uC744 \uD65C\uC131\uD654\uD574\uC8FC\uC138\uC694." });
    } else if (this.plugin.topView === "link" && this.plugin.linkView === "card") {
      this.cards.render(body);
    } else if (this.plugin.topView === "link" && this.plugin.linkView === "connections") {
      this.connections.render(body);
    } else if (this.plugin.topView === "link" && this.plugin.linkView === "folder") {
      this.folders.render(body);
    } else {
      this.metadata.render(body);
    }
  }
  tab(root, title, selected, onClick) {
    const button = root.createEl("button", { text: title, cls: selected ? "mdp-tab is-selected" : "mdp-tab", attr: { role: "tab", "aria-selected": String(selected) } });
    button.addEventListener("click", onClick);
  }
};

// src/state.ts
function readSpaces(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value;
  const result = {};
  for (const key of ["main", "sub"]) {
    const item = raw[key];
    if (item && typeof item.groupId === "string" && (typeof item.activeFile === "string" || item.activeFile === null)) result[key] = { groupId: item.groupId, activeFile: item.activeFile, ...typeof item.leafId === "string" ? { leafId: item.leafId } : {} };
  }
  if (Array.isArray(raw.subs)) {
    const seen = /* @__PURE__ */ new Set();
    result.subs = raw.subs.flatMap((item) => {
      if (!item || typeof item.groupId !== "string" || typeof item.activeFile !== "string" && item.activeFile !== null || seen.has(item.groupId) || item.groupId === result.main?.groupId) return [];
      seen.add(item.groupId);
      return [{ groupId: item.groupId, activeFile: item.activeFile }];
    });
  }
  return result;
}
function subOpenMode(event) {
  return event && (event.ctrlKey || event.metaKey) ? event.shiftKey ? "group" : "tab" : "replace";
}

// src/reuse-drag.ts
var import_obsidian10 = require("obsidian");

// src/reuse-model.ts
function canReuse(kind, destination) {
  return kind === "file" ? destination === "main-markdown" || destination === "sub-markdown" : destination !== "unsupported";
}
function reuseOptions(kind, markdownFile, canvas) {
  if (kind === "footnote") return [{ mode: "text", title: canvas ? "\uD14D\uC2A4\uD2B8 \uCE74\uB4DC \uB9CC\uB4E4\uAE30" : "\uD14D\uC2A4\uD2B8\uB85C \uC0BD\uC785" }, { mode: "footnote", title: canvas ? "\uAC01\uC8FC \uCE74\uB4DC \uB9CC\uB4E4\uAE30" : "\uC2E4\uC81C \uAC01\uC8FC\uB85C \uCD94\uAC00" }];
  if (kind === "url") return [{ mode: "address", title: canvas ? "\uC8FC\uC18C \uD14D\uC2A4\uD2B8 \uCE74\uB4DC \uB9CC\uB4E4\uAE30" : "\uC8FC\uC18C \uADF8\uB300\uB85C \uC0BD\uC785" }, { mode: "named-url", title: canvas ? "\uC81C\uBAA9 \uB9C1\uD06C \uCE74\uB4DC \uB9CC\uB4E4\uAE30" : "\uC81C\uBAA9\uC774 \uC788\uB294 \uB9C1\uD06C \uC0BD\uC785" }];
  if (kind === "file") return [{ mode: "link", title: "\uB9C1\uD06C \uC0BD\uC785" }, { mode: "embed", title: "\uC784\uBCA0\uB4DC \uC0BD\uC785" }, ...markdownFile ? [{ mode: "body", title: "\uBCF8\uBB38 Markdown \uC0BD\uC785" }] : []];
  if (kind === "highlight") return [{ mode: "text", title: canvas ? "\uD14D\uC2A4\uD2B8 \uCE74\uB4DC \uB9CC\uB4E4\uAE30" : "\uD14D\uC2A4\uD2B8 \uC0BD\uC785" }, { mode: "source", title: canvas ? "\uCD9C\uCC98 \uB9C1\uD06C \uD3EC\uD568 \uCE74\uB4DC \uB9CC\uB4E4\uAE30" : "\uCD9C\uCC98 \uB9C1\uD06C \uD3EC\uD568 \uC0BD\uC785" }];
  return canvas ? [{ mode: "text", title: "\uBE14\uB85D \uB0B4\uC6A9 \uCE74\uB4DC \uB9CC\uB4E4\uAE30" }, { mode: "link", title: "\uBE14\uB85D \uB9C1\uD06C \uCE74\uB4DC \uB9CC\uB4E4\uAE30" }] : [{ mode: "link", title: "\uBE14\uB85D \uB9C1\uD06C \uC0BD\uC785" }, { mode: "embed", title: "\uBE14\uB85D \uC784\uBCA0\uB4DC \uC0BD\uC785" }];
}
function webReuseText(raw, title, named) {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) throw Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC6F9 \uC8FC\uC18C\uC785\uB2C8\uB2E4.");
  if (!named) return url.href;
  const label = (title.trim() || url.href).replace(/[\r\n]+/g, " ").replace(/[\\\[\]]/g, "\\$&");
  const href = url.href.replace(/[<>\\]/g, (c) => encodeURIComponent(c));
  return `[${label}](<${href}>)`;
}
function footnoteInsertion(original, offset, content) {
  if (offset < 0 || offset > original.length) throw Error("\uAC01\uC8FC \uC0BD\uC785 \uC704\uCE58\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  const used = new Set([...original.matchAll(/\[\^([^\]\r\n]+)\]/g)].map((m) => m[1]));
  let n = 1;
  while (used.has(`mdp-${n}`)) n++;
  const id = `mdp-${n}`, marker = `[^${id}]`;
  const body = content.replace(/\r\n?/g, "\n").split("\n").map((line, index) => index ? "    " + line : line).join("\n");
  const suffix = `

[^${id}]: ${body}
`;
  const changes = offset === original.length ? [{ offset, text: marker + suffix }] : [{ offset, text: marker }, { offset: original.length, text: suffix }];
  return { changes, value: original.slice(0, offset) + marker + original.slice(offset) + suffix };
}
function reuseText(mode, link, content) {
  content = content.replace(/\r\n?/g, "\n");
  if (mode === "link") return link;
  if (mode === "embed") return "!" + link;
  if (mode === "source") return content + "\n\n\uCD9C\uCC98: " + link;
  return content;
}
function sameCanvasData(a, b) {
  const stable = (value, key = "") => Array.isArray(value) ? (key === "nodes" || key === "edges" ? [...value].sort((a2, b2) => String(a2.id).localeCompare(String(b2.id))) : value).map((v) => stable(v)) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a2], [b2]) => a2.localeCompare(b2)).map(([key2, v]) => [key2, stable(v, key2)])) : value;
  try {
    return JSON.stringify(stable(JSON.parse(a))) === JSON.stringify(stable(JSON.parse(b)));
  } catch {
    return false;
  }
}

// src/reuse-drag.ts
var MIME = "application/x-md-palette-reuse";
var ReuseDrag = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.bind(document);
    const bindLeaves = () => plugin.app.workspace.iterateAllLeaves((leaf) => {
      this.bind(leaf.view.containerEl.ownerDocument);
    });
    bindLeaves();
    plugin.registerEvent(plugin.app.workspace.on("layout-change", bindLeaves));
    plugin.registerEvent(plugin.app.workspace.on("window-open", (_workspace, win) => this.bind(win.document)));
  }
  source;
  menu;
  stopped = false;
  pending = false;
  highlight;
  caret;
  markedTarget;
  documents = /* @__PURE__ */ new Set();
  cleanup = [];
  destroy() {
    this.stopped = true;
    this.source = void 0;
    this.menu?.hide();
    this.clearHighlight();
    for (const clean of this.cleanup) clean();
    this.documents.clear();
  }
  startFile(event, file) {
    this.start(event, "file", file);
  }
  startMetadata(event, file, original, item) {
    if (item.kind === "tasks") return;
    const kinds = { highlights: "highlight", blocks: "block", footnotes: "footnote", links: "url" };
    this.start(event, kinds[item.kind], file, original, item);
  }
  start(event, kind, file, original, item) {
    this.menu?.hide();
    this.source = void 0;
    const main = this.plugin.mainLeaf, mainFile = this.plugin.mainFile;
    if (!event.dataTransfer || !main || !mainFile || this.pending) return;
    this.source = { token: crypto.randomUUID(), kind, file, path: file.path, main, mainFile, original, item: item ? { ...item } : void 0 };
    event.dataTransfer.setData(MIME, this.source.token);
    event.dataTransfer.effectAllowed = kind === "file" ? "copyMove" : "copy";
  }
  bind(doc) {
    if (this.documents.has(doc)) return;
    this.documents.add(doc);
    const drag = (event) => this.handle(event);
    const clear = () => {
      this.source = void 0;
      if (!this.menu) this.clearHighlight();
    };
    const leave = (event) => {
      if (!event.relatedTarget) this.clearHighlight();
    };
    const escape = (event) => {
      if (event.key === "Escape") {
        clear();
        this.menu?.hide();
      }
    };
    const reposition = () => {
      const target = this.markedTarget;
      if (target) {
        this.clearHighlight();
        this.showTarget(target);
      }
    };
    doc.addEventListener("scroll", reposition, true);
    doc.defaultView?.addEventListener("resize", reposition);
    doc.addEventListener("dragover", drag, true);
    doc.addEventListener("drop", drag, true);
    doc.addEventListener("dragend", clear, true);
    doc.addEventListener("dragleave", leave, true);
    doc.addEventListener("keydown", escape, true);
    this.cleanup.push(() => {
      doc.removeEventListener("dragover", drag, true);
      doc.removeEventListener("drop", drag, true);
      doc.removeEventListener("dragend", clear, true);
      doc.removeEventListener("dragleave", leave, true);
      doc.removeEventListener("keydown", escape, true);
    });
    this.cleanup.push(() => {
      doc.removeEventListener("scroll", reposition, true);
      doc.defaultView?.removeEventListener("resize", reposition);
    });
  }
  clearHighlight() {
    this.highlight?.classList.remove("mdp-reuse-target");
    this.highlight = void 0;
    this.caret?.remove();
    this.caret = void 0;
    this.markedTarget = void 0;
  }
  showTarget(target) {
    this.markedTarget = target;
    this.highlight = target.canvas?.wrapperEl ?? target.leaf.view.containerEl;
    this.highlight.classList.add("mdp-reuse-target");
    if (!target.editor || target.offset === void 0) return;
    const rect = target.editor.cm?.coordsAtPos(target.offset);
    if (!rect) return;
    const viewport = target.leaf.view.containerEl.querySelector(".cm-scroller")?.getBoundingClientRect();
    if (viewport && (rect.top < viewport.top || rect.bottom > viewport.bottom || rect.left < viewport.left || rect.left > viewport.right)) return;
    const doc = target.leaf.view.containerEl.ownerDocument;
    this.caret = doc.createElement("div");
    this.caret.className = "mdp-reuse-caret";
    this.caret.setAttribute("aria-hidden", "true");
    Object.assign(this.caret.style, { left: `${rect.left}px`, top: `${rect.top}px`, height: `${rect.bottom - rect.top}px` });
    doc.body.appendChild(this.caret);
  }
  destination(leaf) {
    if (!this.plugin.mainFile) return "unsupported";
    if (leaf.view instanceof import_obsidian10.MarkdownView && leaf.view.getMode() === "source") {
      if (leaf === this.plugin.mainLeaf) return "main-markdown";
      if (this.plugin.isSub(groupOf(leaf))) return "sub-markdown";
    }
    if (leaf.getViewState().type === "canvas" && this.plugin.isSub(groupOf(leaf))) return "sub-canvas";
    return "unsupported";
  }
  target(event, source) {
    let leaf;
    const path = event.composedPath();
    this.plugin.app.workspace.iterateAllLeaves((candidate) => {
      if (path.includes(candidate.view.containerEl)) leaf = candidate;
    });
    if (!leaf) return null;
    const destination = this.destination(leaf);
    if (!canReuse(source.kind, destination)) return null;
    if (leaf.view instanceof import_obsidian10.MarkdownView) {
      if (!path.some((el) => el?.classList?.contains("cm-content"))) return null;
      const editor = leaf.view.editor, pos = editor.posAtMouse?.(event);
      if (!pos || !leaf.view.file) return null;
      return { leaf, destination, file: leaf.view.file, path: leaf.view.file.path, editor, offset: editor.posToOffset(pos), original: editor.getValue() };
    }
    const view = leaf.view, canvas = view.canvas;
    if (!view.file || !canvas || !path.includes(canvas.wrapperEl) || typeof canvas.posFromEvt !== "function" || typeof canvas.createTextNode !== "function" || typeof canvas.removeNode !== "function" || typeof view.save !== "function") return null;
    const point = canvas.posFromEvt(event);
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    return { leaf, destination, file: view.file, path: view.file.path, canvas, point, original: JSON.stringify(canvas.getData()) };
  }
  handle(event) {
    if (!event.dataTransfer?.types.includes(MIME)) return;
    if (event.composedPath().some((el) => el?.classList?.contains("mdp-card-grid"))) {
      this.clearHighlight();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    this.clearHighlight();
    const source = this.source;
    const target = source && !this.pending ? this.target(event, source) : null;
    event.dataTransfer.dropEffect = target ? "copy" : "none";
    if (event.type === "dragover") {
      if (target) this.showTarget(target);
      return;
    }
    this.source = void 0;
    if (!source || event.dataTransfer.getData(MIME) !== source.token) return;
    if (!target) {
      new import_obsidian10.Notice(source.kind === "file" ? "\uD30C\uC77C \uCE74\uB4DC \uD55C \uAC1C\uB97C Main/Sub \uBB38\uC11C\uC758 \uD3B8\uC9D1 \uC601\uC5ED\uC5D0 \uB193\uC544\uC8FC\uC138\uC694." : "Main/Sub \uBB38\uC11C\uC758 \uD3B8\uC9D1 \uC601\uC5ED \uB610\uB294 Sub Canvas\uC5D0 \uB193\uC544\uC8FC\uC138\uC694.");
      return;
    }
    const menu = new import_obsidian10.Menu();
    this.menu?.hide();
    this.menu = menu;
    this.showTarget(target);
    menu.onHide(() => {
      if (this.menu === menu) {
        this.menu = void 0;
        this.clearHighlight();
      }
    });
    for (const option of reuseOptions(source.kind, source.file.extension === "md", !!target.canvas)) {
      menu.addItem((item) => item.setTitle(option.title).setIcon(option.mode === "link" || option.mode === "source" ? "link" : "file-text").onClick(() => {
        if (this.pending || this.stopped) return;
        this.pending = true;
        void this.commit(source, target, option.mode).catch((error) => {
          new import_obsidian10.Notice(String(error.message ?? error));
        }).finally(() => {
          this.pending = false;
        });
      }));
    }
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("\uCDE8\uC18C").setIcon("x").onClick(() => {
    }));
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
  valid(source, target) {
    const app = this.plugin.app;
    return !this.stopped && this.plugin.mainLeaf === source.main && this.plugin.mainFile === source.mainFile && app.vault.getAbstractFileByPath(source.path) === source.file && source.file.path === source.path && app.vault.getAbstractFileByPath(target.path) === target.file && target.file.path === target.path && this.destination(target.leaf) === target.destination && target.leaf.view.file === target.file && target.leaf.view.containerEl.isConnected;
  }
  async fileText(file) {
    let value;
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof import_obsidian10.MarkdownView && leaf.view.file === file) value = leaf.view.editor.getValue();
    });
    return value ?? this.plugin.app.vault.read(file);
  }
  async commit(source, target, mode) {
    const app = this.plugin.app;
    if (!this.valid(source, target)) throw Error("\uBB38\uC11C \uB610\uB294 Space\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB04C\uC5B4 \uB193\uC544\uC8FC\uC138\uC694.");
    let content = source.item?.text ?? "";
    if (source.original !== void 0 && await this.fileText(source.file) !== source.original) throw Error("\uC6D0\uBB38\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uD56D\uBAA9\uC744 \uB2E4\uC2DC \uB04C\uC5B4 \uB193\uC544\uC8FC\uC138\uC694.");
    if (mode === "body") content = bodyOnly(await this.fileText(source.file));
    const link = app.fileManager.generateMarkdownLink(source.file, target.file.path, source.kind === "block" ? "#^" + source.item.id : void 0);
    const text = source.kind === "url" ? webReuseText(source.item.target, source.item.text, mode === "named-url") : mode === "footnote" && target.canvas ? footnoteInsertion("", 0, content).value : reuseText(mode, link, content);
    if (!text) throw Error("\uC0BD\uC785\uD560 \uBCF8\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const disk = await app.vault.read(target.file);
    if (!this.valid(source, target)) throw Error("\uBB38\uC11C \uB610\uB294 Space\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB04C\uC5B4 \uB193\uC544\uC8FC\uC138\uC694.");
    if (source.original !== void 0 && source.main.view.editor.getValue() !== source.original) throw Error("\uC6D0\uBB38\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uD56D\uBAA9\uC744 \uB2E4\uC2DC \uB04C\uC5B4 \uB193\uC544\uC8FC\uC138\uC694.");
    if (target.editor) {
      const view = target.leaf.view, editor = target.editor;
      if (view.editor !== editor || editor.getValue() !== target.original) throw Error("\uC0BD\uC785 \uB300\uC0C1\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB04C\uC5B4 \uB193\uC544\uC8FC\uC138\uC694.");
      if (disk.replace(/\r\n/g, "\n") !== target.original.replace(/\r\n/g, "\n")) throw Error("\uBB38\uC11C \uC800\uC7A5\uC774 \uB05D\uB09C \uB4A4 \uB2E4\uC2DC \uB04C\uC5B4 \uB193\uC544\uC8FC\uC138\uC694.");
      const insertion = mode === "footnote" ? footnoteInsertion(target.original, target.offset, content) : { changes: [{ offset: target.offset, text }], value: target.original.slice(0, target.offset) + text + target.original.slice(target.offset) };
      const changed = insertion.value;
      editor.transaction({ changes: insertion.changes.map((change) => ({ from: editor.offsetToPos(change.offset), text: change.text })) }, "input.drop");
      try {
        await view.save();
      } catch (error) {
        if (editor.getValue() === changed) {
          editor.replaceRange(target.original, { line: 0, ch: 0 }, editor.offsetToPos(changed.length));
          await app.vault.process(target.file, (current) => current.replace(/\r\n/g, "\n") === changed.replace(/\r\n/g, "\n") ? disk : current);
        }
        throw Error("\uC0BD\uC785 \uB0B4\uC6A9\uC744 \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. " + String(error));
      }
    } else if (target.canvas) {
      const canvas = target.canvas, view = target.leaf.view;
      if (view.canvas !== canvas || JSON.stringify(canvas.getData()) !== target.original) throw Error("Canvas\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB04C\uC5B4 \uB193\uC544\uC8FC\uC138\uC694.");
      if (!sameCanvasData(disk, target.original)) throw Error("Canvas \uC800\uC7A5\uC774 \uB05D\uB09C \uB4A4 \uB2E4\uC2DC \uB04C\uC5B4 \uB193\uC544\uC8FC\uC138\uC694.");
      let node;
      try {
        node = canvas.createTextNode({ pos: target.point, size: { width: 300, height: 180 }, text, focus: false, save: false });
        canvas.requestSave();
        await view.save();
      } catch (error) {
        if (node) {
          canvas.removeNode(node);
          canvas.requestSave();
          await view.save();
        }
        throw Error("Canvas \uCE74\uB4DC\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. " + String(error));
      }
    }
  }
};

// src/new-note-name.ts
function newNoteName(input) {
  const name = input.trim().replace(/\.md$/i, "");
  if (!name || name === "." || name === "..") throw Error("\uD30C\uC77C \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
  if (/[\x00-\x1f<>:"/\\|?*#\[\]^]/.test(name) || /[. ]$/.test(name)) {
    throw Error("\uD30C\uC77C \uC774\uB984\uC5D0 \uACBD\uB85C \uAD6C\uBD84\uC790\uB098 \uB9C1\uD06C\uC5D0 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uBB38\uC790\uAC00 \uC788\uC2B5\uB2C8\uB2E4.");
  }
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) throw Error("\uC774 \uC774\uB984\uC740 \uD30C\uC77C \uC774\uB984\uC73C\uB85C \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  if (name.length > 180) throw Error("\uD30C\uC77C \uC774\uB984\uC740 180\uC790 \uC774\uB0B4\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
  return name + ".md";
}

// src/main.ts
var SpaceFilePicker = class extends import_obsidian11.FuzzySuggestModal {
  constructor(plugin, role) {
    super(plugin.app);
    this.plugin = plugin;
    this.role = role;
    this.setPlaceholder("Sub Space\uC5D0\uC11C \uC5F4 \uD30C\uC77C");
  }
  getItems() {
    return this.app.vault.getFiles();
  }
  getItemText(file) {
    return file.path;
  }
  onChooseItem(file) {
    this.plugin.run(() => this.plugin.openIn(this.role, file));
  }
};
var MDPalettePlugin = class extends import_obsidian11.Plugin {
  reuseDrag;
  mainGroup;
  mainLeaf;
  pinnedMain;
  metadataCollapsed = [];
  subGroup;
  subGroups = [];
  isSub(group) {
    return !!group && this.subGroups.includes(group);
  }
  openFileGesture(file, event) {
    this.run(() => this.openIn("sub", file, "", subOpenMode(event)));
  }
  topView = "link";
  linkView = "card";
  cards = readCards(null);
  connections = readConnections(null);
  foldersByMain = /* @__PURE__ */ Object.create(null);
  folderDefaults = readFolders(null);
  get folders() {
    const path = this.mainFile?.path;
    if (!path) return readFolders(this.folderDefaults);
    return this.foldersByMain[path] ??= readFolders(this.folderDefaults);
  }
  folderSaving = false;
  cardTimer;
  data = {};
  saveAllowed = true;
  saveChain = Promise.resolve();
  persistedJSON = "";
  saveTimer;
  syncTimer;
  busy = false;
  creatingNote = false;
  stopped = false;
  ready = false;
  invalidMainKey = "";
  lastRenderKey = "";
  lastContentKey = "";
  decorated = [];
  get mainFile() {
    return this.mainLeaf && this.pinnedMain && fileIn(this.app, this.mainLeaf) === this.pinnedMain && this.mainLeaf.getViewState().type === "markdown" ? this.pinnedMain : null;
  }
  async onload() {
    try {
      const loaded = await this.loadData();
      if (loaded != null && (typeof loaded !== "object" || Array.isArray(loaded))) throw Error("invalid data");
      this.data = loaded ?? {};
      this.persistedJSON = JSON.stringify(this.data);
    } catch {
      this.saveAllowed = false;
      new import_obsidian11.Notice("MD Palette \uC800\uC7A5 \uC0C1\uD0DC\uB97C \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uAE30\uC874 \uB370\uC774\uD130\uB294 \uB36E\uC5B4\uC4F0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    }
    if (this.data.topView === "metadata") this.topView = "metadata";
    if (this.data.linkView === "connections" || this.data.linkView === "folder") this.linkView = this.data.linkView;
    this.cards = readCards(this.data.cards);
    this.connections = readConnections(this.data.connections);
    this.metadataCollapsed = Array.isArray(this.data.metadataCollapsed) ? this.data.metadataCollapsed.filter((v) => typeof v === "string") : [];
    this.foldersByMain = readDocumentFolders(this.data.foldersByMain);
    const legacy = readFolders(this.data.folderDefaults ?? this.data.folders);
    this.folderDefaults = readFolders({ ...legacy, display: "compact", folders: [], positions: {}, order: [], current: "", collapsed: [] });
    delete this.data.folders;
    this.registerView(VIEW_TYPE, (leaf) => new PaletteView(leaf, this));
    this.registerHoverLinkSource("md-palette", { display: "MD Palette \uD30C\uC77C", defaultMod: true });
    this.routeMainLinks();
    this.reuseDrag = new ReuseDrag(this);
    this.register(() => this.reuseDrag.destroy());
    this.addRibbonIcon("panels-top-left", "MD Palette \uC5F4\uAE30", () => this.run(() => this.openSidebar()));
    this.addCommand({ id: "open-sidebar", name: "\uC0AC\uC774\uB4DC\uBC14 \uC5F4\uAE30", callback: () => this.run(() => this.openSidebar()) });
    this.addCommand({ id: "set-main", name: "\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4 \uC9C0\uC815/\uD574\uC81C", callback: () => this.run(() => this.toggleMain(this.app.workspace.getMostRecentLeaf())) });
    for (const role of ["sub"]) this.addCommand({ id: `open-${role}`, name: `Sub Space\uC5D0\uC11C \uD30C\uC77C \uC5F4\uAE30`, callback: () => {
      if (!this.mainFile) {
        new import_obsidian11.Notice("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB97C \uBA3C\uC800 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.");
        return;
      }
      new SpaceFilePicker(this, role).open();
    } });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file, source, leaf) => {
      if (!(file instanceof import_obsidian11.TFile)) return;
      if (source === "tab-header" && leaf) {
        if (file.extension === "md" && !this.isSub(groupOf(leaf)) && leaf !== this.mainLeaf) menu.addItem((item) => item.setTitle("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB85C \uC9C0\uC815").setIcon("book-open").onClick(() => this.run(() => this.setMain(leaf))));
        if (leaf === this.mainLeaf) menu.addItem((item) => item.setTitle("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4 \uC9C0\uC815 \uD574\uC81C").setIcon("book-open").onClick(() => this.run(() => this.unsetMain())));
      }
      if (this.mainFile) {
        menu.addSeparator();
        menu.addItem((item) => item.setTitle("Sub Space\uC5D0\uC11C \uC5F4\uAE30").setIcon("link").onClick(() => this.run(() => this.openIn("sub", file))));
      }
    }));
    const schedule = () => this.scheduleSync();
    this.registerEvent(this.app.workspace.on("layout-change", schedule));
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      const group = groupOf(leaf);
      if (this.isSub(group)) {
        this.subGroup = group;
        this.persist();
      }
      schedule();
    }));
    this.registerEvent(this.app.workspace.on("file-open", schedule));
    this.registerEvent(this.app.vault.on("rename", schedule));
    this.registerEvent(this.app.vault.on("delete", schedule));
    const refreshCards = () => {
      window.clearTimeout(this.cardTimer);
      this.cardTimer = window.setTimeout(() => {
        if (this.stopped) return;
        if (this.topView === "link" && this.linkView !== "connections" && this.contentKey() === this.lastContentKey) return;
        this.render();
      }, 200);
    };
    this.registerEvent(this.app.metadataCache.on("resolved", refreshCards));
    this.registerEvent(this.app.workspace.on("editor-change", (_editor, info) => {
      if (info.file === this.mainFile && this.topView === "metadata") refreshCards();
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file instanceof import_obsidian11.TFile && (file === this.mainFile || this.connectedFiles().includes(file))) refreshCards();
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      const renamed = (p) => p === oldPath ? file.path : p.startsWith(oldPath + "/") ? file.path + p.slice(oldPath.length) : p;
      this.cards.order = this.cards.order.map(renamed);
      const documents = /* @__PURE__ */ Object.create(null);
      for (const [path, state] of Object.entries(this.foldersByMain)) {
        state.order = state.order.map((k) => k.startsWith("f:") ? fileKey(renamed(k.slice(2))) : k);
        const positions = /* @__PURE__ */ Object.create(null);
        for (const [filePath, folder] of Object.entries(state.positions)) positions[renamed(filePath)] = folder;
        state.positions = positions;
        documents[renamed(path)] = state;
      }
      this.foldersByMain = documents;
      for (const path of Object.keys(this.cards.assignments)) {
        const next = renamed(path);
        if (next !== path) {
          this.cards.assignments[next] = this.cards.assignments[path];
          delete this.cards.assignments[path];
        }
      }
      this.cardsChanged();
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (!(file instanceof import_obsidian11.TFile)) return;
      delete this.foldersByMain[file.path];
      for (const state of Object.values(this.foldersByMain)) {
        delete state.positions[file.path];
        state.order = state.order.filter((k) => k !== fileKey(file.path));
      }
      this.cards.order = this.cards.order.filter((p) => p !== file.path);
      delete this.cards.assignments[file.path];
      pruneLabels(this.cards);
      this.cardsChanged();
    }));
    this.app.workspace.onLayoutReady(() => {
      if (this.stopped) return;
      this.restore();
      this.ready = true;
      this.sync(false);
    });
  }
  onunload() {
    window.clearTimeout(this.cardTimer);
    window.clearTimeout(this.syncTimer);
    window.clearTimeout(this.saveTimer);
    this.flushState();
    this.stopped = true;
    this.clearIcons();
  }
  run(action) {
    if (this.busy) return;
    this.busy = true;
    void action().catch((error) => {
      console.error("MD Palette:", error);
      new import_obsidian11.Notice("MD Palette \uC791\uC5C5\uC744 \uC644\uB8CC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uD30C\uC77C\uC740 \uC0AD\uC81C\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
    }).finally(() => {
      this.busy = false;
      if (!this.stopped) {
        this.sync(false);
        this.persist();
      }
    });
  }
  async toggleMain(leaf) {
    if (leaf && leaf === this.mainLeaf && this.mainFile) await this.unsetMain();
    else await this.setMain(leaf);
  }
  async setMain(leaf) {
    const group = groupOf(leaf);
    const file = fileIn(this.app, leaf ?? void 0);
    if (!leaf || !group || !isCentral(this.app, group) || file?.extension !== "md" || leaf.getViewState().type !== "markdown") {
      new import_obsidian11.Notice("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB294 Markdown \uD30C\uC77C\uB9CC \uC9C0\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    if (this.isSub(group)) {
      new import_obsidian11.Notice("\uC11C\uBE0C \uC2A4\uD398\uC774\uC2A4\uC5D0\uC11C\uB294 \uBA54\uC778\uC744 \uC9C0\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    if (leaf === this.mainLeaf) {
      await this.openSidebar();
      return;
    }
    this.mainGroup = group;
    this.mainLeaf = leaf;
    this.pinnedMain = file;
    this.subGroup = void 0;
    this.subGroups = [];
    this.clearIcons();
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    await this.openSidebar();
  }
  async unsetMain() {
    this.mainGroup = this.subGroup = void 0;
    this.subGroups = [];
    this.mainLeaf = void 0;
    this.pinnedMain = void 0;
    this.clearIcons();
    this.render();
  }
  async openIn(_role, file, subpath = "", mode = "replace") {
    if (!this.mainFile || !this.mainGroup) {
      new import_obsidian11.Notice("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uB97C \uBA3C\uC800 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.");
      return;
    }
    if (this.app.vault.getAbstractFileByPath(file.path) !== file) return;
    const previous = this.app.workspace.getMostRecentLeaf();
    let group = this.subGroup;
    if (group && !groupsIn(this.app).includes(group)) group = void 0;
    const existing = mode !== "group" ? group?.children.find((leaf2) => fileIn(this.app, leaf2)?.path === file.path) : void 0;
    if (existing) {
      if (subpath) await existing.openFile(file, { active: true, eState: { subpath } });
      await this.app.workspace.revealLeaf(existing);
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      return;
    }
    const anchor = this.mainLeaf;
    if (!anchor) return;
    const replacing = mode === "replace" && group ? activeIn(group) : void 0;
    const leaf = replacing ?? (mode !== "group" && group ? newTab(this.app, group) : this.app.workspace.createLeafBySplit(activeIn(group) ?? anchor, "vertical"));
    const oldState = replacing?.getViewState();
    if (replacing?.view instanceof import_obsidian11.TextFileView) await replacing.view.save();
    try {
      await leaf.openFile(file, { active: true, eState: subpath ? { subpath } : void 0 });
    } catch (error) {
      if (oldState) await leaf.setViewState(oldState);
      else leaf.detach();
      if (previous) this.app.workspace.setActiveLeaf(previous, { focus: false });
      throw error;
    }
    this.subGroup = groupOf(leaf);
    if (this.subGroup && !this.isSub(this.subGroup)) this.subGroups.push(this.subGroup);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    this.enforceOrder(false);
  }
  routeMainLinks() {
    const workspace = this.app.workspace, original = workspace.openLinkText, plugin = this;
    const wrapped = async function(linktext, sourcePath, newLeaf, state) {
      if (!plugin.stopped && plugin.mainFile?.path === sourcePath && workspace.getMostRecentLeaf() === plugin.mainLeaf && !/^[a-z][a-z\d+.-]*:/i.test(linktext)) {
        const { path, subpath } = (0, import_obsidian11.parseLinktext)(linktext);
        const file = path ? plugin.app.metadataCache.getFirstLinkpathDest(path, sourcePath) : plugin.mainFile;
        if (file && file !== plugin.mainFile) {
          const main = plugin.mainLeaf;
          await new Promise((resolve) => window.setTimeout(resolve, 0));
          if (plugin.stopped || plugin.mainLeaf !== main || plugin.mainFile?.path !== sourcePath) return;
          await plugin.openIn("sub", file, subpath);
          plugin.sync(false);
          plugin.persist();
          return;
        }
        if (!file) {
          new import_obsidian11.Notice("\uB300\uC0C1 \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. Main \uBB38\uC11C\uB294 \uC720\uC9C0\uB429\uB2C8\uB2E4.");
          return;
        }
      }
      return original.call(this, linktext, sourcePath, newLeaf, state);
    };
    workspace.openLinkText = wrapped;
    this.register(() => {
      if (workspace.openLinkText === wrapped) workspace.openLinkText = original;
    });
  }
  bindFilePreview(element, file) {
    const hoverParent = { hoverPopover: null };
    element.addEventListener("mouseover", (event) => {
      if (event.target.closest("button, input") || event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
      this.app.workspace.trigger("hover-link", { event, source: "md-palette", hoverParent, targetEl: element, linktext: file.path, sourcePath: this.mainFile?.path ?? "" });
    });
  }
  async openSidebar() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const right = this.app.workspace.getRightLeaf(false);
      if (!right) return;
      leaf = right;
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    this.render();
  }
  selectView(top, link = this.linkView) {
    this.topView = top;
    this.linkView = link;
    this.render();
    this.persist();
  }
  cardsChanged() {
    this.render();
    this.persist();
  }
  saveCardOrder() {
    this.persist();
  }
  saveConnections() {
    this.persist();
  }
  saveMetadata() {
    this.persist();
  }
  async mainText(file) {
    const view = this.mainLeaf?.view;
    return this.mainFile === file && view instanceof import_obsidian11.MarkdownView ? view.editor.getValue() : this.app.vault.read(file);
  }
  async patchMain(file, original, from, to, replacement) {
    if (this.mainFile !== file) throw Error("Main\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uD655\uC778\uD574\uC8FC\uC138\uC694.");
    const view = this.mainLeaf?.view;
    if (view instanceof import_obsidian11.MarkdownView) {
      if (view.editor.getValue() !== original || await this.app.vault.read(file) !== original) throw Error("\uC6D0\uBB38\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uB0B4\uC6A9\uC744 \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uD3B8\uC9D1\uD574\uC8FC\uC138\uC694.");
      view.editor.replaceRange(replacement, view.editor.offsetToPos(from), view.editor.offsetToPos(to));
      try {
        await view.save();
      } catch (error) {
        const changed = original.slice(0, from) + replacement + original.slice(to);
        if (view.editor.getValue() === changed && await this.app.vault.read(file) === original) view.editor.replaceRange(original.slice(from, to), view.editor.offsetToPos(from), view.editor.offsetToPos(from + replacement.length));
        throw error;
      }
    } else {
      await this.app.vault.process(file, (current) => {
        if (this.mainFile !== file || current !== original) throw Error("\uC6D0\uBB38\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uB0B4\uC6A9\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.");
        return current.slice(0, from) + replacement + current.slice(to);
      });
    }
    this.render();
  }
  async navigateMain(file, offset) {
    if (this.mainFile !== file || !this.mainLeaf) return;
    const leaf = this.mainLeaf;
    await this.app.workspace.revealLeaf(leaf);
    await leaf.setViewState({ ...leaf.getViewState(), state: { ...leaf.getViewState().state, mode: "source" } });
    if (leaf.view instanceof import_obsidian11.MarkdownView) {
      const editor = leaf.view.editor, pos = editor.offsetToPos(offset);
      editor.setCursor(pos);
      editor.scrollIntoView({ from: pos, to: pos }, true);
      editor.focus();
    }
  }
  async openMetadataFile(file, subpath = "") {
    await this.openIn("sub", file, subpath);
  }
  async openMetadataWeb(url, external) {
    if (!/^https?:\/\//i.test(url)) {
      new import_obsidian11.Notice("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC6F9 \uC8FC\uC18C\uC785\uB2C8\uB2E4.");
      return;
    }
    if (external) {
      await require("electron").shell.openExternal(url);
      return;
    }
    const app = this.app;
    if (!app.internalPlugins.plugins.webviewer?.enabled) {
      new import_obsidian11.Notice("\uC124\uC815 \u2192 \uCF54\uC5B4 \uD50C\uB7EC\uADF8\uC778\uC5D0\uC11C \uC6F9 \uBDF0\uC5B4\uB97C \uCF20 \uB4A4 \uB2E4\uC2DC \uC5F4\uC5B4\uC8FC\uC138\uC694.");
      return;
    }
    const type = Object.keys(app.viewRegistry.viewByType).find((k) => /webviewer/.test(k));
    if (!type) throw Error("\uC635\uC2DC\uB514\uC5B8 \uC6F9 \uBDF0\uC5B4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const anchor = this.mainLeaf;
    if (!this.mainGroup || !anchor || !this.mainFile) return;
    const group = this.subGroup && groupsIn(this.app).includes(this.subGroup) ? this.subGroup : void 0;
    const existing = group?.children.find((l) => l.getViewState().type === type && l.getViewState().state?.url === url);
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      return;
    }
    const replacing = activeIn(group);
    const leaf = replacing ?? this.app.workspace.createLeafBySplit(anchor, "vertical");
    const oldState = replacing?.getViewState();
    if (replacing?.view instanceof import_obsidian11.TextFileView) await replacing.view.save();
    try {
      await leaf.setViewState({ type, active: true, state: { url, title: url, navigate: true } });
    } catch (error) {
      if (oldState) await leaf.setViewState(oldState);
      else leaf.detach();
      throw error;
    }
    this.subGroup = groupOf(leaf);
    if (this.subGroup && !this.isSub(this.subGroup)) this.subGroups.push(this.subGroup);
    this.enforceOrder(false);
  }
  async commitFolders(next, main) {
    if (!this.saveAllowed) throw Error("\uC800\uC7A5 \uC0C1\uD0DC\uB97C \uC77D\uC9C0 \uBABB\uD574 \uAC00\uC0C1 \uD3F4\uB354\uB97C \uBCC0\uACBD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    window.clearTimeout(this.saveTimer);
    this.flushState();
    this.folderSaving = true;
    try {
      await this.saveChain;
      if (this.app.vault.getAbstractFileByPath(main.path) !== main) throw Error("\uB300\uC0C1 Main \uBB38\uC11C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      const documents = { ...this.foldersByMain, [main.path]: next };
      const data = { ...this.data, foldersByMain: structuredClone(documents), folderDefaults: structuredClone(this.folderDefaults) };
      await this.saveData(data);
      this.data = data;
      this.persistedJSON = JSON.stringify(data);
      this.foldersByMain[main.path] = next;
    } finally {
      this.folderSaving = false;
      this.persist();
    }
  }
  async changeFolders(change, main = this.mainFile) {
    if (!main || this.mainFile !== main) throw Error("Main\uC774 \uBCC0\uACBD\uB418\uC5B4 \uAC00\uC0C1 \uD3F4\uB354 \uC791\uC5C5\uC744 \uCDE8\uC18C\uD588\uC2B5\uB2C8\uB2E4.");
    const next = structuredClone(this.folders);
    change(next);
    await this.commitFolders(next, main);
    this.render();
  }
  async addFolderConnection(main, file, folder) {
    if (this.mainFile !== main || main === file || this.app.vault.getAbstractFileByPath(file.path) !== file || folder && !this.folders.folders.some((f) => f.id === folder)) throw Error("Main \uB610\uB294 \uB300\uC0C1\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    if (Object.prototype.hasOwnProperty.call(this.folders.positions, file.path) && this.folders.positions[file.path] !== folder) {
      new import_obsidian11.Notice("\uC774\uBBF8 \uB2E4\uB978 \uAC00\uC0C1 \uD3F4\uB354\uC5D0 \uBC30\uCE58\uB41C \uD30C\uC77C\uC785\uB2C8\uB2E4.");
      return;
    }
    const previous = structuredClone(this.folders), next = structuredClone(previous);
    next.positions[file.path] = folder;
    if (!next.order.includes(fileKey(file.path))) next.order.push(fileKey(file.path));
    await this.commitFolders(next, main);
    try {
      if (this.mainFile !== main) throw Error("Main\uC774 \uBCC0\uACBD\uB418\uC5B4 \uC5F0\uACB0\uC744 \uCDE8\uC18C\uD588\uC2B5\uB2C8\uB2E4.");
      if (!this.connectedFiles(main).includes(file)) await this.addConnection(main, file, true);
    } catch (error) {
      await this.commitFolders(previous, main);
      this.render();
      throw error;
    }
    this.render();
  }
  newLinkedNotePath(main, input) {
    const name = newNoteName(input);
    const parent = this.app.fileManager.getNewFileParent(main.path, name);
    return parent.isRoot() ? name : `${parent.path}/${name}`;
  }
  async createLinkedNote(main, input, folder) {
    if (this.creatingNote) throw Error("\uC0C8 \uD30C\uC77C\uC744 \uB9CC\uB4DC\uB294 \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC \uAE30\uB2E4\uB824\uC8FC\uC138\uC694.");
    if (this.mainFile !== main || this.app.vault.getAbstractFileByPath(main.path) !== main) throw Error("Main\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCC3D\uC744 \uB2E4\uC2DC \uC5F4\uC5B4\uC8FC\uC138\uC694.");
    if (folder !== void 0 && folder && !this.folders.folders.some((f) => f.id === folder)) throw Error("\uB300\uC0C1 \uAC00\uC0C1 \uD3F4\uB354\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const path = this.newLinkedNotePath(main, input);
    if (this.app.vault.getAllLoadedFiles().some((f) => f.path.toLocaleLowerCase() === path.toLocaleLowerCase())) throw Error("\uAC19\uC740 \uC774\uB984\uC758 \uD30C\uC77C \uB610\uB294 \uD3F4\uB354\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    this.creatingNote = true;
    let created;
    try {
      created = await this.app.vault.create(path, "");
      if (folder === void 0) await this.addConnection(main, created, true);
      else await this.addFolderConnection(main, created, folder);
      return created;
    } catch (error) {
      if (created && this.app.vault.getAbstractFileByPath(path) === created) {
        const body = await this.app.vault.read(created);
        const mainBody = this.app.vault.getAbstractFileByPath(main.path) === main ? await this.app.vault.read(main) : "";
        if (body === "" && !mainBody.includes(`[[${path}]]`)) {
          await this.app.vault.delete(created);
          this.cards.order = this.cards.order.filter((p) => p !== path);
        } else throw Error(`\uC5F0\uACB0 \uC791\uC5C5\uC744 \uB9C8\uCE58\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uBCC0\uACBD\uB41C \uD30C\uC77C\uC740 \uBCF4\uC874\uD588\uC2B5\uB2C8\uB2E4: ${created.path}`);
      }
      throw error;
    } finally {
      this.creatingNote = false;
    }
  }
  connectedFiles(main = this.mainFile) {
    if (!main) return [];
    const links = this.app.metadataCache.resolvedLinks;
    const paths = new Set(Object.keys(links[main.path] ?? {}));
    for (const [source, targets] of Object.entries(links)) if (targets[main.path]) paths.add(source);
    paths.delete(main.path);
    const files = [...paths].map((p) => this.app.vault.getAbstractFileByPath(p)).filter((f) => f instanceof import_obsidian11.TFile);
    const known = new Set(this.cards.order);
    let changed = false;
    for (const f of files) if (!known.has(f.path)) {
      this.cards.order.push(f.path);
      known.add(f.path);
      changed = true;
    }
    if (changed) this.persist();
    const rank = new Map(this.cards.order.map((p, i) => [p, i]));
    return files.sort((a, b) => rank.get(a.path) - rank.get(b.path));
  }
  async addConnection(main, file, strict = false) {
    if (this.mainFile !== main || this.app.vault.getAbstractFileByPath(main.path) !== main || this.app.vault.getAbstractFileByPath(file.path) !== file) {
      if (strict) throw Error("\uBA54\uC778 \uB610\uB294 \uC120\uD0DD \uD30C\uC77C\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
      new import_obsidian11.Notice("\uBA54\uC778 \uB610\uB294 \uC120\uD0DD \uD30C\uC77C\uC774 \uBCC0\uACBD\uB418\uC5B4 \uC5F0\uACB0\uC744 \uCDE8\uC18C\uD588\uC2B5\uB2C8\uB2E4.");
      return;
    }
    if (main === file || this.connectedFiles(main).some((f) => f.path === file.path)) {
      new import_obsidian11.Notice("\uC774\uBBF8 \uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uC640 \uC5F0\uACB0\uB41C \uD30C\uC77C\uC785\uB2C8\uB2E4.");
      return;
    }
    const link = `[[${file.path}]]`;
    await this.app.fileManager.processFrontMatter(main, (frontmatter) => {
      if (this.mainFile !== main) throw Error("Main changed before connection write");
      const current = frontmatter["link note"];
      if (current != null && typeof current !== "string" && !Array.isArray(current)) throw Error("link note must be text or a list");
      const values = current == null ? [] : Array.isArray(current) ? current : [current];
      if (!values.every((v) => typeof v === "string")) throw Error("link note contains unsupported values");
      const already = values.some((v) => {
        const text = v;
        const path = text.match(/^!?\[\[([^\]|#]+)(?:[^\]]*)\]\]$/)?.[1] ?? text.match(/^\[[^\]]*\]\(([^)]+)\)$/)?.[1];
        if (!path) return false;
        let decoded = path;
        try {
          decoded = decodeURIComponent(path);
        } catch {
        }
        return this.app.metadataCache.getFirstLinkpathDest(decoded, main.path)?.path === file.path;
      });
      if (!already) frontmatter["link note"] = [...values, link];
    });
    this.render();
  }
  render() {
    this.lastContentKey = this.contentKey();
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) if (leaf.view instanceof PaletteView) leaf.view.render();
  }
  contentKey() {
    return JSON.stringify([this.mainFile?.path, this.connectedFiles().map((file) => [file.path, file.stat.mtime, file.stat.size])]);
  }
  scheduleSync() {
    if (this.stopped || !this.ready || this.busy || this.syncTimer !== void 0) return;
    this.syncTimer = window.setTimeout(() => {
      this.syncTimer = void 0;
      if (!this.busy && !this.stopped) this.sync(true);
    }, 30);
  }
  sync(notify) {
    const live = groupsIn(this.app);
    const pinnedGroup = groupOf(this.mainLeaf ?? null);
    if (this.mainGroup && (!pinnedGroup || !live.includes(pinnedGroup) || !pinnedGroup.children.includes(this.mainLeaf) || !isCentral(this.app, pinnedGroup) || !this.mainFile)) {
      this.mainGroup = this.subGroup = void 0;
      this.subGroups = [];
      this.mainLeaf = void 0;
      this.pinnedMain = void 0;
    } else if (this.mainLeaf) this.mainGroup = pinnedGroup;
    this.subGroups = this.subGroups.filter((g) => live.includes(g) && g !== this.mainGroup && isCentral(this.app, g) && g.children.some((l) => fileIn(this.app, l) || l.getViewState().type === "webviewer"));
    if (!this.isSub(this.subGroup)) this.subGroup = this.subGroups[0];
    if (this.mainGroup) {
      this.busy = true;
      try {
        this.enforceOrder(notify);
      } catch (error) {
        console.error("MD Palette layout:", error);
      } finally {
        this.busy = false;
      }
    }
    const leaf = activeIn(this.mainGroup);
    const invalid = this.mainGroup && !this.mainFile ? `${this.mainGroup.currentTab}:${leaf?.getViewState().type}:${fileIn(this.app, leaf)?.path ?? ""}` : "";
    if (invalid && invalid !== this.invalidMainKey) new import_obsidian11.Notice("\uBA54\uC778 \uC2A4\uD398\uC774\uC2A4\uC5D0\uC11C\uB294 Markdown \uD30C\uC77C\uC744 \uD65C\uC131\uD654\uD574\uC8FC\uC138\uC694.");
    this.invalidMainKey = invalid;
    this.updateIcons();
    const key = `${this.mainGroup?.id}:${this.mainFile?.path}:${this.topView}:${this.linkView}`;
    if (key !== this.lastRenderKey) {
      this.lastRenderKey = key;
      this.render();
    }
    this.persist();
  }
  enforceOrder(notify) {
    if (!this.mainGroup) return;
    const followers = this.subGroups;
    if (arrange(this.app, this.mainGroup, followers) && notify) new import_obsidian11.Notice("\uC2A4\uD398\uC774\uC2A4 \uC21C\uC11C\uB294 \uBCC0\uACBD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  clearIcons() {
    for (const el of this.decorated) el.remove();
    this.decorated = [];
  }
  updateIcons() {
    this.clearIcons();
    for (const [group, icon, label] of [[this.mainGroup, "book-open", "Main Space"], ...this.subGroups.map((g) => [g, "link", "Sub Space"])]) {
      if (!group) continue;
      const leaf = group === this.mainGroup ? this.mainLeaf : activeIn(group);
      const header = leaf?.tabHeaderEl;
      const title = header?.querySelector(".workspace-tab-header-inner-title");
      if (!header || !title) continue;
      const marker = header.ownerDocument.createElement("span");
      marker.className = "mdp-space-icon";
      marker.setAttribute("aria-label", label);
      marker.setAttribute("title", label);
      (0, import_obsidian11.setIcon)(marker, icon);
      title.before(marker);
      this.decorated.push(marker);
    }
  }
  restore() {
    const saved = readSpaces(this.data.spaces);
    const live = groupsIn(this.app);
    const find = (id) => live.find((g) => g.id === id && isCentral(this.app, g));
    const main = find(saved.main?.groupId);
    if (!main) return;
    const leaf = saved.main?.leafId ? main.children.find((l) => l.id === saved.main.leafId) : main.children.find((l) => fileIn(this.app, l)?.path === saved.main?.activeFile);
    const file = fileIn(this.app, leaf);
    if (!leaf || file?.extension !== "md" || file.path !== saved.main?.activeFile || leaf.getViewState().type !== "markdown") return;
    this.mainGroup = main;
    this.mainLeaf = leaf;
    this.pinnedMain = file;
    this.subGroups = (saved.subs ?? (saved.sub ? [saved.sub] : [])).flatMap((s) => {
      const sub = find(s.groupId);
      return sub && sub !== main && sub.children.some((l) => fileIn(this.app, l) || l.getViewState().type === "webviewer") ? [sub] : [];
    });
    this.subGroup = this.subGroups.find((g) => g.id === saved.sub?.groupId) ?? this.subGroups[0];
  }
  persist() {
    if (this.stopped || !this.ready || !this.saveAllowed) return;
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.flushState(), 250);
  }
  flushState() {
    if (!this.ready || !this.saveAllowed || this.folderSaving) return;
    const space = (g) => g ? { groupId: g.id, activeFile: fileIn(this.app, activeIn(g))?.path ?? null } : void 0;
    const spaces = { main: this.mainGroup && this.mainFile ? { groupId: this.mainGroup.id, activeFile: this.mainFile.path, leafId: this.mainLeaf.id } : void 0, sub: space(this.subGroup), subs: this.subGroups.map((g) => space(g)) };
    const next = { ...this.data, spaces, metadataCollapsed: this.metadataCollapsed.slice(), topView: this.topView, linkView: this.linkView, cards: structuredClone(this.cards), connections: structuredClone(this.connections), foldersByMain: structuredClone(this.foldersByMain), folderDefaults: structuredClone(this.folderDefaults) };
    const serialized = JSON.stringify(next);
    if (serialized === this.persistedJSON) return;
    this.data = next;
    this.saveChain = this.saveChain.then(async () => {
      await this.saveData(next);
      this.persistedJSON = serialized;
    }).catch((error) => {
      console.error("MD Palette save:", error);
      new import_obsidian11.Notice("MD Palette \uC0C1\uD0DC\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    });
  }
};
