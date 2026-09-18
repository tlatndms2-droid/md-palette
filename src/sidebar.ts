import { ItemView, WorkspaceLeaf, setIcon } from 'obsidian';
import type MDPalettePlugin from './main';
import type { LinkView, TopView } from './state';
import { CardView } from './card-view';
import { ConnectionsView } from './connections-view';

export const VIEW_TYPE = 'md-palette-sidebar';
export class PaletteView extends ItemView {
  private cards: CardView;
  private connections: ConnectionsView;
  constructor(leaf: WorkspaceLeaf, private plugin: MDPalettePlugin) { super(leaf); this.cards = new CardView(plugin); this.connections = new ConnectionsView(plugin); }
  getViewType(): string { return VIEW_TYPE; }
  getDisplayText(): string { return 'MD Palette'; }
  getIcon(): string { return 'panels-top-left'; }
  async onOpen(): Promise<void> { this.render(); }
  async onClose(): Promise<void> { this.cards.destroy(); this.connections.destroy(); }
  render(): void {
    this.cards.destroy();
    this.connections.destroy();
    const root = this.contentEl;
    root.empty(); root.addClass('mdp-sidebar');
    const heading = root.createDiv({ cls: 'mdp-heading' });
    setIcon(heading.createSpan({ cls: 'mdp-heading-icon' }), 'panels-top-left');
    heading.createSpan({ text: 'MD Palette' });
    const context = root.createDiv({ cls: 'mdp-main-context' });
    setIcon(context.createSpan(), 'book-open');
    context.createSpan({ text: this.plugin.mainFile ? `Main · ${this.plugin.mainFile.name}` : 'Main 없음' });
    const top = root.createDiv({ cls: 'mdp-tabs', attr: { role: 'tablist', 'aria-label': 'MD Palette 보기' } });
    for (const [value, title] of [['link', 'Link View'], ['metadata', 'Metadata View']] as [TopView, string][]) {
      this.tab(top, title, this.plugin.topView === value, () => this.plugin.selectView(value));
    }
    if (this.plugin.topView === 'link') {
      const tabs = root.createDiv({ cls: 'mdp-tabs mdp-link-tabs', attr: { role: 'tablist', 'aria-label': 'Link View 형식' } });
      for (const [value, title] of [['card', 'Card'], ['connections', 'Connections'], ['folder', 'Folder']] as [LinkView, string][]) {
        this.tab(tabs, title, this.plugin.linkView === value, () => this.plugin.selectView('link', value));
      }
    }
    const body = root.createDiv({ cls: 'mdp-empty', attr: { role: 'tabpanel' } });
    if (!this.plugin.mainGroup) {
      setIcon(body.createDiv({ cls: 'mdp-empty-icon' }), 'book-open');
      body.createEl('p', { text: '메인 스페이스를 먼저 지정해주세요.' });
      body.createEl('p', { text: 'Markdown 탭 제목을 우클릭한 뒤 “메인 스페이스로 지정”을 선택하세요.', cls: 'mdp-muted' });
    } else if (!this.plugin.mainFile) {
      body.createEl('p', { text: '메인 스페이스에서는 Markdown 파일을 활성화해주세요.' });
    } else if (this.plugin.topView === 'link' && this.plugin.linkView === 'card') {
      this.cards.render(body);
    } else if (this.plugin.topView === 'link' && this.plugin.linkView === 'connections') {
      this.connections.render(body);
    } else {
      const label = this.plugin.topView === 'metadata' ? 'Metadata' : ({ card: 'Card', connections: 'Connections', folder: 'Folder' }[this.plugin.linkView]);
      body.createEl('p', { text: `${label} View는 다음 구현 단계에서 제공됩니다.` });
      body.createEl('p', { text: '현재는 Space 지정·파일 열기·메인/서브 전환을 사용할 수 있습니다.', cls: 'mdp-muted' });
    }
  }
  private tab(root: HTMLElement, title: string, selected: boolean, onClick: () => void): void {
    const button = root.createEl('button', { text: title, cls: selected ? 'mdp-tab is-selected' : 'mdp-tab', attr: { role: 'tab', 'aria-selected': String(selected) } });
    button.addEventListener('click', onClick);
  }
}
