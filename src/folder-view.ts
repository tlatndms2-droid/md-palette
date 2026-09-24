import { FuzzySuggestModal, Menu, Modal, Notice, TFile, setIcon } from 'obsidian';
import type MDPalettePlugin from './main';
import { classify, fileTypes, toggleType, typeSelected } from './cards-state';
import { ancestors, folderDisplayModes, canMove, deleteFolder, fileKey, folderKey, moveItems, parentOf, type FolderState, type Sort } from './folders-state';
import { Thumbnails } from './thumbnails';
import { NewLinkedNoteModal } from './new-linked-note';

const sortNames: Record<Sort, string> = { manual: '사용자 지정', name: '이름', type: '유형', mtime: '수정 날짜', size: '크기' };
const displayNames = ['제목 카드', '큰 아이콘', '중간 아이콘', '작은 아이콘', '목록', '자세히', '타일'];
const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
type Entry = { key: string; name: string; parent: string; folder?: string; file?: TFile };
class NameModal extends Modal {
  private main: TFile | null;
  constructor(private plugin: MDPalettePlugin, private parent: string, private id?: string) { super(plugin.app); this.main = plugin.mainFile; }
  onOpen(): void {
    this.titleEl.setText(this.id ? '가상 폴더 이름 변경' : '새 가상 폴더 만들기');
    const input = this.contentEl.createEl('input', { type: 'text', value: this.plugin.folders.folders.find(f => f.id === this.id)?.name ?? '', attr: { 'aria-label': '가상 폴더 이름', maxlength: '120' } });
    const actions = this.contentEl.createDiv({ cls: 'mdp-modal-actions' });
    actions.createEl('button', { text: '취소' }).onclick = () => this.close();
    const apply = () => {
      const name = input.value.trim(); if (!name || /[\r\n/\\]/.test(name)) { new Notice('폴더 이름에 경로 구분자를 사용할 수 없습니다.'); return; }
      this.plugin.run(async () => { await this.plugin.changeFolders(s => {
        const existing = s.folders.find(f => f.id === this.id), parent = existing?.parent ?? this.parent;
        if (parent && !s.folders.some(f => f.id === parent)) throw Error('상위 폴더가 없습니다.');
        if (s.folders.some(f => f.parent === parent && f.name === name && f.id !== this.id)) throw Error('같은 이름의 가상 폴더가 있습니다.');
        if (this.id) { if (!existing) throw Error('폴더가 없습니다.'); existing.name = name; }
        else { const id = crypto.randomUUID(); s.folders.push({ id, name, parent }); s.order.push(folderKey(id)); }
      }, this.main); this.close(); });
    };
    actions.createEl('button', { text: '저장', cls: 'mod-cta' }).onclick = apply;
    input.onkeydown = e => { if (e.key === 'Enter') apply(); }; input.focus(); input.select();
  }
  onClose(): void { this.contentEl.empty(); }
}
class FolderConnectionPicker extends FuzzySuggestModal<TFile> {
  constructor(private plugin: MDPalettePlugin, private main: TFile, private folder: string) { super(plugin.app); this.setPlaceholder('연결할 기존 Vault 파일 선택'); }
  getItems(): TFile[] { return this.app.vault.getFiles().filter(f => f !== this.main); }
  getItemText(file: TFile): string { return file.path; }
  onChooseItem(file: TFile): void { this.plugin.run(() => this.plugin.addFolderConnection(this.main, file, this.folder)); }
}
export class FolderView {
  private root?: HTMLElement;
  private thumbnails?: Thumbnails;
  private query = '';
  private history = ['']; private historyIndex = 0;
  private selections = { tree: new Set<string>(), folder: new Set<string>() };
  private anchors: { tree?: string; folder?: string } = {};
  private drag?: { keys: string[]; main: string; surface: 'tree' | 'folder' };
  private entries: Entry[] = [];
  private main?: string;
  private initialized = false;
  private resizeCleanup?: () => void;
  private scroll = { tree: 0, folder: 0 };
  private restoreFrame?: number;
  private observers: IntersectionObserver[] = [];
  constructor(private plugin: MDPalettePlugin) {}
  destroy(): void {
    if (this.restoreFrame !== undefined) cancelAnimationFrame(this.restoreFrame);
    for (const observer of this.observers) observer.disconnect(); this.observers = [];
    this.thumbnails?.destroy(); this.thumbnails = undefined; this.resizeCleanup?.(); this.resizeCleanup = undefined;
  }
  render(root: HTMLElement): void {
    this.destroy(); this.root = root; root.className = 'mdp-folder-view';
    const parent = root.parentNode, nextSibling = root.nextSibling;
    root.remove();
    const s = this.plugin.folders;
    if (!this.initialized) { this.history = [s.current]; this.initialized = true; }
    if (this.main !== this.plugin.mainFile?.path) { this.main = this.plugin.mainFile?.path; this.history = [s.current]; this.historyIndex = 0; this.selections.tree.clear(); this.selections.folder.clear(); this.drag = undefined; this.query = ''; this.scroll = { tree: 0, folder: 0 }; }
    const connected = this.plugin.connectedFiles(), known = new Set(s.order);
    let added = false;
    for (const key of [...s.folders.map(f => folderKey(f.id)), ...connected.map(f => fileKey(f.path))]) if (!known.has(key)) { s.order.push(key); known.add(key); added = true; }
    if (added) this.plugin.saveCardOrder();
    const files = connected.filter(f => this.plugin.cards.selectedTypes.includes(classify(f.extension)));
    this.entries = [...s.folders.map(f => ({ key: folderKey(f.id), name: f.name, parent: f.parent, folder: f.id })), ...files.map(file => ({ key: fileKey(file.path), name: file.name, parent: s.positions[file.path] ?? '', file }))];
    for (const surface of ['tree','folder'] as const) this.selections[surface] = new Set([...this.selections[surface]].filter(k => this.entries.some(e => e.key === k)));
    const toolbar = root.createDiv({ cls: 'mdp-folder-toolbar' });
    toolbar.createEl('button', { text: '파일 유형 ▾' }).onclick = e => {
      const menu = new Menu(); fileTypes.forEach((type, i) => menu.addItem(item => item.setTitle(['전체','MD','Canvas','PDF','이미지','영상','기타'][i]).setChecked(typeSelected(this.plugin.cards,type)).onClick(() => { toggleType(this.plugin.cards,type); this.plugin.cardsChanged(); }))); menu.showAtMouseEvent(e);
    };
    toolbar.createEl('button', { text: '보기 형식 ▾' }).onclick = e => this.viewMenu(e);
    const panels = root.createDiv({ cls: `mdp-folder-panels mdp-folder-${s.mode} mdp-folder-${s.layout}` });
    let tree: HTMLElement | undefined;
    if (s.mode !== 'folder') {
      tree = panels.createDiv({ cls: 'mdp-folder-section mdp-tree-section' });
      const header = tree.createDiv({ cls: 'mdp-folder-header' }); header.createSpan({ text: 'Virtual Folders (MD Palette)' });
      header.createEl('button', { text: sortNames[s.treeSort] + ' ▾', attr: { 'aria-label': 'Tree 정렬' } }).onclick = e => this.sortMenu(e, true);
      const list = tree.createDiv({ cls: 'mdp-folder-tree', attr: { role: 'tree', 'aria-label': '가상 폴더 트리', 'aria-multiselectable': 'true' } });
      const rootRow = list.createDiv({ cls: 'mdp-tree-root', text: '⌂ 전체 가상 폴더', attr: { tabindex: '0' } }); rootRow.ondblclick = () => this.navigate(''); rootRow.onkeydown = e => { if (e.key === 'Enter') this.navigate(''); };
      this.dropTarget(rootRow, '', 'tree'); rootRow.oncontextmenu = e => this.emptyMenu(e, '');
      const rows: { item: Entry; depth: number }[] = [];
      const visit = (parent: string, depth: number) => { for (const item of this.sorted(this.entries.filter(x => x.parent === parent), true)) { rows.push({ item, depth }); if (item.folder && !s.collapsed.includes(item.folder)) visit(item.folder, depth + 1); } }; visit('', 0);
      this.renderEntries(list, rows, 'tree');
      list.oncontextmenu = e => { if (!(e.target as HTMLElement).closest('[data-key],.mdp-tree-root')) this.emptyMenu(e, ''); }; this.dropTarget(list, '', 'tree');
      list.onscroll = () => { this.scroll.tree = list.scrollTop; };
    }
    const divider = s.mode === 'composite' ? panels.createDiv({ cls: 'mdp-folder-divider', attr: { role: 'separator', tabindex: '0', 'aria-label': 'Tree / Folder 영역 크기', 'aria-orientation': s.layout === 'vertical' ? 'horizontal' : 'vertical' } }) : undefined;
    if (s.mode !== 'tree') {
      const folder = panels.createDiv({ cls: 'mdp-folder-section mdp-contents-section' });
      const header = folder.createDiv({ cls: 'mdp-folder-header' }); header.createSpan({ text: 'Folder Contents' });
      header.createEl('button', { text: sortNames[s.sort] + (s.sort === 'manual' ? ' ▾' : s.descending ? ' ↓' : ' ↑'), attr: { 'aria-label': 'Folder 정렬' } }).onclick = e => this.sortMenu(e);
      const nav = folder.createDiv({ cls: 'mdp-folder-navigation' });
      this.iconButton(nav, '뒤로', 'arrow-left', () => this.historyMove(-1), this.historyIndex <= 0);
      this.iconButton(nav, '앞으로', 'arrow-right', () => this.historyMove(1), this.historyIndex >= this.history.length - 1);
      this.iconButton(nav, '상위 폴더', 'arrow-up', () => this.navigate(s.folders.find(f => f.id === s.current)?.parent ?? ''), !s.current);
      const crumbs = nav.createDiv({ cls: 'mdp-folder-breadcrumb', attr: { 'aria-label': '가상 폴더 경로' } });
      for (const id of ['', ...ancestors(s, s.current)]) { const b = crumbs.createEl('button', { text: id ? s.folders.find(f => f.id === id)!.name : '전체', attr: { 'data-folder': id } }); b.onclick = () => this.navigate(id); this.dropTarget(b, id, 'folder'); }
      const search = nav.createEl('input', { type: 'search', value: this.query, placeholder: '현재 폴더에서 검색…', attr: { 'aria-label': '현재 폴더에서 검색' } });
      search.oninput = () => { this.query = search.value; this.scroll.folder = 0; this.redraw(); const next = this.root?.querySelector<HTMLInputElement>('input[type=search]'); next?.focus(); };
      const grid = folder.createDiv({ cls: `mdp-card-grid mdp-folder-grid mdp-display-${s.display}`, attr: { role: 'listbox', 'aria-label': '가상 폴더 내용', 'aria-multiselectable': 'true' } });
      if (s.display !== 'compact') this.thumbnails = new Thumbnails(this.plugin.app, grid);
      const query = this.query.trim().toLocaleLowerCase();
      const visible = this.sorted(this.entries.filter(x => query ? (s.current === '' || ancestors(s, x.parent).includes(s.current)) && x.name.toLocaleLowerCase().includes(query) : x.parent === s.current));
      this.renderEntries(grid, visible.map(item => ({ item, depth: 0 })), 'folder');
      if (!visible.length) grid.createDiv({ cls: 'mdp-muted mdp-no-cards', text: query ? '검색 결과가 없습니다.' : '빈 가상 폴더입니다. 빈 공간을 우클릭해 폴더나 연결 파일을 추가하세요.' });
      grid.oncontextmenu = e => { if (!(e.target as HTMLElement).closest('[data-key]')) this.emptyMenu(e, s.current); }; this.dropTarget(grid, s.current, 'folder');
      grid.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); const index = folderDisplayModes.indexOf(s.display), next = Math.max(0, Math.min(folderDisplayModes.length - 1, index + (e.deltaY > 0 ? 1 : -1))); if (next !== index) this.change(n => { n.display = folderDisplayModes[next]; }); }, { passive: false });
      grid.onscroll = () => { this.scroll.folder = grid.scrollTop; };
    }
    if (tree && divider) {
      const size = () => { tree!.style.flex = `0 0 calc(${s.split * 100}% - 5px)`; divider.setAttribute('aria-valuenow', String(Math.round(s.split * 100))); }; size();
      divider.onpointerdown = e => { if (e.button !== 0) return; e.preventDefault(); divider.setPointerCapture(e.pointerId); const initial = s.split;
        const move = (event: PointerEvent) => { const r = panels.getBoundingClientRect(); s.split = Math.max(.2, Math.min(.8, s.layout === 'vertical' ? (event.clientY - r.top) / r.height : (event.clientX - r.left) / r.width)); size(); };
        const finish = () => { cleanup(); this.change(n => { n.split = s.split; }); };
        const cancel = () => { s.split = initial; size(); cleanup(); };
        const cleanup = () => { divider.removeEventListener('pointermove', move); divider.removeEventListener('pointerup', finish); divider.removeEventListener('pointercancel', cancel); this.resizeCleanup = undefined; };
        divider.addEventListener('pointermove', move); divider.addEventListener('pointerup', finish); divider.addEventListener('pointercancel', cancel); this.resizeCleanup = cleanup;
      };
      divider.onkeydown = e => { if (['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(e.key)) { e.preventDefault(); this.change(n => { n.split = Math.max(.2, Math.min(.8, n.split + (['ArrowUp','ArrowLeft'].includes(e.key) ? -.05 : .05))); }); } };
    }
    root.createDiv({ cls: 'mdp-folder-notice mdp-muted', text: '실제 Vault 경로를 바꾸지 않는 가상 폴더입니다. Tree와 Folder의 선택은 서로 독립적입니다.' }); this.paint();
    parent?.insertBefore(root, nextSibling);
    const treeScroll = this.scroll.tree, folderScroll = this.scroll.folder;
    this.restoreFrame = requestAnimationFrame(() => {
      const tree = root.querySelector('.mdp-folder-tree'), grid = root.querySelector('.mdp-folder-grid');
      if (tree && treeScroll) tree.scrollTop = treeScroll;
      if (grid && folderScroll) grid.scrollTop = folderScroll;
      this.restoreFrame = undefined;
    });
  }
  private redraw(): void { if (this.root) { this.destroy(); this.root.empty(); this.render(this.root); } }
  private renderEntries(root: HTMLElement, rows: { item: Entry; depth: number }[], surface: 'tree' | 'folder'): void {
    const visible = rows.map(row => row.item);
    // Keep the first screen responsive; append the next chunk before it enters view.
    let count = 0;
    const sentinel = root.createDiv({ cls: 'mdp-folder-sentinel', attr: { 'aria-hidden': 'true' } });
    const append = (limit = 80) => {
      const fragment = root.ownerDocument.createElement('div');
      for (let end = Math.min(rows.length, count + limit); count < end; count++) this.row(fragment, rows[count].item, surface, visible, rows[count].depth);
      const batch = root.ownerDocument.createDocumentFragment(); while (fragment.firstChild) batch.append(fragment.firstChild); root.insertBefore(batch, sentinel);
      if (count === rows.length) { sentinel.remove(); observer?.disconnect(); }
      else if (observer) { observer.unobserve(sentinel); observer.observe(sentinel); }
      this.paint();
    };
    let observer: IntersectionObserver | undefined;
    const restoreCount = this.scroll[surface] > 0 ? Math.ceil(this.scroll[surface] / (surface === 'tree' ? 28 : 32)) + 80 : 80;
    append(restoreCount);
    if (count < rows.length) { observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) append(); }, { root, rootMargin: '240px' }); observer.observe(sentinel); this.observers.push(observer); }
  }
  private change(fn: (s: FolderState) => void): void { this.plugin.run(() => this.plugin.changeFolders(fn)); }
  private iconButton(root: HTMLElement, name: string, icon: string, action: () => void, disabled = false): void { const b = root.createEl('button', { attr: { 'aria-label': name, title: name } }); setIcon(b, icon); b.disabled = disabled; b.onclick = action; }
  private sorted(entries: Entry[], tree = false): Entry[] {
    const s = this.plugin.folders, sort = tree ? s.treeSort : s.sort, ranks = new Map(s.order.map((key, i) => [key, i]));
    return entries.sort((a, b) => {
      if (sort === 'manual') return (ranks.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (ranks.get(b.key) ?? Number.MAX_SAFE_INTEGER);
      const name = () => nameCollator.compare(a.name, b.name);
      let n = sort === 'name' ? name() : sort === 'type' ? (a.folder ? 'Folder' : a.file!.extension).localeCompare(b.folder ? 'Folder' : b.file!.extension) : sort === 'mtime' ? (a.file?.stat.mtime ?? 0) - (b.file?.stat.mtime ?? 0) : (a.file?.stat.size ?? 0) - (b.file?.stat.size ?? 0);
      n ||= name(); return n * (!tree && s.descending ? -1 : 1);
    });
  }
  private row(root: HTMLElement, item: Entry, surface: 'tree' | 'folder', visible: Entry[], depth = 0): void {
    const tree = surface === 'tree', s = this.plugin.folders, compact = !tree && s.display === 'compact';
    const el = root.createDiv({ cls: tree ? 'mdp-folder-row' : 'mdp-card mdp-folder-item', attr: { 'data-key': item.key, 'data-surface': surface, role: tree ? 'treeitem' : 'option', tabindex: '0', draggable: 'true', title: item.file?.path ?? this.virtualPath(item.folder!) } });
    if (item.file) this.plugin.bindFilePreview(el, item.file);
    if (compact) {
      const icon = el.createSpan({ cls: 'mdp-compact-icon' });
      setIcon(icon, item.folder ? 'folder' : classify(item.file!.extension) === 'image' ? 'image' : item.file!.extension === 'canvas' ? 'layout-dashboard' : 'file-text');
      el.createDiv({ cls: 'mdp-compact-title', text: item.name });
      el.setAttribute('aria-label', item.name);
      el.title = item.file ? `${item.file.path}\n가상 위치: ${this.virtualPath(item.parent)}` : this.virtualPath(item.folder!);
    } else {
      if (!tree && item.file) { el.classList.add('mdp-file-card'); el.createDiv({ cls: 'mdp-card-name mdp-file-title', text: item.name }); }
      if (tree) { el.style.paddingLeft = `${6 + depth * 16}px`; el.setAttribute('aria-level', String(depth + 1)); }
      if (tree && item.folder) { el.setAttribute('aria-expanded', String(!s.collapsed.includes(item.folder))); this.iconButton(el, `${item.name} 접기/펼치기`, s.collapsed.includes(item.folder) ? 'chevron-right' : 'chevron-down', () => this.change(n => { n.collapsed = n.collapsed.includes(item.folder!) ? n.collapsed.filter(id => id !== item.folder) : [...n.collapsed, item.folder!]; })); }
      const preview = el.createDiv({ cls: tree ? 'mdp-folder-icon' : 'mdp-preview' });
      if (item.folder) setIcon(preview, 'folder'); else if (!tree && !['list','details'].includes(s.display)) this.thumbnails?.observe(preview, item.file!); else setIcon(preview, classify(item.file!.extension) === 'image' ? 'image' : 'file-text');
      const info = el.createDiv({ cls: 'mdp-card-info' }); if (tree || item.folder) info.createDiv({ cls: 'mdp-card-name', text: item.name });
      if (!tree) {
        const label = this.plugin.cards.labels.find(l => l.id === this.plugin.cards.assignments[item.file?.path ?? '']);
        if (label) { const badge = info.createSpan({ cls: 'mdp-label-badge', text: label.name }); badge.style.setProperty('--mdp-label-color', label.color); }
        if (this.query.trim()) info.createDiv({ cls: 'mdp-card-detail', text: this.virtualPath(item.parent) });
        if (['details','tiles'].includes(s.display)) info.createDiv({ cls: 'mdp-card-detail', text: item.folder ? '가상 폴더' : `${item.file!.extension.toUpperCase()} · ${new Date(item.file!.stat.mtime).toLocaleString()} · ${item.file!.stat.size} B` });
      }
    }
    el.onclick = e => { if ((e.target as HTMLElement).closest('button')) return; this.select(item.key, surface, visible, e); };
    const open = () => item.folder ? this.navigate(item.folder) : this.plugin.run(() => this.plugin.openIn('sub', item.file!));
    el.ondblclick = e => { if ((e.target as HTMLElement).closest('button')) return; if (item.folder) this.navigate(item.folder); else this.plugin.openFileGesture(item.file!, e); };
    el.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); open(); } else if (e.key === ' ') { e.preventDefault(); this.select(item.key, surface, visible, e); } };
    el.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); if (!this.selections[surface].has(item.key)) this.select(item.key, surface, visible, e); const menu = new Menu();
      if (item.folder) {
        menu.addItem(i => i.setTitle('폴더를 현재 Canvas에 삽입…').setIcon('layout-dashboard').onClick(() => this.plugin.canvasInsert.folder(item.folder!)));
        menu.addItem(i => i.setTitle('열기').onClick(open));
        menu.addItem(i => i.setTitle('새 가상 폴더 만들기').onClick(() => new NameModal(this.plugin, item.folder!).open()));
        menu.addItem(i => i.setTitle('이름 변경').onClick(() => new NameModal(this.plugin, item.parent, item.folder).open()));
        menu.addItem(i => i.setTitle('가상 폴더 삭제 (내용은 한 단계 위로)').setIcon('folder-minus').onClick(() => this.change(n => deleteFolder(n, item.folder!))));
      } else {
        menu.addItem(i => i.setTitle('Sub Space에서 열기').onClick(open));
      } menu.showAtMouseEvent(e);
    };
    el.ondragstart = e => { if (!this.selections[surface].has(item.key)) this.select(item.key, surface, visible, e); this.drag = { keys: visible.filter(x => this.selections[surface].has(x.key)).map(x => x.key), main: this.main!, surface }; e.dataTransfer?.setData('application/x-md-palette-folder', this.main!); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; };
    el.ondragend = () => { this.drag = undefined; this.clearDrop(); };
    this.dropTarget(el, item.folder ?? item.parent, surface, item);
  }
  private select(key: string, surface: 'tree' | 'folder', visible: Entry[], e: MouseEvent | KeyboardEvent): void {
    const selected = this.selections[surface], anchor = this.anchors[surface];
    if (e.shiftKey && anchor && visible.some(x => x.key === anchor)) { if (!e.ctrlKey && !e.metaKey) selected.clear(); const a = visible.findIndex(x => x.key === anchor), b = visible.findIndex(x => x.key === key); for (const x of visible.slice(Math.min(a,b), Math.max(a,b)+1)) selected.add(x.key); }
    else if (e.ctrlKey || e.metaKey) { selected.has(key) ? selected.delete(key) : selected.add(key); this.anchors[surface] = key; }
    else { selected.clear(); selected.add(key); this.anchors[surface] = key; } this.paint();
  }
  private paint(): void { this.root?.querySelectorAll<HTMLElement>('[data-key]').forEach(el => { const selected = this.selections[el.dataset.surface as 'tree' | 'folder'].has(el.dataset.key!); el.classList.toggle('is-selected', selected); el.setAttribute('aria-selected', String(selected)); }); }
  private virtualPath(id: string): string { return ['전체', ...ancestors(this.plugin.folders, id).map(k => this.plugin.folders.folders.find(f => f.id === k)!.name)].join(' / '); }
  private navigate(id: string): void { if (id && !this.plugin.folders.folders.some(f => f.id === id)) return; this.history = this.history.slice(0,this.historyIndex+1); this.history.push(id); this.historyIndex++; this.query = ''; this.scroll.folder = 0; this.selections.folder.clear(); this.change(s => { s.current = id; }); }
  private historyMove(delta: number): void { const index = this.historyIndex + delta; if (index < 0 || index >= this.history.length) return; this.historyIndex = index; const id = this.history[index]; this.query = ''; this.scroll.folder = 0; this.change(s => { s.current = s.folders.some(f => f.id === id) ? id : ''; }); }
  private viewMenu(e: MouseEvent): void {
    const menu = new Menu(), s = this.plugin.folders;
    for (const [mode, name] of [['composite','복합뷰'],['tree','Tree뷰'],['folder','Folder뷰']] as const) menu.addItem(i => i.setTitle(name).setChecked(s.mode === mode).onClick(() => this.change(n => { n.mode = mode; })));
    menu.addSeparator(); folderDisplayModes.forEach((mode,index) => menu.addItem(i => i.setTitle(displayNames[index]).setChecked(s.display === mode).onClick(() => this.change(n => { n.display = mode; }))));
    menu.addSeparator(); for (const [layout,name] of [['vertical','상하 분할'],['horizontal','좌우 분할']] as const) menu.addItem(i => i.setTitle(name).setChecked(s.layout === layout).onClick(() => this.change(n => { n.layout = layout; })));
    menu.showAtMouseEvent(e);
  }
  private sortMenu(e: MouseEvent, tree = false): void {
    const menu = new Menu(), s = this.plugin.folders;
    for (const sort of (tree ? ['manual','name'] : Object.keys(sortNames)) as Sort[]) menu.addItem(i => i.setTitle(sortNames[sort]).setChecked((tree ? s.treeSort : s.sort) === sort).onClick(() => this.change(n => { if (tree) n.treeSort = sort as 'manual' | 'name'; else n.sort = sort; })));
    if (!tree) { menu.addSeparator(); for (const [descending,name] of [[false,'오름차순'],[true,'내림차순']] as const) menu.addItem(i => i.setTitle(name).setChecked(s.descending === descending).setDisabled(s.sort === 'manual').onClick(() => this.change(n => { n.descending = descending; }))); }
    menu.showAtMouseEvent(e);
  }
  private emptyMenu(e: MouseEvent, parent: string): void {
    e.preventDefault(); e.stopPropagation(); const menu = new Menu();
    menu.addItem(i => i.setTitle(parent ? '이 폴더를 현재 Canvas에 삽입…' : '전체 가상 폴더를 현재 Canvas에 삽입…').setIcon('layout-dashboard').onClick(() => this.plugin.canvasInsert.folder(parent)));
    menu.addItem(i => i.setTitle('새 가상 폴더 만들기').setIcon('folder-plus').onClick(() => new NameModal(this.plugin, parent).open()));
    menu.addItem(i => i.setTitle('연결 파일 추가').setIcon('link').onClick(() => { const main = this.plugin.mainFile; if (!main) { new Notice('메인 스페이스를 먼저 지정해주세요.'); return; } new FolderConnectionPicker(this.plugin, main, parent).open(); }));
    menu.addItem(i => i.setTitle('새 링크 파일 추가').setIcon('file-plus').onClick(() => { const main = this.plugin.mainFile; if (main) new NewLinkedNoteModal(this.plugin, main, parent).open(); }));
    menu.addSeparator(); menu.addItem(i => i.setTitle('보기 형식…').onClick(() => this.viewMenu(e))); menu.addItem(i => i.setTitle('정렬 기준…').onClick(() => this.sortMenu(e))); menu.showAtMouseEvent(e);
  }
  private clearDrop(): void { this.root?.querySelectorAll('.mdp-folder-drop,.mdp-folder-forbidden,.mdp-folder-before').forEach(el => el.classList.remove('mdp-folder-drop','mdp-folder-forbidden','mdp-folder-before')); }
  private dropTarget(el: HTMLElement, target: string, surface: 'tree' | 'folder', item?: Entry): void {
    const proposal = (e: DragEvent) => {
      const s = this.plugin.folders, manual = (surface === 'tree' ? s.treeSort : s.sort) === 'manual';
      const edge = !!item && (!item.folder || e.clientY < el.getBoundingClientRect().top + Math.min(12, el.clientHeight * .2));
      const folder = edge ? item!.parent : target;
      const before = edge && manual && !this.query ? item?.key : undefined;
      const same = this.drag?.keys.every(k => parentOf(s,k) === folder);
      const valid = !!this.drag && this.drag.main === this.plugin.mainFile?.path && this.drag.keys.every(k => this.entries.some(x => x.key === k)) && canMove(s,this.drag.keys,folder) && !(same && (!manual || (!!this.query && !!item)));
      return { folder, before, valid };
    };
    el.ondragover = e => { if (!this.drag) return; e.preventDefault(); e.stopPropagation(); const p = proposal(e); this.clearDrop(); el.classList.add(p.valid ? p.before ? 'mdp-folder-before' : 'mdp-folder-drop' : 'mdp-folder-forbidden'); if (e.dataTransfer) e.dataTransfer.dropEffect = p.valid ? 'move' : 'none'; };
    el.ondragleave = e => { if (!el.contains(e.relatedTarget as Node)) el.classList.remove('mdp-folder-drop','mdp-folder-forbidden','mdp-folder-before'); };
    el.ondrop = e => { if (!this.drag) return; e.preventDefault(); e.stopPropagation(); const p = proposal(e), keys = this.drag.keys; this.drag = undefined; this.clearDrop(); if (!p.valid) { new Notice('이 위치로 이동할 수 없습니다.'); return; } this.change(s => moveItems(s,keys,p.folder,p.before)); };
  }
}
