import { Menu, Notice, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import type MDPalettePlugin from './main';
import { ConnectionPicker } from './card-view';
import { NativeLocalGraph } from './native-local-graph';
import { relations, sectionKeys, type SectionKey } from './connections-state';

export class ConnectionsView {
  private root?: HTMLElement;
  private mainPath = '';
  private scroll: Partial<Record<SectionKey, number>> = {};
  private selected?: string;
  private cancelDrag?: () => void;
  private nativeGraph: NativeLocalGraph;
  private relationKey = '';
  constructor(private plugin: MDPalettePlugin, leaf: WorkspaceLeaf) { this.nativeGraph = new NativeLocalGraph(plugin, leaf); plugin.register(() => this.destroy()); }
  destroy(): void { this.prepareRender(); this.nativeGraph.destroy(); }
  isCurrent(): boolean {
    const main = this.plugin.mainFile;
    if (!main || main.path !== this.mainPath || !this.root?.isConnected) return false;
    return this.relationKey === JSON.stringify(relations(this.plugin.app.metadataCache.resolvedLinks, main.path, new Set(this.plugin.app.vault.getMarkdownFiles().map(f => f.path))));
  }
  prepareRender(): void {
    this.nativeGraph.detach();
    this.cancelDrag?.(); this.cancelDrag = undefined;
    if (this.root?.isConnected) for (const key of sectionKeys) {
      const body = this.root.querySelector<HTMLElement>(`[data-section="${key}"] .mdp-connection-content`);
      if (body) this.scroll[key] = body.scrollTop;
    }
  }
  render(root: HTMLElement): void {
    this.root = root;
    const main = this.plugin.mainFile; if (!main) return;
    if (main.path !== this.mainPath) { this.mainPath = main.path; this.scroll = {}; this.selected = undefined; }
    root.className = 'mdp-connections';
    const add = root.createEl('button', { cls: 'mdp-add-connection', text: '+ 연결 파일 추가' });
    add.onclick = () => {
      const current = this.plugin.mainFile;
      if (!current) { new Notice('메인 스페이스를 먼저 지정해주세요.'); return; }
      new ConnectionPicker(this.plugin, current).open();
    };
    const links = this.plugin.app.metadataCache.resolvedLinks;
    const related = relations(links, main.path, new Set(this.plugin.app.vault.getMarkdownFiles().map(f => f.path)));
    this.relationKey = JSON.stringify(related);
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
      if (key === 'graph') this.nativeGraph.mount(body, main);
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
    if (element instanceof HTMLElement) this.plugin.bindFilePreview(element, file);
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
      menu.addItem(item => item.setTitle('Sub Space에서 열기').setIcon('link').onClick(() => this.plugin.run(() => this.plugin.openIn('sub', file))));
      menu.showAtMouseEvent(event as MouseEvent);
    });
  }
}
