import { Menu, Notice, TFile, setIcon } from 'obsidian';
import type MDPalettePlugin from './main';
import { footnoteReplacement, metadataSections, parseMetadata, type MetadataItem, type MetadataKind, type MetadataResult } from './metadata-model';

export class MetadataView {
  private host?: HTMLElement;
  private list?: HTMLElement;
  private input?: HTMLInputElement;
  private file?: TFile;
  private source = '';
  private result?: MetadataResult;
  private serial = 0;
  private query = '';
  private filter = 'all';
  private searchCollapsed = new Set<string>();
  private draft = false;
  private pending = false;
  private limits: Partial<Record<MetadataKind, number>> = {};
  constructor(private plugin: MDPalettePlugin) {}
  isMounted(): boolean { return !!this.host?.isConnected; }
  destroy(): void { this.serial++; this.host = undefined; this.list = undefined; this.file = undefined; this.result = undefined; this.draft = false; }
  render(host: HTMLElement): void {
    this.destroy(); this.host = host; host.className = 'mdp-metadata';
    const search = host.createDiv({ cls: 'mdp-metadata-search' }); setIcon(search.createSpan(), 'search');
    this.input = search.createEl('input', { type: 'search', placeholder: '메타데이터 검색…', attr: { 'aria-label': '메타데이터 전체 검색' } });
    this.input.value = this.query;
    this.input.addEventListener('input', () => {
      if (this.draft) this.draft = false;
      this.query = this.input!.value; this.searchCollapsed.clear(); this.limits = {}; this.draw();
    });
    this.list = host.createDiv({ cls: 'mdp-metadata-sections' }); void this.refresh();
  }
  async refresh(): Promise<void> {
    const file = this.plugin.mainFile;
    if (!this.host || !file) return;
    const serial = ++this.serial;
    try {
      const text = await this.plugin.mainText(file);
      if (serial !== this.serial || this.plugin.mainFile !== file || !this.host) return;
      if (this.file === file && this.draft) return;
      if (this.file === file && this.source === text && this.result) return;
      if (this.file !== file) { this.draft = false; this.limits = {}; this.searchCollapsed.clear(); }
      this.file = file; this.source = text;
      this.result = parseMetadata(text);
      // File connections belong in Link View. Metadata Links contains only web URLs.
      const seen = new Set<string>();
      this.result.links = this.result.links.filter(item => {
        const target = this.resolve(item);
        if (!target.url) return false;
        const key = target.url;
        if (seen.has(key)) return false; seen.add(key); return true;
      });
      this.draw();
    } catch (error) { if (serial === this.serial) new Notice(`메타데이터를 읽지 못했습니다: ${String(error)}`); }
  }
  private resolve(item: MetadataItem): { file?: TFile; url?: string; subpath: string } {
    let target = item.target ?? ''; try { target = decodeURI(target); } catch {}
    if (/^https?:\/\//i.test(target)) { try { return { url: new URL(item.target!).href, subpath: '' }; } catch { return { subpath: '' }; } }
    const hash = target.indexOf('#'), path = hash < 0 ? target : target.slice(0, hash), subpath = hash < 0 ? '' : target.slice(hash);
    const file = path ? this.plugin.app.metadataCache.getFirstLinkpathDest(path, this.file!.path) : this.file;
    return { file: file ?? undefined, subpath };
  }
  private draw(): void {
    if (!this.list || !this.result || !this.file) return;
    const scroll = this.host?.closest('.view-content')?.scrollTop ?? 0;
    this.list.empty(); const query = this.query.trim().toLocaleLowerCase();
    for (const [kind, label] of metadataSections) {
      const all = this.result[kind];
      const items = all.filter(item => (!query || [item.text, item.context, item.id, item.target].join(' ').toLocaleLowerCase().includes(query)) && (kind !== 'tasks' || this.filter === 'all' || item.checked === (this.filter === 'done')));
      const section = this.list.createEl('section', { cls: 'mdp-metadata-section', attr: { 'data-kind': kind } });
      const collapsed = query ? this.searchCollapsed.has(kind) : this.plugin.metadataCollapsed.includes(kind);
      const toggle = section.createEl('button', { cls: 'mdp-metadata-toggle', attr: { 'aria-expanded': String(!collapsed) } });
      toggle.createSpan({ text: label }); toggle.createSpan({ text: String(items.length), cls: 'mdp-muted mdp-metadata-count' }); setIcon(toggle.createSpan({ cls: 'mdp-metadata-chevron' }), collapsed ? 'chevron-right' : 'chevron-down');
      const body = section.createDiv({ cls: 'mdp-metadata-body' }); body.hidden = collapsed;
      toggle.onclick = () => {
        const next = !body.hidden; body.hidden = next; toggle.setAttribute('aria-expanded', String(!next)); setIcon(toggle.querySelector('.mdp-metadata-chevron') as HTMLElement, next ? 'chevron-right' : 'chevron-down');
        if (query) { if (next) this.searchCollapsed.add(kind); else this.searchCollapsed.delete(kind); }
        else { this.plugin.metadataCollapsed = this.plugin.metadataCollapsed.filter(k => k !== kind); if (next) this.plugin.metadataCollapsed.push(kind); this.plugin.saveMetadata(); }
      };
      if (kind === 'tasks') {
        const filters = body.createDiv({ cls: 'mdp-tabs mdp-task-filters' });
        for (const [value, title] of [['all', '전체'], ['todo', '미완료'], ['done', '완료']]) {
          const count = all.filter(i => (!query || i.text.toLocaleLowerCase().includes(query)) && (value === 'all' || i.checked === (value === 'done'))).length;
          const button = filters.createEl('button', { text: `${title} (${count})`, cls: this.filter === value ? 'is-selected' : '', attr: { 'aria-pressed': String(this.filter === value) } });
          button.onclick = () => { this.filter = value; this.draft = false; this.draw(); };
        }
      }
      if (!items.length) body.createDiv({ text: query ? '검색 결과 없음' : '항목 없음', cls: 'mdp-muted mdp-metadata-empty' });
      const limit = this.limits[kind] ?? 100;
      for (const item of items.slice(0, limit)) this.item(body, item);
      if (items.length > limit) { const more = body.createEl('button', { text: `더 보기 (${items.length - limit}개)`, cls: 'mdp-metadata-more' }); more.onclick = () => { this.limits[kind] = limit + 100; this.draft = false; this.draw(); }; }
    }
    const scroller = this.host?.closest('.view-content'); if (scroller) scroller.scrollTop = scroll;
  }
  private item(parent: HTMLElement, item: MetadataItem): void {
    const file = this.file!, original = this.source;
    const row = parent.createDiv({ cls: `mdp-metadata-item mdp-meta-${item.kind}${item.checked ? ' is-complete' : ''}` });
    if (item.kind === 'highlights' || item.kind === 'blocks') {
      row.draggable = true;
      row.title = '끌어서 Main/Sub 문서 또는 Sub Canvas에 추가';
      row.ondragstart = event => this.plugin.reuseDrag.startMetadata(event, file, original, item);
    }
    const go = () => this.plugin.run(() => this.plugin.navigateMain(file, item.offset));
    if (item.kind === 'tasks') {
      const checkbox = row.createEl('input', { type: 'checkbox', attr: { 'aria-label': `${item.text} 완료` } }); checkbox.checked = !!item.checked;
      checkbox.onchange = () => {
        if (this.pending) { checkbox.checked = !!item.checked; return; }
        this.pending = true; checkbox.disabled = true;
        void this.plugin.patchMain(file, original, item.from!, item.to!, checkbox.checked ? 'x' : ' ').catch(error => { checkbox.checked = !!item.checked; new Notice(String(error.message ?? error)); }).finally(() => { this.pending = false; checkbox.disabled = false; void this.refresh(); });
      };
    }
    const content = row.createDiv({ cls: 'mdp-metadata-content' });
    if (item.kind === 'links') {
      const target = this.resolve(item);
      const button = content.createEl('button', { cls: 'mdp-metadata-text', text: item.text });
      content.createDiv({ cls: 'mdp-muted mdp-metadata-source', text: target.url ? '웹 링크' : target.file ? target.file.extension.toUpperCase() : '대상 파일 없음' });
      button.onclick = event => {
        if (this.plugin.mainFile !== file) return;
        if (target.url) {
          const menu = new Menu();
          menu.addItem(i => i.setTitle('옵시디언 웹뷰어로 열기').setIcon('globe').onClick(() => this.plugin.run(() => this.plugin.openMetadataWeb(target.url!, false))));
          menu.addItem(i => i.setTitle('기본 브라우저로 열기').setIcon('external-link').onClick(() => this.plugin.run(() => this.plugin.openMetadataWeb(target.url!, true))));
          menu.showAtMouseEvent(event);
        } else if (target.file) this.plugin.run(() => this.plugin.openMetadataFile(target.file!, target.subpath));
        else new Notice('대상 파일을 찾을 수 없습니다. 원래 링크를 확인해주세요.');
      };
      return;
    }
    if (item.id) { const line = content.createDiv({ cls: 'mdp-metadata-id' }); line.createEl('code', { text: item.kind === 'blocks' ? '^' + item.id : '[^' + item.id + ']' }); if (item.duplicate) line.createSpan({ text: '중복 ID', cls: 'mdp-metadata-duplicate' }); }
    if (item.context) { const context = content.createEl('button', { text: item.context, cls: 'mdp-metadata-text mdp-footnote-context' }); context.onclick = go; content.createDiv({ text: '본문 문맥', cls: 'mdp-muted mdp-metadata-source' }); }
    const text = content.createEl('button', { cls: 'mdp-metadata-text', text: item.text }); text.onclick = go;
    if (item.kind === 'highlights') content.createDiv({ cls: 'mdp-muted mdp-metadata-source', text: `${file.name} · ${original.slice(0, item.offset).split('\n').length}번째 줄` });
    if (item.kind === 'footnotes') {
      const edit = content.createEl('button', { text: '편집', cls: 'mdp-footnote-edit' }); edit.disabled = !!item.duplicate;
      edit.onclick = () => {
        if (this.draft) { new Notice('편집 중인 각주를 먼저 저장하거나 취소해주세요.'); return; }
        this.draft = true; text.hidden = true; edit.hidden = true;
        const input = content.createEl('textarea', { cls: 'mdp-footnote-input', attr: { 'aria-label': '각주 내용' } }); input.value = item.text;
        const actions = content.createDiv({ cls: 'mdp-footnote-actions' });
        const save = actions.createEl('button', { text: '저장', cls: 'mod-cta' }); const cancel = actions.createEl('button', { text: '취소' });
        const done = () => { this.draft = false; this.result = undefined; void this.refresh(); };
        cancel.onclick = done;
        save.onclick = () => {
          save.disabled = true; cancel.disabled = true;
          void this.plugin.patchMain(file, original, item.from!, item.to!, footnoteReplacement(item, input.value, original)).then(done).catch(error => {
            new Notice(String(error.message ?? error)); done();
          });
        };
        input.focus();
      };
    }
  }
}
