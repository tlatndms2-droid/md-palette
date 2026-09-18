import { FuzzySuggestModal, Menu, Notice, Plugin, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import { activeIn, arrange, fileIn, groupOf, groupsIn, isCentral, markdownIn, newTab, type Group } from './workspace-adapter';
import { PaletteView, VIEW_TYPE } from './sidebar';
import { readSpaces, type LinkView, type SavedSpaces, type TopView } from './state';
import { readCards, pruneLabels, type CardState } from './cards-state';

type Role = 'sub' | 'reference';
class SpaceFilePicker extends FuzzySuggestModal<TFile> {
  constructor(private plugin: MDPalettePlugin, private role: Role) { super(plugin.app); this.setPlaceholder(role === 'sub' ? 'Sub Space에서 열 Markdown 파일' : 'Reference Space에서 열 파일'); }
  getItems(): TFile[] { return this.app.vault.getFiles().filter(file => this.role === 'reference' || file.extension === 'md'); }
  getItemText(file: TFile): string { return file.path; }
  onChooseItem(file: TFile): void { this.plugin.run(() => this.plugin.openIn(this.role, file)); }
}

export default class MDPalettePlugin extends Plugin {
  mainGroup?: Group;
  subGroup?: Group;
  referenceGroup?: Group;
  private emptySub?: Group;
  topView: TopView = 'link';
  linkView: LinkView = 'card';
  cards: CardState = readCards(null);
  private cardTimer?: number;
  private data: Record<string, unknown> = {};
  private saveAllowed = true;
  private saveChain: Promise<void> = Promise.resolve();
  private persistedJSON = '';
  private saveTimer?: number;
  private syncTimer?: number;
  private busy = false;
  private stopped = false;
  private ready = false;
  private invalidMainKey = '';
  private lastRenderKey = '';
  private decorated: HTMLElement[] = [];
  get mainFile(): TFile | null { return markdownIn(this.app, this.mainGroup); }

  async onload(): Promise<void> {
    try {
      const loaded: unknown = await this.loadData();
      if (loaded != null && (typeof loaded !== 'object' || Array.isArray(loaded))) throw Error('invalid data');
      this.data = (loaded as Record<string, unknown>) ?? {};
      this.persistedJSON = JSON.stringify(this.data);
    } catch {
      this.saveAllowed = false;
      new Notice('MD Palette 저장 상태를 읽지 못했습니다. 기존 데이터는 덮어쓰지 않습니다.');
    }
    if (this.data.topView === 'metadata') this.topView = 'metadata';
    if (this.data.linkView === 'connections' || this.data.linkView === 'folder') this.linkView = this.data.linkView;
    this.cards = readCards(this.data.cards);
    this.registerView(VIEW_TYPE, leaf => new PaletteView(leaf, this));
    this.addRibbonIcon('panels-top-left', 'MD Palette 열기', () => this.run(() => this.openSidebar()));
    this.addCommand({ id: 'open-sidebar', name: '사이드바 열기', callback: () => this.run(() => this.openSidebar()) });
    this.addCommand({ id: 'set-main', name: '메인 스페이스로 지정', callback: () => this.run(() => this.setMain(this.app.workspace.getMostRecentLeaf())) });
    this.addCommand({ id: 'switch-main-sub', name: '메인 / 서브 전환', callback: () => this.run(() => this.switchFiles()) });
    for (const role of ['sub', 'reference'] as const) this.addCommand({ id: `open-${role}`, name: `${role === 'sub' ? 'Sub' : 'Reference'} Space에서 파일 열기`, callback: () => {
      if (!this.mainFile) { new Notice('메인 스페이스를 먼저 지정해주세요.'); return; }
      new SpaceFilePicker(this, role).open();
    } });
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source, leaf) => {
      if (!(file instanceof TFile)) return;
      if (source === 'tab-header' && leaf && activeIn(groupOf(leaf)) === leaf) {
        if (file.extension === 'md' && groupOf(leaf) !== this.subGroup) menu.addItem(item => item.setTitle('메인 스페이스로 지정').setIcon('book-open').onClick(() => this.run(() => this.setMain(leaf))));
        if (groupOf(leaf) === this.mainGroup) menu.addItem(item => item.setTitle('메인 / 서브 전환').setIcon('arrow-left-right').onClick(() => this.run(() => this.switchFiles())));
      }
      if (this.mainFile) {
        menu.addSeparator();
        if (file.extension === 'md') menu.addItem(item => item.setTitle('Sub Space에서 열기').setIcon('link').onClick(() => this.run(() => this.openIn('sub', file))));
        menu.addItem(item => item.setTitle('Reference Space에서 열기').setIcon('file-search').onClick(() => this.run(() => this.openIn('reference', file))));
      }
    }));
    const schedule = () => this.scheduleSync();
    this.registerEvent(this.app.workspace.on('layout-change', schedule));
    this.registerEvent(this.app.workspace.on('active-leaf-change', schedule));
    this.registerEvent(this.app.workspace.on('file-open', schedule));
    this.registerEvent(this.app.vault.on('rename', schedule));
    this.registerEvent(this.app.vault.on('delete', schedule));
    const refreshCards = () => {
      window.clearTimeout(this.cardTimer);
      this.cardTimer = window.setTimeout(() => { if (!this.stopped) this.render(); }, 200);
    };
    this.registerEvent(this.app.metadataCache.on('resolved', refreshCards));
    this.registerEvent(this.app.vault.on('modify', file => { if (file instanceof TFile && (file === this.mainFile || this.connectedFiles().includes(file))) refreshCards(); }));
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
      const renamed = (p: string) => p === oldPath ? file.path : p.startsWith(oldPath + '/') ? file.path + p.slice(oldPath.length) : p;
      this.cards.order = this.cards.order.map(renamed);
      for (const path of Object.keys(this.cards.assignments)) { const next = renamed(path); if (next !== path) { this.cards.assignments[next] = this.cards.assignments[path]; delete this.cards.assignments[path]; } }
      this.cardsChanged();
    }));
    this.registerEvent(this.app.vault.on('delete', file => {
      if (!(file instanceof TFile)) return;
      this.cards.order = this.cards.order.filter(p => p !== file.path); delete this.cards.assignments[file.path]; pruneLabels(this.cards); this.cardsChanged();
    }));
    this.app.workspace.onLayoutReady(() => {
      if (this.stopped) return;
      this.restore(); this.ready = true; this.sync(false);
    });
  }

  onunload(): void {
    window.clearTimeout(this.cardTimer);
    window.clearTimeout(this.syncTimer);
    window.clearTimeout(this.saveTimer);
    this.flushState();
    this.stopped = true;
    this.clearIcons();
    // Persisted roles stay intact for the next load; no user tabs are closed.
  }
  run(action: () => Promise<unknown>): void {
    if (this.busy) return;
    this.busy = true;
    void action().catch(error => {
      console.error('MD Palette:', error);
      new Notice('MD Palette 작업을 완료하지 못했습니다. 파일은 삭제하지 않았습니다.');
    }).finally(() => { this.busy = false; if (!this.stopped) { this.sync(false); this.persist(); } });
  }

  async setMain(leaf: WorkspaceLeaf | null): Promise<void> {
    const group = groupOf(leaf);
    const file = fileIn(this.app, leaf ?? undefined);
    if (!leaf || !group || !isCentral(this.app, group) || file?.extension !== 'md' || leaf.getViewState().type !== 'markdown') { new Notice('메인 스페이스는 Markdown 파일만 지정할 수 있습니다.'); return; }
    if (group === this.subGroup) { new Notice('서브 스페이스에서는 메인을 지정할 수 없습니다.'); return; }
    if (group === this.mainGroup) { await this.openSidebar(); return; }
    const oldSub = this.subGroup;
    const oldReference = this.referenceGroup;
    for (const candidate of [group, oldSub, this.emptySub, oldReference]) {
      if (candidate && (!candidate.parent || typeof candidate.parent.insertChild !== 'function' || typeof candidate.parent.removeChild !== 'function')) throw Error('지원하지 않는 탭 그룹 구조입니다.');
    }
    let blank: WorkspaceLeaf | undefined;
    if (oldSub && oldSub !== group) {
      const previousActive = activeIn(oldSub);
      blank = newTab(this.app, oldSub);
      try { await blank.setViewState({ type: 'empty', state: {} }); }
      catch (error) {
        blank.detach();
        if (previousActive) this.app.workspace.setActiveLeaf(previousActive, { focus: false });
        this.app.workspace.setActiveLeaf(leaf, { focus: true });
        throw error;
      }
    }
    this.mainGroup = group; this.subGroup = undefined; this.referenceGroup = undefined;
    if (blank && oldSub) {
      for (const oldLeaf of [...oldSub.children]) if (oldLeaf !== blank) oldLeaf.detach();
      this.emptySub = oldSub;
    }
    if (this.emptySub === group) this.emptySub = undefined;
    if (oldReference && oldReference !== group) for (const oldLeaf of [...oldReference.children]) oldLeaf.detach();
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    arrange(this.app, group, this.emptySub ? [this.emptySub] : []);
    await this.openSidebar();
  }

  async openIn(role: Role, file: TFile): Promise<void> {
    if (!this.mainFile || !this.mainGroup) { new Notice('메인 스페이스를 먼저 지정해주세요.'); return; }
    if (role === 'sub' && file.extension !== 'md') return;
    if (this.app.vault.getAbstractFileByPath(file.path) !== file) return;
    let group = role === 'sub' ? this.subGroup : this.referenceGroup;
    if (role === 'sub' && !group && this.emptySub && groupsIn(this.app).includes(this.emptySub)) group = this.emptySub;
    let leaf: WorkspaceLeaf | undefined;
    let created = false;
    if (group && role === 'reference') leaf = group.children.find(l => fileIn(this.app, l)?.path === file.path);
    if (leaf) { await this.app.workspace.revealLeaf(leaf); return; }
    if (!group) {
      const anchor = activeIn(role === 'reference' ? this.subGroup ?? this.emptySub ?? this.mainGroup : this.mainGroup);
      if (!anchor) return;
      leaf = this.app.workspace.createLeafBySplit(anchor, 'vertical');
      group = groupOf(leaf); created = true;
    } else leaf = role === 'sub' ? activeIn(group) : newTab(this.app, group);
    if (!leaf || !group) return;
    const previous = leaf.getViewState();
    try { await leaf.openFile(file, { active: true }); }
    catch (error) { if (created || role === 'reference') leaf.detach(); else await leaf.setViewState(previous); throw error; }
    if (role === 'sub') { this.subGroup = group; this.emptySub = undefined; }
    else this.referenceGroup = group;
    this.enforceOrder(false);
  }

  async switchFiles(): Promise<void> {
    if (!this.subGroup) { new Notice('서브 스페이스가 없어 전환할 수 없습니다.'); return; }
    const mainLeaf = activeIn(this.mainGroup), subLeaf = activeIn(this.subGroup);
    const mainFile = this.mainFile, subFile = markdownIn(this.app, this.subGroup);
    if (!mainLeaf || !subLeaf || !mainFile || !subFile) { new Notice('메인과 서브에서 Markdown 파일을 활성화해주세요.'); return; }
    if (mainFile === subFile) return;
    const mainState = mainLeaf.getViewState(), subState = subLeaf.getViewState();
    try {
      await mainLeaf.openFile(subFile, { active: false });
      await subLeaf.openFile(mainFile, { active: false });
      this.app.workspace.setActiveLeaf(mainLeaf, { focus: true });
    } catch (error) {
      await mainLeaf.setViewState(mainState); await subLeaf.setViewState(subState); throw error;
    }
  }

  async openSidebar(): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) { const right = this.app.workspace.getRightLeaf(false); if (!right) return; leaf = right; await leaf.setViewState({ type: VIEW_TYPE, active: true }); }
    await this.app.workspace.revealLeaf(leaf);
    this.render();
  }
  selectView(top: TopView, link = this.linkView): void { this.topView = top; this.linkView = link; this.render(); this.persist(); }
  cardsChanged(): void { this.render(); this.persist(); }
  saveCardOrder(): void { this.persist(); }
  connectedFiles(main = this.mainFile): TFile[] {
    if (!main) return [];
    const links = this.app.metadataCache.resolvedLinks;
    const paths = new Set(Object.keys(links[main.path] ?? {}));
    for (const [source, targets] of Object.entries(links)) if (targets[main.path]) paths.add(source);
    paths.delete(main.path);
    const files = [...paths].map(p => this.app.vault.getAbstractFileByPath(p)).filter((f): f is TFile => f instanceof TFile);
    const known = new Set(this.cards.order);
    let changed = false;
    for (const f of files) if (!known.has(f.path)) { this.cards.order.push(f.path); known.add(f.path); changed = true; }
    if (changed) this.persist();
    const rank = new Map(this.cards.order.map((p, i) => [p, i]));
    return files.sort((a, b) => rank.get(a.path)! - rank.get(b.path)!);
  }
  async addConnection(main: TFile, file: TFile): Promise<void> {
    if (this.mainFile !== main || this.app.vault.getAbstractFileByPath(main.path) !== main || this.app.vault.getAbstractFileByPath(file.path) !== file) { new Notice('메인 또는 선택 파일이 변경되어 연결을 취소했습니다.'); return; }
    if (main === file || this.connectedFiles(main).some(f => f.path === file.path)) { new Notice('이미 메인 스페이스와 연결된 파일입니다.'); return; }
    // Properties resolve wikilinks independently of the editor's Markdown-link preference.
    const link = `[[${file.path}]]`;
    await this.app.fileManager.processFrontMatter(main, frontmatter => {
      if (this.mainFile !== main) throw Error('Main changed before connection write');
      const current: unknown = frontmatter['link note'];
      if (current != null && typeof current !== 'string' && !Array.isArray(current)) throw Error('link note must be text or a list');
      const values: unknown[] = current == null ? [] : Array.isArray(current) ? current : [current];
      if (!values.every(v => typeof v === 'string')) throw Error('link note contains unsupported values');
      const already = values.some(v => {
        const text = v as string;
        const path = text.match(/^!?\[\[([^\]|#]+)(?:[^\]]*)\]\]$/)?.[1] ?? text.match(/^\[[^\]]*\]\(([^)]+)\)$/)?.[1];
        if (!path) return false;
        let decoded = path; try { decoded = decodeURIComponent(path); } catch {}
        return this.app.metadataCache.getFirstLinkpathDest(decoded, main.path)?.path === file.path;
      });
      if (!already) frontmatter['link note'] = [...values, link];
    });
    this.render();
  }
  private render(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) if (leaf.view instanceof PaletteView) leaf.view.render();
  }
  private scheduleSync(): void {
    if (this.stopped || !this.ready || this.busy || this.syncTimer !== undefined) return;
    this.syncTimer = window.setTimeout(() => { this.syncTimer = undefined; if (!this.busy && !this.stopped) this.sync(true); }, 30);
  }
  private sync(notify: boolean): void {
    const live = groupsIn(this.app);
    if (this.mainGroup && (!live.includes(this.mainGroup) || this.mainGroup.children.every(l => l.getViewState().type === 'empty'))) { this.mainGroup = this.subGroup = this.referenceGroup = this.emptySub = undefined; }
    if (this.subGroup && (!live.includes(this.subGroup) || !this.subGroup.children.some(l => fileIn(this.app, l)?.extension === 'md'))) this.subGroup = undefined;
    if (this.referenceGroup && (!live.includes(this.referenceGroup) || !this.referenceGroup.children.some(l => fileIn(this.app, l)))) this.referenceGroup = undefined;
    if (this.emptySub && (!live.includes(this.emptySub) || this.emptySub.children.some(l => l.getViewState().type !== 'empty'))) this.emptySub = undefined;
    if (this.mainGroup) {
      this.busy = true;
      try { this.enforceOrder(notify); }
      catch (error) { console.error('MD Palette layout:', error); }
      finally { this.busy = false; }
    }
    const leaf = activeIn(this.mainGroup);
    const invalid = this.mainGroup && !this.mainFile ? `${this.mainGroup.currentTab}:${leaf?.getViewState().type}:${fileIn(this.app, leaf)?.path ?? ''}` : '';
    if (invalid && invalid !== this.invalidMainKey) new Notice('메인 스페이스에서는 Markdown 파일을 활성화해주세요.');
    this.invalidMainKey = invalid;
    this.updateIcons();
    const key = `${this.mainGroup?.id}:${this.mainFile?.path}:${this.topView}:${this.linkView}`;
    if (key !== this.lastRenderKey) { this.lastRenderKey = key; this.render(); }
    this.persist();
  }
  private enforceOrder(notify: boolean): void {
    if (!this.mainGroup) return;
    const followers = [this.subGroup ?? this.emptySub, this.referenceGroup].filter((g): g is Group => !!g);
    if (arrange(this.app, this.mainGroup, followers) && notify) new Notice('스페이스 순서는 변경할 수 없습니다.');
  }
  private clearIcons(): void {
    for (const el of this.decorated) el.remove();
    this.decorated = [];
  }
  private updateIcons(): void {
    this.clearIcons();
    for (const [group, icon, label] of [[this.mainGroup, 'book-open', 'Main Space'], [this.subGroup, 'link', 'Sub Space'], [this.referenceGroup, 'file-search', 'Reference Space']] as const) {
      if (!group) continue;
      const leaf = activeIn(group) as (WorkspaceLeaf & { tabHeaderEl?: HTMLElement }) | undefined;
      const header = leaf?.tabHeaderEl;
      const title = header?.querySelector('.workspace-tab-header-inner-title');
      if (!header || !title) continue;
      const marker = header.ownerDocument.createElement('span');
      marker.className = 'mdp-space-icon'; marker.setAttribute('aria-label', label); marker.setAttribute('title', label);
      setIcon(marker, icon); title.before(marker); this.decorated.push(marker);
    }
  }
  private restore(): void {
    const saved = readSpaces(this.data.spaces);
    const live = groupsIn(this.app);
    const find = (id?: string) => live.find(g => g.id === id && isCentral(this.app, g));
    const main = find(saved.main?.groupId);
    if (!main || !markdownIn(this.app, main)) return;
    this.mainGroup = main;
    const sub = find(saved.sub?.groupId), ref = find(saved.reference?.groupId);
    if (sub && sub !== main && sub.children.some(l => fileIn(this.app, l)?.extension === 'md')) this.subGroup = sub;
    if (ref && ref !== main && ref !== sub && ref.children.some(l => fileIn(this.app, l))) this.referenceGroup = ref;
    const empty = find(saved.emptySubId);
    if (!this.subGroup && empty && empty !== main && empty !== ref && empty.children.every(l => l.getViewState().type === 'empty')) this.emptySub = empty;
  }
  private persist(): void {
    if (this.stopped || !this.ready || !this.saveAllowed) return;
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.flushState(), 250);
  }
  private flushState(): void {
    if (!this.ready || !this.saveAllowed) return;
    const space = (g?: Group) => g ? { groupId: g.id, activeFile: fileIn(this.app, activeIn(g))?.path ?? null } : undefined;
    const spaces: SavedSpaces = { main: space(this.mainGroup), sub: space(this.subGroup), reference: space(this.referenceGroup), emptySubId: this.emptySub?.id };
    const next = { ...this.data, spaces, topView: this.topView, linkView: this.linkView, cards: structuredClone(this.cards) };
    const serialized = JSON.stringify(next);
    if (serialized === this.persistedJSON) return;
    this.data = next;
    this.saveChain = this.saveChain.then(async () => {
      await this.saveData(next);
      this.persistedJSON = serialized;
    }).catch(error => { console.error('MD Palette save:', error); new Notice('MD Palette 상태를 저장하지 못했습니다.'); });
  }
}
