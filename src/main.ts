import { FuzzySuggestModal, MarkdownView, Menu, Notice, Plugin, TFile, TextFileView, WorkspaceLeaf, parseLinktext, setIcon } from 'obsidian';
import { activeIn, arrange, fileIn, groupOf, groupsIn, isCentral, newTab, type Group } from './workspace-adapter';
import { PaletteView, VIEW_TYPE } from './sidebar';
import { readSpaces, subOpenMode, type SubOpenMode, type LinkView, type SavedSpaces, type TopView } from './state';
import { readCards, pruneLabels, type CardState } from './cards-state';
import { readConnections } from './connections-state';
import { readFolders, readDocumentFolders, fileKey, type FolderState } from './folders-state';
import { ReuseDrag } from './reuse-drag';
import { newNoteName } from './new-note-name';

type Role = 'sub';
class SpaceFilePicker extends FuzzySuggestModal<TFile> {
  constructor(private plugin: MDPalettePlugin, private role: Role) { super(plugin.app); this.setPlaceholder('Sub Space에서 열 파일'); }
  getItems(): TFile[] { return this.app.vault.getFiles(); }
  getItemText(file: TFile): string { return file.path; }
  onChooseItem(file: TFile): void { this.plugin.run(() => this.plugin.openIn(this.role, file)); }
}

export default class MDPalettePlugin extends Plugin {
  reuseDrag!: ReuseDrag;
  mainGroup?: Group;
  mainLeaf?: WorkspaceLeaf;
  private pinnedMain?: TFile;
  metadataCollapsed: string[] = [];
  metadataFontSize?: number;
  subGroup?: Group;
  subGroups: Group[] = [];
  isSub(group?: Group): boolean { return !!group && this.subGroups.includes(group); }
  openFileGesture(file: TFile, event?: MouseEvent): void { this.run(() => this.openIn('sub', file, '', subOpenMode(event))); }
  topView: TopView = 'link';
  linkView: LinkView = 'card';
  cards: CardState = readCards(null);
  connections = readConnections(null);
  private foldersByMain: Record<string, FolderState> = Object.create(null);
  private folderDefaults = readFolders(null);
  get folders(): FolderState {
    const path = this.mainFile?.path;
    if (!path) return readFolders(this.folderDefaults);
    return this.foldersByMain[path] ??= readFolders(this.folderDefaults);
  }
  private folderSaving = false;
  private cardTimer?: number;
  private data: Record<string, unknown> = {};
  private saveAllowed = true;
  private saveChain: Promise<void> = Promise.resolve();
  private persistedJSON = '';
  private saveTimer?: number;
  private syncTimer?: number;
  private busy = false;
  private creatingNote = false;
  private stopped = false;
  private ready = false;
  private invalidMainKey = '';
  private lastRenderKey = '';
  private lastContentKey = '';
  private decorated: HTMLElement[] = [];
  get mainFile(): TFile | null { return this.mainLeaf && this.pinnedMain && fileIn(this.app, this.mainLeaf) === this.pinnedMain && this.mainLeaf.getViewState().type === 'markdown' ? this.pinnedMain : null; }

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
    this.connections = readConnections(this.data.connections);
    this.metadataCollapsed = Array.isArray(this.data.metadataCollapsed) ? this.data.metadataCollapsed.filter((v): v is string => typeof v === 'string') : [];
    const metadataFontSize = this.data.metadataFontSize;
    if (typeof metadataFontSize === 'number' && Number.isFinite(metadataFontSize)) this.metadataFontSize = Math.max(10, Math.min(32, Math.round(metadataFontSize)));
    this.foldersByMain = readDocumentFolders(this.data.foldersByMain);
    // Keep display preferences while discarding only the old test folder organization.
    const legacy = readFolders(this.data.folderDefaults ?? this.data.folders);
    this.folderDefaults = readFolders({ ...legacy, display: 'compact', folders: [], positions: {}, order: [], current: '', collapsed: [] });
    delete this.data.folders;
    this.registerView(VIEW_TYPE, leaf => new PaletteView(leaf, this));
    this.registerHoverLinkSource('md-palette', { display: 'MD Palette 파일', defaultMod: true });
    this.routeMainLinks();
    this.reuseDrag = new ReuseDrag(this);
    this.register(() => this.reuseDrag.destroy());
    this.addRibbonIcon('panels-top-left', 'MD Palette 열기', () => this.run(() => this.openSidebar()));
    this.addCommand({ id: 'open-sidebar', name: '사이드바 열기', callback: () => this.run(() => this.openSidebar()) });
    this.addCommand({ id: 'set-main', name: '메인 스페이스 지정/해제', callback: () => this.run(() => this.toggleMain(this.app.workspace.getMostRecentLeaf())) });
    for (const role of ['sub'] as const) this.addCommand({ id: `open-${role}`, name: `Sub Space에서 파일 열기`, callback: () => {
      if (!this.mainFile) { new Notice('메인 스페이스를 먼저 지정해주세요.'); return; }
      new SpaceFilePicker(this, role).open();
    } });
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source, leaf) => {
      if (!(file instanceof TFile)) return;
      if (source === 'tab-header' && leaf) {
        if (file.extension === 'md' && !this.isSub(groupOf(leaf)) && leaf !== this.mainLeaf) menu.addItem(item => item.setTitle('메인 스페이스로 지정').setIcon('book-open').onClick(() => this.run(() => this.setMain(leaf))));
        if (leaf === this.mainLeaf) menu.addItem(item => item.setTitle('메인 스페이스 지정 해제').setIcon('book-open').onClick(() => this.run(() => this.unsetMain())));
      }
      if (this.mainFile) {
        menu.addSeparator();
        menu.addItem(item => item.setTitle('Sub Space에서 열기').setIcon('link').onClick(() => this.run(() => this.openIn('sub', file))));
      }
    }));
    const schedule = () => this.scheduleSync();
    this.registerEvent(this.app.workspace.on('layout-change', schedule));
    this.registerEvent(this.app.workspace.on('active-leaf-change', leaf => {
      const group = groupOf(leaf);
      if (this.isSub(group)) { this.subGroup = group; this.persist(); }
      schedule();
    }));
    this.registerEvent(this.app.workspace.on('file-open', schedule));
    this.registerEvent(this.app.vault.on('rename', schedule));
    this.registerEvent(this.app.vault.on('delete', schedule));
    const refreshCards = () => {
      window.clearTimeout(this.cardTimer);
      this.cardTimer = window.setTimeout(() => {
        if (this.stopped) return;
        // Typing in Main need not rebuild thousands of unchanged file cards.
        if (this.topView === 'link' && this.linkView !== 'connections' && this.contentKey() === this.lastContentKey) return;
        this.render();
      }, 200);
    };
    this.registerEvent(this.app.metadataCache.on('resolved', refreshCards));
    this.registerEvent(this.app.workspace.on('editor-change', (_editor, info) => { if (info.file === this.mainFile && this.topView === 'metadata') refreshCards(); }));
    this.registerEvent(this.app.vault.on('modify', file => { if (file instanceof TFile && (file === this.mainFile || this.connectedFiles().includes(file))) refreshCards(); }));
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
      const renamed = (p: string) => p === oldPath ? file.path : p.startsWith(oldPath + '/') ? file.path + p.slice(oldPath.length) : p;
      this.cards.order = this.cards.order.map(renamed);
      const documents: Record<string, FolderState> = Object.create(null);
      for (const [path, state] of Object.entries(this.foldersByMain)) {
        state.order = state.order.map(k => k.startsWith('f:') ? fileKey(renamed(k.slice(2))) : k);
        const positions: Record<string, string> = Object.create(null);
        for (const [filePath, folder] of Object.entries(state.positions)) positions[renamed(filePath)] = folder;
        state.positions = positions; documents[renamed(path)] = state;
      }
      this.foldersByMain = documents;
      for (const path of Object.keys(this.cards.assignments)) { const next = renamed(path); if (next !== path) { this.cards.assignments[next] = this.cards.assignments[path]; delete this.cards.assignments[path]; } }
      this.cardsChanged();
    }));
    this.registerEvent(this.app.vault.on('delete', file => {
      if (!(file instanceof TFile)) return;
      delete this.foldersByMain[file.path];
      for (const state of Object.values(this.foldersByMain)) { delete state.positions[file.path]; state.order = state.order.filter(k => k !== fileKey(file.path)); }
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

  async toggleMain(leaf: WorkspaceLeaf | null): Promise<void> {
    if (leaf && leaf === this.mainLeaf && this.mainFile) await this.unsetMain();
    else await this.setMain(leaf);
  }

  async setMain(leaf: WorkspaceLeaf | null): Promise<void> {
    const group = groupOf(leaf);
    const file = fileIn(this.app, leaf ?? undefined);
    if (!leaf || !group || !isCentral(this.app, group) || file?.extension !== 'md' || leaf.getViewState().type !== 'markdown') { new Notice('메인 스페이스는 Markdown 파일만 지정할 수 있습니다.'); return; }
    if (this.isSub(group)) { new Notice('서브 스페이스에서는 메인을 지정할 수 없습니다.'); return; }
    if (leaf === this.mainLeaf) { await this.openSidebar(); return; }
    this.mainGroup = group; this.mainLeaf = leaf; this.pinnedMain = file; this.subGroup = undefined;
    this.subGroups = [];
    this.clearIcons();
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    await this.openSidebar();
  }

  async unsetMain(): Promise<void> {
    this.mainGroup = this.subGroup = undefined;
    this.subGroups = [];
    this.mainLeaf = undefined; this.pinnedMain = undefined;
    this.clearIcons(); this.render();
  }

  async openIn(_role: Role, file: TFile, subpath = '', mode: SubOpenMode = 'replace'): Promise<void> {
    if (!this.mainFile || !this.mainGroup) { new Notice('메인 스페이스를 먼저 지정해주세요.'); return; }
    if (this.app.vault.getAbstractFileByPath(file.path) !== file) return;
    const previous = this.app.workspace.getMostRecentLeaf();
    let group = this.subGroup;
    if (group && !groupsIn(this.app).includes(group)) group = undefined;
    const existing = mode !== 'group' ? group?.children.find(leaf => fileIn(this.app, leaf)?.path === file.path) : undefined;
    if (existing) {
      if (subpath) await existing.openFile(file, { active: true, eState: { subpath } });
      await this.app.workspace.revealLeaf(existing); this.app.workspace.setActiveLeaf(existing, { focus: true }); return;
    }
    const anchor = this.mainLeaf;
    if (!anchor) return;
    const replacing = mode === 'replace' && group ? activeIn(group) : undefined;
    const leaf = replacing ?? (mode !== 'group' && group ? newTab(this.app, group) : this.app.workspace.createLeafBySplit(activeIn(group) ?? anchor, 'vertical'));
    const oldState = replacing?.getViewState();
    if (replacing?.view instanceof TextFileView) await replacing.view.save();
    try { await leaf.openFile(file, { active: true, eState: subpath ? { subpath } : undefined }); }
    catch (error) { if (oldState) await leaf.setViewState(oldState); else leaf.detach(); if (previous) this.app.workspace.setActiveLeaf(previous, { focus: false }); throw error; }
    this.subGroup = groupOf(leaf);
    if (this.subGroup && !this.isSub(this.subGroup)) this.subGroups.push(this.subGroup);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    this.enforceOrder(false);
  }

  private routeMainLinks(): void {
    const workspace = this.app.workspace, original = workspace.openLinkText, plugin = this;
    const wrapped: typeof original = async function(this: typeof workspace, linktext, sourcePath, newLeaf, state) {
      if (!plugin.stopped && plugin.mainFile?.path === sourcePath && workspace.getMostRecentLeaf() === plugin.mainLeaf && !/^[a-z][a-z\d+.-]*:/i.test(linktext)) {
        const { path, subpath } = parseLinktext(linktext);
        const file = path ? plugin.app.metadataCache.getFirstLinkpathDest(path, sourcePath) : plugin.mainFile;
        if (file && file !== plugin.mainFile) {
          const main = plugin.mainLeaf;
          // Properties finishes focusing its editor after dispatching the link event.
          // Open after that event so an existing Sub tab also receives focus.
          await new Promise<void>(resolve => window.setTimeout(resolve, 0));
          if (plugin.stopped || plugin.mainLeaf !== main || plugin.mainFile?.path !== sourcePath) return;
          await plugin.openIn('sub', file, subpath); plugin.sync(false); plugin.persist(); return;
        }
        if (!file) { new Notice('대상 파일이 없습니다. Main 문서는 유지됩니다.'); return; }
      }
      return original.call(this, linktext, sourcePath, newLeaf, state);
    };
    workspace.openLinkText = wrapped;
    this.register(() => { if (workspace.openLinkText === wrapped) workspace.openLinkText = original; });
  }

  bindFilePreview(element: HTMLElement, file: TFile): void {
    const hoverParent = { hoverPopover: null };
    element.addEventListener('mouseover', event => {
      if ((event.target as HTMLElement).closest('button, input') || (event.relatedTarget instanceof Node && element.contains(event.relatedTarget))) return;
      this.app.workspace.trigger('hover-link', { event, source: 'md-palette', hoverParent, targetEl: element, linktext: file.path, sourcePath: this.mainFile?.path ?? '' });
    });
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
  saveConnections(): void { this.persist(); }
  saveMetadata(): void { this.persist(); }
  async mainText(file: TFile): Promise<string> {
    const view = this.mainLeaf?.view;
    return this.mainFile === file && view instanceof MarkdownView ? view.editor.getValue() : this.app.vault.read(file);
  }
  async patchMain(file: TFile, original: string, from: number, to: number, replacement: string): Promise<void> {
    if (this.mainFile !== file) throw Error('Main이 변경되었습니다. 다시 확인해주세요.');
    const view = this.mainLeaf?.view;
    if (view instanceof MarkdownView) {
      if (view.editor.getValue() !== original || await this.app.vault.read(file) !== original) throw Error('원문이 변경되었습니다. 최신 내용을 확인한 뒤 다시 편집해주세요.');
      view.editor.replaceRange(replacement, view.editor.offsetToPos(from), view.editor.offsetToPos(to));
      try { await view.save(); }
      catch (error) {
        const changed = original.slice(0, from) + replacement + original.slice(to);
        if (view.editor.getValue() === changed && await this.app.vault.read(file) === original) view.editor.replaceRange(original.slice(from, to), view.editor.offsetToPos(from), view.editor.offsetToPos(from + replacement.length));
        throw error;
      }
    } else {
      await this.app.vault.process(file, current => {
        if (this.mainFile !== file || current !== original) throw Error('원문이 변경되었습니다. 최신 내용을 확인해주세요.');
        return current.slice(0, from) + replacement + current.slice(to);
      });
    }
    this.render();
  }
  async navigateMain(file: TFile, offset: number): Promise<void> {
    if (this.mainFile !== file || !this.mainLeaf) return;
    const leaf = this.mainLeaf;
    await this.app.workspace.revealLeaf(leaf);
    await leaf.setViewState({ ...leaf.getViewState(), state: { ...leaf.getViewState().state, mode: 'source' } });
    if (leaf.view instanceof MarkdownView) {
      const editor = leaf.view.editor, pos = editor.offsetToPos(offset);
      editor.setCursor(pos); editor.scrollIntoView({ from: pos, to: pos }, true); editor.focus();
    }
  }
  async openMetadataFile(file: TFile, subpath = ''): Promise<void> {
    await this.openIn('sub', file, subpath);
  }
  async openMetadataWeb(url: string, external: boolean): Promise<void> {
    if (!/^https?:\/\//i.test(url)) { new Notice('지원하지 않는 웹 주소입니다.'); return; }
    if (external) { await (require('electron') as { shell: { openExternal(url: string): Promise<void> } }).shell.openExternal(url); return; }
    const app = this.app as typeof this.app & { internalPlugins: { plugins: Record<string, { enabled: boolean }> }; viewRegistry: { viewByType: Record<string, unknown> } };
    if (!app.internalPlugins.plugins.webviewer?.enabled) { new Notice('설정 → 코어 플러그인에서 웹 뷰어를 켠 뒤 다시 열어주세요.'); return; }
    const type = Object.keys(app.viewRegistry.viewByType).find(k => /webviewer/.test(k));
    if (!type) throw Error('옵시디언 웹 뷰어를 찾을 수 없습니다.');
    const anchor = this.mainLeaf;
    if (!this.mainGroup || !anchor || !this.mainFile) return;
    const group = this.subGroup && groupsIn(this.app).includes(this.subGroup) ? this.subGroup : undefined;
    const existing = group?.children.find(l => l.getViewState().type === type && l.getViewState().state?.url === url);
    if (existing) { await this.app.workspace.revealLeaf(existing); this.app.workspace.setActiveLeaf(existing, { focus: true }); return; }
    const replacing = activeIn(group);
    const leaf = replacing ?? this.app.workspace.createLeafBySplit(anchor, 'vertical');
    const oldState = replacing?.getViewState();
    if (replacing?.view instanceof TextFileView) await replacing.view.save();
    try { await leaf.setViewState({ type, active: true, state: { url, title: url, navigate: true } }); }
    catch (error) { if (oldState) await leaf.setViewState(oldState); else leaf.detach(); throw error; }
    this.subGroup = groupOf(leaf);
    if (this.subGroup && !this.isSub(this.subGroup)) this.subGroups.push(this.subGroup);
    this.enforceOrder(false);
  }
  async commitFolders(next: FolderState, main: TFile): Promise<void> {
    if (!this.saveAllowed) throw Error('저장 상태를 읽지 못해 가상 폴더를 변경할 수 없습니다.');
    window.clearTimeout(this.saveTimer);
    this.flushState(); this.folderSaving = true;
    try {
      await this.saveChain;
      if (this.app.vault.getAbstractFileByPath(main.path) !== main) throw Error('대상 Main 문서가 없습니다.');
      const documents = { ...this.foldersByMain, [main.path]: next };
      const data = { ...this.data, foldersByMain: structuredClone(documents), folderDefaults: structuredClone(this.folderDefaults) };
      await this.saveData(data);
      this.data = data; this.persistedJSON = JSON.stringify(data); this.foldersByMain[main.path] = next;
    } finally { this.folderSaving = false; this.persist(); }
  }
  async changeFolders(change: (next: FolderState) => void, main = this.mainFile): Promise<void> {
    if (!main || this.mainFile !== main) throw Error('Main이 변경되어 가상 폴더 작업을 취소했습니다.');
    const next = structuredClone(this.folders); change(next); await this.commitFolders(next, main); this.render();
  }
  async addFolderConnection(main: TFile, file: TFile, folder: string): Promise<void> {
    if (this.mainFile !== main || main === file || this.app.vault.getAbstractFileByPath(file.path) !== file || (folder && !this.folders.folders.some(f => f.id === folder))) throw Error('Main 또는 대상이 변경되었습니다.');
    if (Object.prototype.hasOwnProperty.call(this.folders.positions, file.path) && this.folders.positions[file.path] !== folder) { new Notice('이미 다른 가상 폴더에 배치된 파일입니다.'); return; }
    const previous = structuredClone(this.folders), next = structuredClone(previous);
    next.positions[file.path] = folder; if (!next.order.includes(fileKey(file.path))) next.order.push(fileKey(file.path));
    await this.commitFolders(next, main);
    try {
      if (this.mainFile !== main) throw Error('Main이 변경되어 연결을 취소했습니다.');
      if (!this.connectedFiles(main).includes(file)) await this.addConnection(main, file, true);
    } catch (error) { await this.commitFolders(previous, main); this.render(); throw error; }
    this.render();
  }
  newLinkedNotePath(main: TFile, input: string): string {
    const name = newNoteName(input);
    const parent = this.app.fileManager.getNewFileParent(main.path, name);
    return parent.isRoot() ? name : `${parent.path}/${name}`;
  }
  async createLinkedNote(main: TFile, input: string, folder?: string): Promise<TFile> {
    if (this.creatingNote) throw Error('새 파일을 만드는 중입니다. 잠시 기다려주세요.');
    if (this.mainFile !== main || this.app.vault.getAbstractFileByPath(main.path) !== main) throw Error('Main이 변경되었습니다. 창을 다시 열어주세요.');
    if (folder !== undefined && folder && !this.folders.folders.some(f => f.id === folder)) throw Error('대상 가상 폴더가 없습니다.');
    const path = this.newLinkedNotePath(main, input);
    if (this.app.vault.getAllLoadedFiles().some(f => f.path.toLocaleLowerCase() === path.toLocaleLowerCase())) throw Error('같은 이름의 파일 또는 폴더가 있습니다. 다른 이름을 입력해주세요.');
    this.creatingNote = true;
    let created: TFile | undefined;
    try {
      created = await this.app.vault.create(path, '');
      if (folder === undefined) await this.addConnection(main, created, true);
      else await this.addFolderConnection(main, created, folder);
      return created;
    } catch (error) {
      if (created && this.app.vault.getAbstractFileByPath(path) === created) {
        // Only undo our own empty new file; never remove a file edited during the operation.
        const body = await this.app.vault.read(created);
        const mainBody = this.app.vault.getAbstractFileByPath(main.path) === main ? await this.app.vault.read(main) : '';
        if (body === '' && !mainBody.includes(`[[${path}]]`)) {
          await this.app.vault.delete(created);
          this.cards.order = this.cards.order.filter(p => p !== path);
        } else throw Error(`연결 작업을 마치지 못했습니다. 변경된 파일은 보존했습니다: ${created.path}`);
      }
      throw error;
    } finally { this.creatingNote = false; }
  }
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
  async addConnection(main: TFile, file: TFile, strict = false): Promise<void> {
    if (this.mainFile !== main || this.app.vault.getAbstractFileByPath(main.path) !== main || this.app.vault.getAbstractFileByPath(file.path) !== file) { if (strict) throw Error('메인 또는 선택 파일이 변경되었습니다.'); new Notice('메인 또는 선택 파일이 변경되어 연결을 취소했습니다.'); return; }
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
    this.lastContentKey = this.contentKey();
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) if (leaf.view instanceof PaletteView) leaf.view.render();
  }
  private contentKey(): string {
    return JSON.stringify([this.mainFile?.path, this.connectedFiles().map(file => [file.path, file.stat.mtime, file.stat.size])]);
  }
  private scheduleSync(): void {
    if (this.stopped || !this.ready || this.busy || this.syncTimer !== undefined) return;
    this.syncTimer = window.setTimeout(() => { this.syncTimer = undefined; if (!this.busy && !this.stopped) this.sync(true); }, 30);
  }
  private sync(notify: boolean): void {
    const live = groupsIn(this.app);
    const pinnedGroup = groupOf(this.mainLeaf ?? null);
    if (this.mainGroup && (!pinnedGroup || !live.includes(pinnedGroup) || !pinnedGroup.children.includes(this.mainLeaf!) || !isCentral(this.app, pinnedGroup) || !this.mainFile)) { this.mainGroup = this.subGroup = undefined; this.subGroups = []; this.mainLeaf = undefined; this.pinnedMain = undefined; }
    else if (this.mainLeaf) this.mainGroup = pinnedGroup;
    this.subGroups = this.subGroups.filter(g => live.includes(g) && g !== this.mainGroup && isCentral(this.app, g) && g.children.some(l => fileIn(this.app, l) || l.getViewState().type === 'webviewer'));
    if (!this.isSub(this.subGroup)) this.subGroup = this.subGroups[0];
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
    const followers = this.subGroups;
    if (arrange(this.app, this.mainGroup, followers) && notify) new Notice('스페이스 순서는 변경할 수 없습니다.');
  }
  private clearIcons(): void {
    for (const el of this.decorated) el.remove();
    this.decorated = [];
  }
  private updateIcons(): void {
    this.clearIcons();
    for (const [group, icon, label] of [[this.mainGroup, 'book-open', 'Main Space'], ...this.subGroups.map(g => [g, 'link', 'Sub Space'] as const)] as const) {
      if (!group) continue;
      const leaf = (group === this.mainGroup ? this.mainLeaf : activeIn(group)) as (WorkspaceLeaf & { tabHeaderEl?: HTMLElement }) | undefined;
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
    if (!main) return;
    const leaf = saved.main?.leafId ? main.children.find(l => (l as WorkspaceLeaf & { id: string }).id === saved.main!.leafId) : main.children.find(l => fileIn(this.app, l)?.path === saved.main?.activeFile);
    const file = fileIn(this.app, leaf);
    if (!leaf || file?.extension !== 'md' || file.path !== saved.main?.activeFile || leaf.getViewState().type !== 'markdown') return;
    this.mainGroup = main; this.mainLeaf = leaf; this.pinnedMain = file;
    this.subGroups = (saved.subs ?? (saved.sub ? [saved.sub] : [])).flatMap(s => {
      const sub = find(s.groupId);
      return sub && sub !== main && sub.children.some(l => fileIn(this.app, l) || l.getViewState().type === 'webviewer') ? [sub] : [];
    });
    this.subGroup = this.subGroups.find(g => g.id === saved.sub?.groupId) ?? this.subGroups[0];
  }
  private persist(): void {
    if (this.stopped || !this.ready || !this.saveAllowed) return;
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.flushState(), 250);
  }
  private flushState(): void {
    if (!this.ready || !this.saveAllowed || this.folderSaving) return;
    const space = (g?: Group) => g ? { groupId: g.id, activeFile: fileIn(this.app, activeIn(g))?.path ?? null } : undefined;
    const spaces: SavedSpaces = { main: this.mainGroup && this.mainFile ? { groupId: this.mainGroup.id, activeFile: this.mainFile.path, leafId: (this.mainLeaf as WorkspaceLeaf & { id: string }).id } : undefined, sub: space(this.subGroup), subs: this.subGroups.map(g => space(g)!) };
    const next = { ...this.data, spaces, metadataCollapsed: this.metadataCollapsed.slice(), metadataFontSize: this.metadataFontSize, topView: this.topView, linkView: this.linkView, cards: structuredClone(this.cards), connections: structuredClone(this.connections), foldersByMain: structuredClone(this.foldersByMain), folderDefaults: structuredClone(this.folderDefaults) };
    const serialized = JSON.stringify(next);
    if (serialized === this.persistedJSON) return;
    this.data = next;
    this.saveChain = this.saveChain.then(async () => {
      await this.saveData(next);
      this.persistedJSON = serialized;
    }).catch(error => { console.error('MD Palette save:', error); new Notice('MD Palette 상태를 저장하지 못했습니다.'); });
  }
}
