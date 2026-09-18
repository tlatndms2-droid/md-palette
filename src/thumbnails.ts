import { App, TFile, loadPdfJs, setIcon } from 'obsidian';
import { bodyOnly, classify } from './cards-state';

const icons = { md: 'file-text', canvas: 'layout-dashboard', pdf: 'file-text', image: 'image', video: 'film', other: 'file' };
export class Thumbnails {
  private static cache = new Map<string, { key: string; kind: string; nodes: Node[] }>();
  private observer: IntersectionObserver;
  private waiting: { el: HTMLElement; file: TFile }[] = [];
  private files = new WeakMap<Element, TFile>();
  private running = 0;
  private stopped = false;
  private disposers = new Set<() => void>();
  constructor(private app: App, root: HTMLElement) {
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        this.observer.unobserve(entry.target);
        const file = this.files.get(entry.target);
        if (file) this.waiting.push({ el: entry.target as HTMLElement, file });
      }
      this.pump();
    }, { root, rootMargin: '120px' });
  }
  observe(el: HTMLElement, file: TFile): void {
    const cached = Thumbnails.cache.get(file.path);
    if (cached?.key === `${file.stat.mtime}:${file.stat.size}`) {
      el.replaceChildren(...cached.nodes.map(n => n.cloneNode(true))); el.dataset.preview = cached.kind; return;
    }
    this.fallback(el, file); this.files.set(el, file); this.observer.observe(el);
  }
  destroy(): void { this.stopped = true; this.observer.disconnect(); this.waiting = []; for (const dispose of this.disposers) dispose(); this.disposers.clear(); }
  private fallback(el: HTMLElement, file: TFile): void {
    el.empty(); setIcon(el.createDiv({ cls: 'mdp-preview-fallback' }), icons[classify(file.extension) as keyof typeof icons] ?? 'file');
    el.dataset.preview = 'fallback';
  }
  private pump(): void {
    while (!this.stopped && this.running < 2 && this.waiting.length) {
      const item = this.waiting.shift()!; this.running++;
      const key = `${item.file.stat.mtime}:${item.file.stat.size}`;
      void this.draw(item.el, item.file).then(() => {
        if (this.stopped || item.el.dataset.preview === 'fallback' || key !== `${item.file.stat.mtime}:${item.file.stat.size}`) return;
        const copy = item.el.cloneNode(true) as HTMLElement;
        const source = item.el.querySelector('canvas'), dest = copy.querySelector('canvas');
        if (source && dest) { const img = document.createElement('img'); img.src = source.toDataURL(); img.alt = item.file.name; dest.replaceWith(img); }
        Thumbnails.cache.delete(item.file.path);
        Thumbnails.cache.set(item.file.path, { key, kind: item.el.dataset.preview!, nodes: Array.from(copy.childNodes) });
        while (Thumbnails.cache.size > 64) Thumbnails.cache.delete(Thumbnails.cache.keys().next().value!);
      }).catch(error => { if (!this.stopped) { this.fallback(item.el, item.file); item.el.dataset.previewError = String(error); } }).finally(() => { this.running--; this.pump(); });
    }
  }
  private async draw(el: HTMLElement, file: TFile): Promise<void> {
    if (this.stopped || !el.isConnected) return;
    const type = classify(file.extension);
    if (type === 'md') {
      const text = bodyOnly(await this.app.vault.cachedRead(file));
      if (this.stopped) return;
      el.empty(); el.createDiv({ cls: 'mdp-preview-markdown', text: text.slice(0, 1800) || '(본문 없음)' }); el.dataset.preview = 'md';
    } else if (type === 'image') {
      el.empty(); const img = el.createEl('img', { attr: { src: this.app.vault.getResourcePath(file), alt: file.name, draggable: 'false' } });
      img.onerror = () => { if (!this.stopped) this.fallback(el, file); }; el.dataset.preview = 'image';
    } else if (type === 'canvas') {
      const data = JSON.parse(await this.app.vault.cachedRead(file));
      if (this.stopped) return;
      const nodes = (Array.isArray(data.nodes) ? data.nodes : []).filter((n: any) => [n.x, n.y, n.width, n.height].every(Number.isFinite) && n.width > 0 && n.height > 0).slice(0, 500);
      if (!nodes.length) return;
      const minX = Math.min(...nodes.map((n: any) => n.x)), minY = Math.min(...nodes.map((n: any) => n.y));
      const width = Math.max(...nodes.map((n: any) => n.x + n.width)) - minX, height = Math.max(...nodes.map((n: any) => n.y + n.height)) - minY;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', `${minX - 20} ${minY - 20} ${width + 40} ${height + 40}`);
      for (const edge of (Array.isArray(data.edges) ? data.edges : []).slice(0, 1000)) {
        const a = nodes.find((n: any) => n.id === edge.fromNode), b = nodes.find((n: any) => n.id === edge.toNode); if (!a || !b) continue;
        const line = document.createElementNS(svg.namespaceURI, 'line');
        for (const [k, v] of Object.entries({ x1: a.x + a.width / 2, y1: a.y + a.height / 2, x2: b.x + b.width / 2, y2: b.y + b.height / 2, stroke: 'var(--text-muted)', 'stroke-width': 3 })) line.setAttribute(k, String(v)); svg.append(line);
      }
      for (const n of nodes) {
        const rect = document.createElementNS(svg.namespaceURI, 'rect');
        for (const [k, v] of Object.entries({ x: n.x, y: n.y, width: n.width, height: n.height, rx: 8, fill: 'var(--background-secondary)', stroke: 'var(--interactive-accent)', 'stroke-width': 3 })) rect.setAttribute(k, String(v)); svg.append(rect);
        const text = document.createElementNS(svg.namespaceURI, 'text'); text.setAttribute('x', String(n.x + 10)); text.setAttribute('y', String(n.y + 30)); text.setAttribute('fill', 'var(--text-normal)'); text.setAttribute('font-size', '22'); text.textContent = String(n.text ?? n.file ?? n.url ?? n.label ?? '').slice(0, Math.max(5, n.width / 13)); svg.append(text);
      }
      el.empty(); el.append(svg); el.dataset.preview = 'canvas';
    } else if (type === 'pdf') {
      const lib = await loadPdfJs(); if (this.stopped) return;
      const task = lib.getDocument({ data: new Uint8Array(await this.app.vault.readBinary(file)), isEvalSupported: false });
      const dispose = () => { void task.destroy().catch(() => {}); }; this.disposers.add(dispose);
      try {
        const pdf = await task.promise; if (this.stopped) return;
        const page = await pdf.getPage(1), original = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(1, 380 / original.width) });
        const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        if (!this.stopped) { el.empty(); el.append(canvas); el.dataset.preview = 'pdf'; }
      } finally { this.disposers.delete(dispose); dispose(); }
    } else if (type === 'video') {
      await new Promise<void>((resolve, reject) => {
        const video = document.createElement('video'); video.preload = 'auto'; video.muted = true;
        const cleanup = () => { clearTimeout(timer); video.onloadeddata = video.onerror = null; video.removeAttribute('src'); video.load(); this.disposers.delete(cancel); };
        const cancel = () => { cleanup(); resolve(); };
        const timer = window.setTimeout(() => { cleanup(); reject(Error('Video preview timeout')); }, 8000);
        this.disposers.add(cancel);
        video.onerror = () => { cleanup(); reject(Error('Unsupported video')); };
        video.onloadeddata = () => {
          if (!this.stopped && video.videoWidth) {
            const canvas = document.createElement('canvas'); canvas.width = 380; canvas.height = 380 * video.videoHeight / video.videoWidth;
            canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
            el.empty(); el.append(canvas); el.createSpan({ cls: 'mdp-video-badge', text: '▶' }); el.dataset.preview = 'video';
          }
          cleanup(); resolve();
        };
        video.src = this.app.vault.getResourcePath(file);
      });
    }
  }
}
