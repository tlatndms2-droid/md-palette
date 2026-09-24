import { Menu, TFile, setIcon } from 'obsidian';
import type MDPalettePlugin from './main';
import { classify } from './cards-state';

/** Read-only link occurrences. Never enroll descendants in Card order / Folder positions. */
export class LinkExplorer {
  constructor(private plugin: MDPalettePlugin, private pick?: (file: TFile) => void, private filter?: (file: TFile) => boolean) {}
  controls(host: HTMLElement, changed: () => void): void {
    const bar = host.createDiv({ cls: 'mdp-depth-controls' });
    const label = bar.createEl('label', { text: '연결 깊이' });
    const select = label.createEl('select', { attr: { 'aria-label': '연결 깊이' } });
    for (let n = 1; n <= 5; n++) select.createEl('option', { value: String(n), text: `${n}단계` });
    select.value = String(this.plugin.explorer.depth);
    select.onchange = () => { this.plugin.explorer.depth = Number(select.value); this.plugin.saveMetadata(); changed(); };
    bar.createSpan({ cls: 'mdp-muted', text: '하위 목록 · 아웃고잉 링크' });
  }
  attach(row: HTMLElement, file: TFile, ancestors = [this.plugin.mainFile!.path], level = 1): void {
    if (level >= this.plugin.explorer.depth) return;
    const route = [...ancestors, file.path];
    const children = this.plugin.linkIndex.children(file.path, route).filter(e => {
      const child = this.plugin.app.vault.getAbstractFileByPath(e.path);
      return child instanceof TFile && (!this.filter || this.filter(child));
    });
    if (!children.length) return;
    row.addClass('mdp-has-links');
    const key = JSON.stringify(route), button = row.createEl('button', { cls: 'mdp-link-expand', attr: { 'aria-label': `${file.name} 하위 링크 ${children.length}개 펼치기` } });
    row.prepend(button);
    const branch = row.ownerDocument.createElement('div'); branch.className = 'mdp-link-branch'; row.after(branch);
    if (row.classList.contains('mdp-folder-row')) branch.style.marginLeft = `${parseFloat(row.style.paddingLeft || '6') + 10}px`;
    // A link occurrence is a reference, never a virtual destination or reorder slot.
    const rejectMove = (event: DragEvent) => {
      if (!event.dataTransfer || ![...event.dataTransfer.types].some(t => t === 'application/x-md-palette-folder' || t === 'application/x-md-palette-reorder')) return;
      event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'none';
    };
    branch.ondragover = rejectMove; branch.ondrop = rejectMove;
    let expanded = this.plugin.explorer.expanded.includes(key), limit = 50;
    const draw = () => {
      branch.empty(); branch.hidden = !expanded;
      button.setAttribute('aria-expanded', String(expanded)); button.setAttribute('aria-label', `${file.name} 하위 링크 ${children.length}개 ${expanded ? '접기' : '펼치기'}`);
      setIcon(button, expanded ? 'chevron-down' : 'chevron-right');
      if (!expanded) return;
      for (const edge of children.slice(0, limit)) {
        const child = this.plugin.app.vault.getAbstractFileByPath(edge.path); if (!(child instanceof TFile)) continue;
        const item = branch.createDiv({ cls: 'mdp-linked-occurrence', attr: { 'data-link-path': child.path } });
        const line = item.createDiv({ cls: 'mdp-linked-row' });
        const icon = line.createSpan({ cls: 'mdp-linked-icon' }); setIcon(icon, child.extension === 'canvas' ? 'layout-dashboard' : 'file-text');
        const name = line.createEl('button', { cls: 'mdp-linked-name', text: child.name, attr: { title: child.path } });
        const select = () => { if (this.pick) this.pick(child); else { branch.querySelectorAll('.is-selected').forEach(e => e.removeClass('is-selected')); item.addClass('is-selected'); } };
        name.onclick = select;
        name.ondblclick = event => { if (!this.pick) this.plugin.openFileGesture(child, event); };
        name.onkeydown = event => { if (event.key === 'Enter' && !this.pick) { event.preventDefault(); this.plugin.openFileGesture(child); } };
        this.plugin.bindFilePreview(name, child);
        const direction = `${file.basename} → ${child.basename}`;
        item.createDiv({ cls: 'mdp-link-direction', text: direction });
        if (!this.pick) {
          item.draggable = true;
          item.ondragstart = e => { e.stopPropagation(); this.plugin.reuseDrag.startFile(e, child); this.plugin.canvasInsert.startDrag(e, [child.path]); };
          item.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); const menu = new Menu();
            menu.addItem(i => i.setTitle('Sub Space에서 열기').setIcon('link').onClick(() => this.plugin.openFileGesture(child)));
            menu.addItem(i => i.setTitle('현재 Canvas에 삽입…').setIcon('layout-dashboard').onClick(() => this.plugin.canvasInsert.files([child.path])));
            menu.showAtMouseEvent(e);
          };
        }
        this.attach(item, child, route, level + 1);
      }
      if (children.length > limit) branch.createEl('button', { text: `더 보기 (${children.length - limit}개)`, cls: 'mdp-links-more' }).onclick = () => { limit += 50; draw(); };
    };
    button.onclick = e => { e.preventDefault(); e.stopPropagation(); expanded = !expanded;
      this.plugin.explorer.expanded = this.plugin.explorer.expanded.filter(k => k !== key);
      if (expanded) this.plugin.explorer.expanded.push(key);
      this.plugin.saveMetadata(); draw();
    };
    button.ondblclick = e => e.stopPropagation();
    button.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); };
    draw();
  }
  picker(host: HTMLElement): void {
    const main = this.plugin.mainFile; if (!main) return;
    for (const file of [main, ...this.plugin.connectedFiles()]) {
      const row = host.createDiv({ cls: 'mdp-source-row' });
      const button = row.createEl('button', { text: `${file === main ? 'Main · ' : ''}${file.name}`, cls: 'mdp-source-file', attr: { title: file.path } });
      button.disabled = file.extension !== 'md';
      button.setAttribute('aria-pressed', String(file === this.plugin.metadataFile));
      button.onclick = () => this.pick?.(file);
      if (file !== main) this.attach(row, file);
    }
  }
  static cardFilter(plugin: MDPalettePlugin): (file: TFile) => boolean {
    return file => plugin.cards.selectedTypes.includes(classify(file.extension)) && (!plugin.cards.labelFilter.length || plugin.cards.labelFilter.includes(plugin.cards.assignments[file.path]));
  }
}
