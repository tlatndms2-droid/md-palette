import { ItemView, Menu, TFile, WorkspaceLeaf } from 'obsidian';
import type MDPalettePlugin from './main';

// Obsidian exposes no public embedded Local Graph API. Isolate its registered
// native view adapter here and check capabilities before using it.
interface LocalGraph extends ItemView {
  file: TFile | null;
  open(parent: HTMLElement): Promise<void>;
  close(): Promise<void>;
  update(): void;
  onResize(): void;
  onFileOpen(file: TFile | null): void;
  onOptionsChange(): void;
  engine: { getOptions(): Record<string, unknown>; setOptions(options: Record<string, unknown>): void };
  renderer: { onNodeClick(event: MouseEvent, path: string, type: string): void; onNodeRightClick(event: MouseEvent, path: string, type: string): void };
}
export class NativeLocalGraph {
  private view?: LocalGraph;
  private observer?: ResizeObserver;
  private opening?: Promise<void>;
  constructor(private plugin: MDPalettePlugin, private leaf: WorkspaceLeaf) {}
  mount(host: HTMLElement, main: TFile): void {
    host.addClass('mdp-native-graph');
    const registry = (this.plugin.app as unknown as { viewRegistry?: { viewByType?: Record<string, (leaf: WorkspaceLeaf) => LocalGraph> } }).viewRegistry;
    const factory = registry?.viewByType?.localgraph;
    if (!factory) { this.destroy(); host.createDiv({ cls: 'mdp-muted', text: 'Obsidian 설정 → 코어 플러그인에서 그래프 보기를 켜주세요.' }); return; }
    if (!this.view) {
      const view = factory(this.leaf);
      if (!view.engine?.getOptions || !view.engine?.setOptions || !view.renderer || !view.update || !view.open || !view.close) {
        void view.close?.(); host.createDiv({ cls: 'mdp-muted', text: '이 Obsidian 버전의 기본 로컬 그래프를 불러올 수 없습니다.' }); return;
      }
      this.view = view;
      view.containerEl.addClass('mdp-native-graph-view');
      // A native local graph normally follows the active editor. This embedded
      // instance follows MD Palette Main, without pinning or changing user leaves.
      view.onFileOpen = () => {};
      view.onOptionsChange = () => {
        if (this.view !== view) return;
        this.plugin.connections.graphOptions = structuredClone(view.engine.getOptions());
        this.plugin.saveConnections();
      };
      const nativeClick = view.renderer.onNodeClick;
      const nativeRightClick = view.renderer.onNodeRightClick;
      view.renderer.onNodeClick = (event, path, type) => {
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) this.plugin.run(() => this.plugin.openIn(file.extension === 'md' ? 'sub' : 'reference', file));
        else if (type === 'tag') nativeClick.call(view.renderer, event, path, type);
      };
      view.renderer.onNodeRightClick = (event, path, type) => {
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) { if (type === 'tag') nativeRightClick.call(view.renderer, event, path, type); return; }
        const menu = new Menu();
        if (file.extension === 'md') menu.addItem(item => item.setTitle('Sub Space에서 열기').setIcon('link').onClick(() => this.plugin.run(() => this.plugin.openIn('sub', file))));
        menu.addItem(item => item.setTitle('Reference Space에서 열기').setIcon('file-search').onClick(() => this.plugin.run(() => this.plugin.openIn('reference', file))));
        menu.showAtMouseEvent(event);
      };
      view.file = main;
      this.opening = view.open(host).then(() => {
        if (this.view !== view) return;
        view.engine.setOptions(this.plugin.connections.graphOptions ?? { close: true });
        view.update(); view.onResize();
      }).catch(error => {
        console.error('MD Palette native Local Graph:', error);
        if (this.view === view) { this.destroy(); host.createDiv({ cls: 'mdp-muted', text: '기본 로컬 그래프를 불러오지 못했습니다.' }); }
      });
    } else {
      host.append(this.view.containerEl);
      if (this.view.file !== main) { this.view.file = main; this.view.update(); }
      this.view.onResize();
    }
    this.observer?.disconnect();
    this.observer = new ResizeObserver(() => this.view?.onResize());
    this.observer.observe(host);
  }
  detach(): void { this.observer?.disconnect(); this.view?.containerEl.remove(); }
  destroy(): void {
    this.observer?.disconnect(); this.observer = undefined;
    const view = this.view; this.view = undefined;
    if (view) void view.close().catch(error => console.error('MD Palette graph cleanup:', error));
    this.opening = undefined;
  }
}
