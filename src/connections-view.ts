import { Menu, Notice, TFile, setIcon } from 'obsidian';
import type MDPalettePlugin from './main';
import { ConnectionPicker } from './card-view';
import { relations, sectionKeys, type SectionKey } from './connections-state';

export class ConnectionsView {
  private root?: HTMLElement;
  private mainPath = '';
  private scroll: Partial<Record<SectionKey, number>> = {};
  private selected?: string;
  private camera = { x: 0, y: 0, scale: 1 };
  private fitGraph = true;
  private cancelDrag?: () => void;
  private graphObserver?: ResizeObserver;
  constructor(private plugin: MDPalettePlugin) {}
  destroy(): void {
    this.graphObserver?.disconnect(); this.graphObserver = undefined;
    this.cancelDrag?.(); this.cancelDrag = undefined;
    if (this.root?.isConnected) for (const key of sectionKeys) {
      const body = this.root.querySelector<HTMLElement>(`[data-section="${key}"] .mdp-connection-content`);
      if (body) this.scroll[key] = body.scrollTop;
    }
  }
  render(root: HTMLElement): void {
    this.root = root;
    const main = this.plugin.mainFile; if (!main) return;
    if (main.path !== this.mainPath) { this.mainPath = main.path; this.scroll = {}; this.selected = undefined; this.fitGraph = true; }
    root.className = 'mdp-connections';
    const add = root.createEl('button', { cls: 'mdp-add-connection', text: '+ 연결 파일 추가' });
    add.onclick = () => {
      const current = this.plugin.mainFile;
      if (!current) { new Notice('메인 스페이스를 먼저 지정해주세요.'); return; }
      new ConnectionPicker(this.plugin, current).open();
    };
    const links = this.plugin.app.metadataCache.resolvedLinks;
    const related = relations(links, main.path, new Set(this.plugin.app.vault.getMarkdownFiles().map(f => f.path)));
    const cache = this.plugin.app.metadataCache.getFileCache(main);
    const outgoingRefs = [...(cache?.links ?? []), ...(cache?.embeds ?? []), ...(cache?.frontmatterLinks ?? []).filter(link => link.key === 'link note' || link.key.startsWith('link note.'))];
    const allowedOutgoing = new Set(outgoingRefs.map(link => this.plugin.app.metadataCache.getFirstLinkpathDest(link.link, main.path)?.path));
    related.outgoing = related.outgoing.filter(path => allowedOutgoing.has(path));
    const stack = root.createDiv({ cls: 'mdp-connection-sections' });
    for (const [i, key] of sectionKeys.entries()) {
      const section = stack.createDiv({ cls: 'mdp-connection-section', attr: { 'data-section': key } });
      const paths = key === 'graph' ? [...new Set([...related.backlinks, ...related.outgoing])] : related[key];
      const header = section.createEl('button', { cls: 'mdp-connection-header', attr: { 'aria-expanded': String(!this.plugin.connections.collapsed[key]) } });
      const icon = header.createSpan(); setIcon(icon, this.plugin.connections.collapsed[key] ? 'chevron-right' : 'chevron-down');
      header.createSpan({ text: ({ backlinks: 'Backlinks', outgoing: 'Outgoing Links', graph: 'Local Graph' })[key] });
      if (key !== 'graph') header.createSpan({ cls: 'mdp-muted', text: String(paths.length) });
      header.onclick = () => {
        this.plugin.connections.collapsed[key] = !this.plugin.connections.collapsed[key];
        header.setAttribute('aria-expanded', String(!this.plugin.connections.collapsed[key]));
        setIcon(icon, this.plugin.connections.collapsed[key] ? 'chevron-right' : 'chevron-down');
        this.layout(stack); this.plugin.saveConnections();
      };
      const body = section.createDiv({ cls: 'mdp-connection-content' });
      if (key === 'graph') this.graph(body, main, paths);
      else {
        if (!paths.length) body.createDiv({ cls: 'mdp-muted mdp-connection-empty', text: key === 'backlinks' ? '연결된 백링크가 없습니다.' : '아웃고잉 링크가 없습니다.' });
        for (const path of paths) {
          const file = this.plugin.app.vault.getAbstractFileByPath(path); if (!(file instanceof TFile)) continue;
          const row = body.createDiv({ cls: 'mdp-connection-row', attr: { tabindex: '0', role: 'button', 'data-path': path, 'aria-label': path, title: path } });
          setIcon(row.createSpan({ cls: 'mdp-connection-file-icon' }), 'file-text');
          row.createSpan({ cls: 'mdp-connection-name', text: file.name });
          this.fileEvents(row, file);
        }
        body.scrollTop = this.scroll[key] ?? 0;
      }
      if (i < 2) {
        const divider = stack.createDiv({ cls: 'mdp-connection-divider', attr: { role: 'separator', tabindex: '0', 'aria-orientation': 'horizontal', 'aria-label': `${key} 영역 높이 조절`, 'data-after': key } });
        divider.createSpan({ text: '⠿' });
        divider.onpointerdown = e => this.resize(e, stack, i);
        divider.onkeydown = e => {
          if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
          const pair = this.resizePair(stack, i); if (!pair) return;
          e.preventDefault(); this.adjust(pair, e.key === 'ArrowDown' ? 16 : -16); this.layout(stack); this.plugin.saveConnections();
        };
      }
    }
    this.layout(stack);
  }
  private layout(stack: HTMLElement): void {
    for (const key of sectionKeys) {
      const section = stack.querySelector<HTMLElement>(`[data-section="${key}"]`)!;
      const collapsed = this.plugin.connections.collapsed[key];
      section.classList.toggle('is-collapsed', collapsed);
      section.style.flex = collapsed ? '0 0 34px' : `${this.plugin.connections.heights[key]} 1 0px`;
    }
    for (const [i, divider] of Array.from(stack.querySelectorAll<HTMLElement>('.mdp-connection-divider')).entries()) {
      const pair = this.resizePair(stack, i);
      divider.classList.toggle('is-disabled', !pair); divider.setAttribute('aria-disabled', String(!pair));
      if (pair) divider.setAttribute('aria-valuenow', String(Math.round(pair.aHeight / (pair.aHeight + pair.bHeight) * 100)));
    }
  }
  private resizePair(stack: HTMLElement, boundary: number) {
    const visible = sectionKeys.filter(k => !this.plugin.connections.collapsed[k]);
    const a = visible.filter(k => sectionKeys.indexOf(k) <= boundary).at(-1);
    const b = visible.find(k => sectionKeys.indexOf(k) > boundary);
    if (!a || !b) return;
    return { a, b, aHeight: stack.querySelector<HTMLElement>(`[data-section="${a}"]`)!.getBoundingClientRect().height, bHeight: stack.querySelector<HTMLElement>(`[data-section="${b}"]`)!.getBoundingClientRect().height, totalWeight: this.plugin.connections.heights[a] + this.plugin.connections.heights[b] };
  }
  private adjust(pair: NonNullable<ReturnType<ConnectionsView['resizePair']>>, delta: number): void {
    const total = pair.aHeight + pair.bHeight;
    const min = Math.min(60, total / 3);
    const height = Math.max(min, Math.min(total - min, pair.aHeight + delta));
    this.plugin.connections.heights[pair.a] = pair.totalWeight * height / total;
    this.plugin.connections.heights[pair.b] = pair.totalWeight * (total - height) / total;
  }
  private resize(e: PointerEvent, stack: HTMLElement, boundary: number): void {
    if (e.button !== 0) return;
    const pair = this.resizePair(stack, boundary); if (!pair) return;
    const target = e.currentTarget as HTMLElement, startY = e.clientY;
    const original = { ...this.plugin.connections.heights };
    e.preventDefault(); target.setPointerCapture(e.pointerId);
    const move = (event: PointerEvent) => { this.adjust(pair, event.clientY - startY); this.layout(stack); };
    const stop = (cancel: boolean) => {
      target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up); target.removeEventListener('pointercancel', cancelEvent); target.ownerDocument.removeEventListener('keydown', escape);
      if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
      this.cancelDrag = undefined;
      if (cancel) this.plugin.connections.heights = original;
      this.layout(stack); if (!cancel) this.plugin.saveConnections();
    };
    const up = () => stop(false), cancelEvent = () => stop(true), escape = (event: KeyboardEvent) => { if (event.key === 'Escape') stop(true); };
    target.addEventListener('pointermove', move); target.addEventListener('pointerup', up); target.addEventListener('pointercancel', cancelEvent); target.ownerDocument.addEventListener('keydown', escape);
    this.cancelDrag = () => stop(true);
  }
  private fileEvents(element: HTMLElement | SVGElement, file: TFile): void {
    element.classList.toggle('is-selected', this.selected === file.path);
    element.addEventListener('click', () => {
      this.selected = file.path;
      for (const node of Array.from(this.root?.querySelectorAll('[data-path]') ?? [])) node.classList.toggle('is-selected', node.getAttribute('data-path') === file.path);
    });
    element.addEventListener('dblclick', () => this.plugin.run(() => this.plugin.openIn('sub', file)));
    element.addEventListener('keydown', e => {
      if ((e as KeyboardEvent).key === 'Enter') { e.preventDefault(); this.plugin.run(() => this.plugin.openIn('sub', file)); }
    });
    element.addEventListener('contextmenu', event => {
      event.preventDefault(); event.stopPropagation();
      const menu = new Menu();
      for (const role of ['sub', 'reference'] as const) menu.addItem(item => item.setTitle(`${role === 'sub' ? 'Sub' : 'Reference'} Space에서 열기`).setIcon(role === 'sub' ? 'link' : 'file-search').onClick(() => this.plugin.run(() => this.plugin.openIn(role, file))));
      menu.showAtMouseEvent(event as MouseEvent);
    });
  }
  private graph(body: HTMLElement, main: TFile, paths: string[]): void {
    body.addClass('mdp-local-graph');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = body.ownerDocument.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-250 -200 500 400'); svg.setAttribute('aria-label', 'Main 중심 연결 그래프. 휠로 확대, 빈 공간 드래그로 이동');
    body.append(svg);
    const layer = body.ownerDocument.createElementNS(ns, 'g'); svg.append(layer);
    const fit = () => { this.camera = { x: 0, y: 0, scale: paths.length <= 12 ? 1 : Math.min(1, 160 / (55 + 14 * Math.sqrt(paths.length))) }; };
    if (this.fitGraph) { fit(); this.fitGraph = false; }
    const transform = () => {
      layer.setAttribute('transform', `translate(${this.camera.x} ${this.camera.y}) scale(${this.camera.scale})`);
      const rect = svg.getBoundingClientRect();
      const factor = Math.min(rect.width / 500, rect.height / 400) * this.camera.scale;
      if (factor <= 0) return;
      layer.querySelectorAll<SVGTextElement>('text').forEach(label => { label.style.fontSize = `${12 / factor}px`; label.style.strokeWidth = `${3 / factor}px`; label.setAttribute('y', String(19 / factor)); });
      layer.querySelectorAll<SVGCircleElement>('circle').forEach(circle => { circle.setAttribute('r', String((circle.parentElement?.classList.contains('is-main') ? 7 : paths.length > 40 ? 2.5 : 4) / factor)); circle.style.strokeWidth = String(1 / factor); });
    };
    transform();
    svg.addEventListener('dblclick', e => { if (!(e.target as Element).closest('.mdp-graph-node')) { fit(); transform(); } });
    const positions = new Map<string, [number, number]>([[main.path, [0, 0]]]);
    paths.forEach((path, i) => {
      const angle = paths.length <= 12 ? -Math.PI / 2 + i * Math.PI * 2 / paths.length : i * 2.399963;
      const radius = paths.length <= 12 ? 145 : 55 + 14 * Math.sqrt(i + 1);
      positions.set(path, [Math.cos(angle) * radius, Math.sin(angle) * radius]);
    });
    const links = this.plugin.app.metadataCache.resolvedLinks;
    const seen = new Set<string>();
    for (const [source, [x, y]] of positions) for (const target of Object.keys(links[source] ?? {})) {
      const dest = positions.get(target); if (!dest || source === target) continue;
      const key = JSON.stringify([source, target].sort()); if (seen.has(key)) continue; seen.add(key);
      const edge = body.ownerDocument.createElementNS(ns, 'line');
      for (const [k, v] of Object.entries({ x1: x, y1: y, x2: dest[0], y2: dest[1] })) edge.setAttribute(k, String(v));
      edge.classList.add('mdp-graph-edge'); layer.append(edge);
    }
    for (const [path, [x, y]] of positions) {
      const file = this.plugin.app.vault.getAbstractFileByPath(path); if (!(file instanceof TFile)) continue;
      const node = body.ownerDocument.createElementNS(ns, 'g');
      node.setAttribute('transform', `translate(${x} ${y})`); node.setAttribute('data-path', path); node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button'); node.setAttribute('aria-label', path);
      node.classList.add('mdp-graph-node'); if (path === main.path) node.classList.add('is-main');
      if (paths.length > 40 && path !== main.path) node.classList.add('is-dense');
      const title = body.ownerDocument.createElementNS(ns, 'title'); title.textContent = path; node.append(title);
      const circle = body.ownerDocument.createElementNS(ns, 'circle'); circle.setAttribute('r', path === main.path ? '10' : '6'); node.append(circle);
      const label = body.ownerDocument.createElementNS(ns, 'text'); label.setAttribute('y', '24'); label.setAttribute('text-anchor', 'middle'); label.textContent = file.basename; node.append(label);
      this.fileEvents(node, file); layer.append(node);
    }
    transform();
    this.graphObserver = new ResizeObserver(transform); this.graphObserver.observe(svg);
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect(), ratio = Math.min(rect.width / 500, rect.height / 400);
      const x = (e.clientX - rect.x - rect.width / 2) / ratio, y = (e.clientY - rect.y - rect.height / 2) / ratio;
      const next = Math.max(.2, Math.min(8, this.camera.scale * Math.exp(-e.deltaY * .002)));
      const factor = next / this.camera.scale;
      this.camera = { x: x - (x - this.camera.x) * factor, y: y - (y - this.camera.y) * factor, scale: next }; transform();
    }, { passive: false });
    svg.addEventListener('pointerdown', e => {
      if (e.button !== 0 || (e.target as Element).closest('.mdp-graph-node')) return;
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const start = { ...this.camera }, sx = e.clientX, sy = e.clientY;
      const rect = svg.getBoundingClientRect(), ratio = Math.min(rect.width / 500, rect.height / 400);
      const move = (event: PointerEvent) => { this.camera.x = start.x + (event.clientX - sx) / ratio; this.camera.y = start.y + (event.clientY - sy) / ratio; transform(); };
      const stop = () => { svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerup', stop); svg.removeEventListener('pointercancel', stop); if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId); this.cancelDrag = undefined; };
      svg.addEventListener('pointermove', move); svg.addEventListener('pointerup', stop); svg.addEventListener('pointercancel', stop); this.cancelDrag = stop;
    });
  }
}
