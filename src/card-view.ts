import { FuzzySuggestModal, Menu, Modal, Notice, TFile, setIcon } from 'obsidian';
import type MDPalettePlugin from './main';
import { classify, displayModes, fileTypes, pruneLabels, reorder, type Label } from './cards-state';
import { Thumbnails } from './thumbnails';
import { CardReorder } from './card-reorder';

const typeNames = ['전체', 'MD', 'Canvas', 'PDF', '이미지', '영상', '기타'];
const modeNames = ['큰 아이콘', '중간 아이콘', '작은 아이콘', '목록', '자세히', '타일'];
export class ConnectionPicker extends FuzzySuggestModal<TFile> {
  constructor(private plugin: MDPalettePlugin, private main: TFile) { super(plugin.app); this.setPlaceholder('연결할 기존 Vault 파일 선택'); }
  getItems(): TFile[] { return this.app.vault.getFiles().filter(f => f !== this.main); }
  getItemText(file: TFile): string { return file.path; }
  onChooseItem(file: TFile): void { this.plugin.run(() => this.plugin.addConnection(this.main, file)); }
}

class LabelEditor extends Modal {
  private chosen?: Label;
  constructor(private plugin: MDPalettePlugin, private paths?: string[]) { super(plugin.app); }
  onOpen(): void { this.chosen = this.paths ? undefined : this.plugin.cards.labels[0]; this.draw(); }
  private draw(): void {
    this.contentEl.empty(); this.titleEl.setText(this.paths ? '새 Label 만들기' : '라벨 관리');
    if (!this.paths && !this.chosen) { this.contentEl.createEl('p', { text: '사용 중인 라벨이 없습니다.' }); return; }
    const layout = this.contentEl.createDiv({ cls: 'mdp-label-editor' });
    if (!this.paths) {
      const list = layout.createDiv({ cls: 'mdp-label-list' });
      for (const label of this.plugin.cards.labels) {
        const b = list.createEl('button', { text: label.name, cls: this.chosen?.id === label.id ? 'is-selected' : '' });
        b.style.borderLeft = `6px solid ${label.color}`;
        b.onclick = () => { this.chosen = label; this.draw(); };
      }
    }
    const form = layout.createDiv({ cls: 'mdp-label-form' });
    const nameLabel = form.createEl('label', { text: '이름' });
    const name = nameLabel.createEl('input', { type: 'text', value: this.chosen?.name ?? '', attr: { 'aria-label': '라벨 이름', maxlength: '80' } });
    const colorLabel = form.createEl('label', { text: '색상' });
    const color = colorLabel.createEl('input', { type: 'color', value: this.chosen?.color ?? this.accent(), attr: { 'aria-label': '라벨 색상' } });
    const actions = form.createDiv({ cls: 'mdp-modal-actions' });
    actions.createEl('button', { text: '취소' }).onclick = () => this.close();
    const apply = actions.createEl('button', { text: this.paths ? '만들기' : '적용', cls: 'mod-cta' });
    apply.onclick = () => {
      const title = name.value.trim(); if (!title) { new Notice('라벨 이름을 입력해주세요.'); name.focus(); return; }
      const cards = this.plugin.cards;
      if (cards.labels.some(l => l.name === title && l.id !== this.chosen?.id)) { new Notice('같은 이름의 라벨이 있습니다.'); return; }
      if (this.paths) {
        const paths = this.paths.filter(p => this.app.vault.getAbstractFileByPath(p) instanceof TFile); if (!paths.length) { this.close(); return; }
        const label = { id: crypto.randomUUID(), name: title, color: color.value };
        cards.labels.push(label); for (const path of paths) cards.assignments[path] = label.id;
      } else if (this.chosen && cards.labels.includes(this.chosen)) { this.chosen.name = title; this.chosen.color = color.value; }
      pruneLabels(cards); this.plugin.cardsChanged(); this.close();
    };
    if (this.paths) name.focus();
  }
  private accent(): string {
    const probe = this.contentEl.createSpan(); probe.style.color = 'var(--interactive-accent)';
    const rgb = getComputedStyle(probe).color.match(/\d+/g); probe.remove();
    return rgb && rgb.length >= 3 ? '#' + rgb.slice(0, 3).map(n => Number(n).toString(16).padStart(2, '0')).join('') : '#808080';
  }
  onClose(): void { this.contentEl.empty(); }
}

export class CardView {
  private thumbnails?: Thumbnails;
  private selected = new Set<string>();
  private anchor?: string;
  private active?: string;
  private mainPath?: string;
  private reorderDrag?: CardReorder;
  private root?: HTMLElement;
  private visible: TFile[] = [];
  private scrollTop = 0;
  private restoreFrame?: number;
  constructor(private plugin: MDPalettePlugin) {}
  destroy(): void { if (this.restoreFrame !== undefined) cancelAnimationFrame(this.restoreFrame); this.thumbnails?.destroy(); this.thumbnails = undefined; this.reorderDrag?.destroy(); this.reorderDrag = undefined; }
  render(root: HTMLElement): void {
    this.destroy(); this.root = root;
    const main = this.plugin.mainFile; if (!main) return;
    const parent = root.parentNode, nextSibling = root.nextSibling;
    root.remove();
    if (main.path !== this.mainPath) { this.selected.clear(); this.anchor = this.active = undefined; this.mainPath = main.path; this.scrollTop = 0; }
    const state = this.plugin.cards;
    root.className = 'mdp-card-view';
    const add = root.createEl('button', { cls: 'mdp-add-connection', text: '+ 연결 파일 추가' });
    add.onclick = () => { const file = this.plugin.mainFile; if (!file) { new Notice('메인 스페이스를 먼저 지정해주세요.'); return; } new ConnectionPicker(this.plugin, file).open(); };
    const typeSection = this.section(root, '파일 유형 필터', state.typeCollapsed, () => { state.typeCollapsed = !state.typeCollapsed; this.plugin.cardsChanged(); });
    if (!state.typeCollapsed) for (let i = 0; i < fileTypes.length; i++) this.chip(typeSection, typeNames[i], state.fileType === fileTypes[i], () => { state.fileType = fileTypes[i]; this.plugin.cardsChanged(); });
    const labelSection = this.section(root, 'Label 필터', state.labelCollapsed, () => { state.labelCollapsed = !state.labelCollapsed; this.plugin.cardsChanged(); });
    if (!state.labelCollapsed) {
      this.chip(labelSection, 'All', !state.labelFilter.length, () => { state.labelFilter = []; this.plugin.cardsChanged(); });
      for (const label of state.labels) this.chip(labelSection, label.name, state.labelFilter.includes(label.id), () => {
        state.labelFilter = state.labelFilter.includes(label.id) ? state.labelFilter.filter(id => id !== label.id) : [...state.labelFilter, label.id]; this.plugin.cardsChanged();
      });
      this.chip(labelSection, '라벨 관리…', false, () => new LabelEditor(this.plugin).open());
    }
    const controls = root.createDiv({ cls: 'mdp-card-controls' });
    this.select(controls, '보기 형식', [...displayModes], modeNames, state.display, value => { state.display = value as typeof state.display; this.plugin.cardsChanged(); });
    this.select(controls, '텍스트 크기', ['small', 'normal', 'large'], ['작게', '보통', '크게'], state.textSize, value => { state.textSize = value as typeof state.textSize; this.plugin.cardsChanged(); });
    const connected = this.plugin.connectedFiles();
    this.visible = connected.filter(f => (state.fileType === 'all' || classify(f.extension) === state.fileType) && (!state.labelFilter.length || state.labelFilter.includes(state.assignments[f.path])));
    const visiblePaths = new Set(this.visible.map(f => f.path));
    this.selected = new Set([...this.selected].filter(p => visiblePaths.has(p)));
    if (this.active && !visiblePaths.has(this.active)) this.active = undefined;
    root.createDiv({ cls: 'mdp-card-count mdp-muted', text: `${this.visible.length}개 파일` });
    const grid = root.createDiv({ cls: `mdp-card-grid mdp-display-${state.display} mdp-text-${state.textSize}`, attr: { role: 'listbox', 'aria-label': '연결 파일 카드', 'aria-multiselectable': 'true' } });
    grid.addEventListener('scroll', () => { this.scrollTop = grid.scrollTop; }, { passive: true });
    if (!this.visible.length) grid.createDiv({ cls: 'mdp-muted mdp-no-cards', text: connected.length ? '필터에 맞는 파일이 없습니다.' : '연결된 파일이 없습니다. 위 버튼으로 기존 파일을 연결하세요.' });
    this.thumbnails = new Thumbnails(this.plugin.app, grid);
    this.reorderDrag = new CardReorder(grid, (paths, target, after) => {
      const next = reorder(state.order, paths, target, after);
      if (next.every((p, i) => p === state.order[i])) return;
      const elements = Array.from(grid.querySelectorAll<HTMLElement>('.mdp-card'));
      const anchor = elements.find(el => el.dataset.path === target); if (!anchor) return;
      const moved = new Set(paths), fragment = grid.ownerDocument.createDocumentFragment();
      for (const el of elements) if (moved.has(el.dataset.path!)) fragment.append(el);
      grid.insertBefore(fragment, after ? anchor.nextSibling : anchor);
      state.order = next;
      const rank = new Map(next.map((path, index) => [path, index]));
      this.visible.sort((a, b) => rank.get(a.path)! - rank.get(b.path)!);
      this.plugin.saveCardOrder();
    });
    grid.addEventListener('wheel', e => {
      if (!e.ctrlKey) return; e.preventDefault();
      const index = displayModes.indexOf(state.display), next = Math.max(0, Math.min(displayModes.length - 1, index + (e.deltaY > 0 ? 1 : -1)));
      if (next !== index) { state.display = displayModes[next]; this.plugin.cardsChanged(); }
    }, { passive: false });
    for (const file of this.visible) {
      const card = grid.createDiv({ cls: 'mdp-card', attr: { 'data-path': file.path, role: 'option', tabindex: '0', draggable: 'true', title: file.path } });
      card.classList.add('mdp-file-card');
      card.createDiv({ cls: 'mdp-card-name mdp-file-title', text: file.name });
      const preview = card.createDiv({ cls: 'mdp-preview', attr: { 'aria-hidden': 'true' } });
      if (state.display !== 'list' && state.display !== 'details') this.thumbnails.observe(preview, file);
      else setIcon(preview, classify(file.extension) === 'image' ? 'image' : 'file-text');
      const info = card.createDiv({ cls: 'mdp-card-info' });
      const label = state.labels.find(l => l.id === state.assignments[file.path]);
      if (label) { const badge = info.createSpan({ cls: 'mdp-label-badge', text: label.name }); badge.style.setProperty('--mdp-label-color', label.color); }
      if (state.display === 'details' || state.display === 'tiles') {
        info.createDiv({ cls: 'mdp-card-detail', text: `${file.parent?.path || '/'} · ${file.extension.toUpperCase()}` });
        info.createDiv({ cls: 'mdp-card-detail', text: `${new Date(file.stat.mtime).toLocaleDateString()} · ${Math.ceil(file.stat.size / 1024)} KB` });
      }
      const more = card.createEl('button', { cls: 'mdp-card-more', attr: { 'aria-label': `${file.name} 메뉴` } }); setIcon(more, 'more-vertical');
      more.onclick = e => { e.stopPropagation(); this.context(e, file); };
      card.onclick = e => { this.selection(e, file); };
      card.ondblclick = e => { if ((e.target as HTMLElement).closest('button')) return; this.selected = new Set([file.path]); this.active = this.anchor = file.path; this.paint(); this.open(file); };
      card.oncontextmenu = e => { e.preventDefault(); this.context(e, file); };
      card.onkeydown = e => {
        if (e.key === 'Enter') { e.preventDefault(); this.selected = new Set([file.path]); this.active = file.path; this.paint(); this.open(file); }
        if (e.key === ' ') { e.preventDefault(); this.selection(e, file); }
      };
      card.ondragstart = e => {
        if (!this.selected.has(file.path)) { this.selected = new Set([file.path]); this.active = this.anchor = file.path; this.paint(); }
        const paths = this.visible.map(f => f.path).filter(p => this.selected.has(p));
        e.dataTransfer?.setData('application/x-md-palette-reorder', this.mainPath!);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        this.reorderDrag?.start(paths);
      };
    }
    this.paint();
    parent?.insertBefore(root, nextSibling);
    const savedScroll = this.scrollTop;
    if (savedScroll) this.restoreFrame = requestAnimationFrame(() => { grid.scrollTop = savedScroll; this.restoreFrame = undefined; });
  }
  private selection(e: MouseEvent | KeyboardEvent, file: TFile): void {
    if (e.shiftKey && this.anchor && this.visible.some(f => f.path === this.anchor)) {
      const a = this.visible.findIndex(f => f.path === this.anchor), b = this.visible.indexOf(file);
      if (!e.ctrlKey && !e.metaKey) this.selected.clear();
      for (const item of this.visible.slice(Math.min(a, b), Math.max(a, b) + 1)) this.selected.add(item.path);
    } else if (e.ctrlKey || e.metaKey) { this.selected.has(file.path) ? this.selected.delete(file.path) : this.selected.add(file.path); this.anchor = file.path; }
    else { this.selected = new Set([file.path]); this.anchor = file.path; }
    this.active = file.path; this.paint();
  }
  private paint(): void {
    this.root?.querySelectorAll<HTMLElement>('.mdp-card').forEach(el => {
      const selected = this.selected.has(el.dataset.path!); el.classList.toggle('is-selected', selected); el.classList.toggle('is-active', el.dataset.path === this.active); el.setAttribute('aria-selected', String(selected));
    });
  }
  private open(file: TFile): void { this.plugin.run(() => this.plugin.openIn('sub', file)); }
  private context(event: MouseEvent, file: TFile): void {
    if (!this.selected.has(file.path)) { this.selected = new Set([file.path]); this.active = this.anchor = file.path; this.paint(); }
    const paths = [...this.selected], multi = paths.length > 1, state = this.plugin.cards;
    const menu = new Menu();
    if (!multi) {
      menu.addItem(item => item.setTitle('Sub Space에서 열기').setIcon('link').onClick(() => this.open(file)));
    }
    menu.addItem(item => {
      item.setTitle(multi ? 'Label 일괄 적용' : 'Label 지정/교체').setIcon('tag').setDisabled(!state.labels.length);
      // Obsidian desktop exposes submenus; keep the version-sensitive API at this boundary.
      const sub = (item as typeof item & { setSubmenu(): Menu }).setSubmenu();
      for (const label of state.labels) sub.addItem(i => i.setTitle(label.name).setChecked(paths.every(p => state.assignments[p] === label.id)).onClick(() => { for (const p of paths) state.assignments[p] = label.id; pruneLabels(state); this.plugin.cardsChanged(); }));
    });
    menu.addItem(item => item.setTitle(multi ? 'Label 일괄 제거' : '현재 Label 제거').setIcon('tag').setDisabled(!paths.some(p => state.assignments[p])).onClick(() => { for (const p of paths) delete state.assignments[p]; pruneLabels(state); this.plugin.cardsChanged(); }));
    menu.addItem(item => item.setTitle('새 Label 만들기').setIcon('plus').onClick(() => new LabelEditor(this.plugin, paths).open()));
    menu.addItem(item => item.setTitle('Label 관리…').setIcon('settings').onClick(() => new LabelEditor(this.plugin).open()));
    menu.showAtMouseEvent(event);
  }
  private section(root: HTMLElement, title: string, collapsed: boolean, toggle: () => void): HTMLElement {
    const section = root.createDiv({ cls: 'mdp-filter-section' });
    const button = section.createEl('button', { text: `${title} ${collapsed ? '▸' : '▾'}`, cls: 'mdp-filter-toggle', attr: { 'aria-expanded': String(!collapsed) } }); button.onclick = toggle;
    return section.createDiv({ cls: 'mdp-filter-chips' });
  }
  private chip(root: HTMLElement, title: string, selected: boolean, action: () => void): void { const b = root.createEl('button', { text: title, cls: selected ? 'mdp-chip is-selected' : 'mdp-chip', attr: { 'aria-pressed': String(selected) } }); b.onclick = action; }
  private select(root: HTMLElement, title: string, values: string[], names: string[], value: string, action: (value: string) => void): void {
    const label = root.createEl('label', { text: title }); const select = label.createEl('select', { attr: { 'aria-label': title } });
    values.forEach((v, i) => select.createEl('option', { value: v, text: names[i] })); select.value = value; select.onchange = () => action(select.value);
  }
}
