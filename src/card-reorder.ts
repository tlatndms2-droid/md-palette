export interface DropCard { path: string; left: number; right: number; top: number; bottom: number }
export interface DropPoint { x: number; y: number }
export function findCardDrop(cards: DropCard[], point: DropPoint, bounds: DropCard, columns: boolean): { card: DropCard; after: boolean } | null {
  if (point.x < bounds.left || point.x > bounds.right || point.y < bounds.top || point.y > bounds.bottom) return null;
  let nearest: DropCard | undefined, distance = Infinity;
  for (const card of cards) {
    if (card.bottom < bounds.top || card.top > bounds.bottom) continue;
    const dx = point.x - (card.left + card.right) / 2, dy = point.y - (card.top + card.bottom) / 2;
    const next = dx * dx + dy * dy;
    if (next < distance) { distance = next; nearest = card; }
  }
  return nearest ? { card: nearest, after: columns ? point.x > (nearest.left + nearest.right) / 2 : point.y > (nearest.top + nearest.bottom) / 2 } : null;
}

/** Canvas Palette-style cached geometry and a layout-independent insertion marker. */
export class CardReorder {
  private overlay: HTMLElement;
  private controller = new AbortController();
  private cards: DropCard[] | null = null;
  private point: DropPoint | null = null;
  private target: ReturnType<typeof findCardDrop> = null;
  private frame = 0;
  private paths = new Set<string>();
  private columns = false;
  private win: Window;
  constructor(private grid: HTMLElement, private commit: (paths: string[], target: string, after: boolean) => void) {
    this.win = grid.ownerDocument.defaultView!;
    this.overlay = grid.ownerDocument.createElement('div'); this.overlay.className = 'mdp-drop-overlay'; this.overlay.setAttribute('aria-hidden', 'true');
    const options = { signal: this.controller.signal };
    grid.addEventListener('dragover', event => {
      if (!this.paths.size) return;
      event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      this.point = { x: event.clientX, y: event.clientY }; this.schedule();
    }, options);
    grid.addEventListener('dragleave', event => { if (!(event.relatedTarget instanceof Node) || !grid.contains(event.relatedTarget)) { this.point = null; this.hide(); } }, options);
    grid.addEventListener('drop', event => {
      if (!this.paths.size) return;
      event.preventDefault(); event.stopPropagation();
      // Resolve from the final pointer, not a potentially pending animation frame.
      this.point = { x: event.clientX, y: event.clientY }; this.draw();
      const target = this.target, paths = [...this.paths]; this.clear();
      if (target) this.commit(paths, target.card.path, target.after);
    }, options);
    grid.addEventListener('dragend', () => this.clear(), options);
    grid.addEventListener('scroll', () => { this.cards = null; if (this.point) this.schedule(); }, { ...options, passive: true });
    this.win.addEventListener('resize', () => this.clear(), options);
    this.win.addEventListener('keydown', event => { if (event.key === 'Escape') this.clear(); }, { ...options, capture: true });
  }
  start(paths: string[]): void {
    this.clear(); this.paths = new Set(paths);
    for (const el of Array.from(this.grid.querySelectorAll<HTMLElement>('.mdp-card'))) if (this.paths.has(el.dataset.path!)) el.classList.add('is-dragging');
    // Read once after source highlighting. No card geometry changes during pointer movement.
    this.columns = this.win.getComputedStyle(this.grid).gridTemplateColumns.split(' ').filter(Boolean).length > 1;
  }
  destroy(): void { this.clear(); this.controller.abort(); }
  private schedule(): void { if (!this.frame) this.frame = this.win.requestAnimationFrame(() => { this.frame = 0; this.draw(); }); }
  private draw(): void {
    if (!this.point || !this.paths.size) return;
    if (!this.cards) this.cards = Array.from(this.grid.querySelectorAll<HTMLElement>('.mdp-card')).flatMap(el => {
      if (!el.dataset.path || this.paths.has(el.dataset.path)) return [];
      const r = el.getBoundingClientRect(); return [{ path: el.dataset.path, left: r.left, right: r.right, top: r.top, bottom: r.bottom }];
    });
    const rect = this.grid.getBoundingClientRect();
    this.target = findCardDrop(this.cards, this.point, { path: '', left: rect.left, right: rect.left + this.grid.clientWidth, top: rect.top, bottom: rect.bottom }, this.columns);
    if (!this.target) { this.hide(); return; }
    const { card, after } = this.target;
    const x = this.columns ? Math.max(rect.left + 2, Math.min(rect.right - 6, after ? card.right + 2 : card.left - 6)) : card.left;
    const y = this.columns ? Math.max(rect.top + 2, card.top) : Math.max(rect.top + 2, Math.min(rect.bottom - 6, after ? card.bottom + 2 : card.top - 6));
    const width = this.columns ? 4 : card.right - card.left;
    const height = this.columns ? Math.max(0, Math.min(rect.bottom - 2, card.bottom) - y) : 4;
    Object.assign(this.overlay.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
    this.overlay.dataset.target = card.path; this.overlay.dataset.side = after ? 'after' : 'before'; this.overlay.dataset.axis = this.columns ? 'vertical' : 'horizontal';
    if (!this.overlay.isConnected) this.grid.ownerDocument.body.append(this.overlay);
  }
  private hide(): void { this.overlay.remove(); this.target = null; }
  private clear(): void {
    if (this.frame) this.win.cancelAnimationFrame(this.frame); this.frame = 0;
    this.point = null; this.cards = null; this.paths.clear(); this.hide();
    for (const el of Array.from(this.grid.querySelectorAll('.is-dragging'))) el.classList.remove('is-dragging');
  }
}
