import { MarkdownView, Menu, Notice, TFile, type Editor, type EditorPosition, type WorkspaceLeaf } from 'obsidian';
import type MDPalettePlugin from './main';
import type { MetadataItem } from './metadata-model';
import { bodyOnly } from './cards-state';
import { groupOf } from './workspace-adapter';
import { canReuse, footnoteInsertion, webReuseText, reuseOptions, reuseText, sameCanvasData, type ReuseDestination, type ReuseKind, type ReuseMode } from './reuse-model';

const MIME = 'application/x-md-palette-reuse';
interface Source { token: string; kind: ReuseKind; file: TFile; path: string; main: WorkspaceLeaf; mainFile: TFile; original?: string; item?: MetadataItem }
type NativeEditor = Editor & { posAtMouse?: (event: MouseEvent) => EditorPosition | null; cm?: { coordsAtPos(pos: number): { left: number; top: number; bottom: number } | null } };
interface CanvasNode { id: string }
interface NativeCanvas {
  wrapperEl: HTMLElement;
  posFromEvt(event: MouseEvent): { x: number; y: number };
  createTextNode(options: { pos: { x: number; y: number }; size: { width: number; height: number }; text: string; focus: boolean; save: boolean }): CanvasNode;
  removeNode(node: CanvasNode): void;
  requestSave(): void;
  getData(): unknown;
}
interface CanvasView { file: TFile; canvas: NativeCanvas; save(): Promise<void> }
type Target = { leaf: WorkspaceLeaf; file: TFile; path: string; destination: ReuseDestination; editor?: NativeEditor; offset?: number; original: string; canvas?: NativeCanvas; point?: { x: number; y: number } };

/** Only accepts an in-memory, same-plugin drag. No OS file paths or native text fallback. */
export class ReuseDrag {
  private source?: Source;
  private menu?: Menu;
  private stopped = false;
  private pending = false;
  private highlight?: HTMLElement;
  private caret?: HTMLElement;
  private lineHighlight?: HTMLElement;
  private markedTarget?: Target;
  private documents = new Set<Document>();
  private cleanup: Array<() => void> = [];
  constructor(private plugin: MDPalettePlugin) {
    this.bind(document);
    const bindLeaves = () => plugin.app.workspace.iterateAllLeaves(leaf => { this.bind(leaf.view.containerEl.ownerDocument); });
    bindLeaves();
    plugin.registerEvent(plugin.app.workspace.on('layout-change', bindLeaves));
    plugin.registerEvent(plugin.app.workspace.on('window-open', (_workspace, win) => this.bind(win.document)));
  }
  destroy(): void { this.stopped = true; this.source = undefined; this.menu?.hide(); this.clearHighlight(); for (const clean of this.cleanup) clean(); this.documents.clear(); }
  startFile(event: DragEvent, file: TFile): void { this.start(event, 'file', file); }
  startMetadata(event: DragEvent, file: TFile, original: string, item: MetadataItem): void {
    if (item.kind === 'tasks') return;
    const kinds = { highlights: 'highlight', blocks: 'block', footnotes: 'footnote', links: 'url' } as const;
    this.start(event, kinds[item.kind], file, original, item);
  }
  private start(event: DragEvent, kind: ReuseKind, file: TFile, original?: string, item?: MetadataItem): void {
    this.menu?.hide(); this.source = undefined;
    const main = this.plugin.mainLeaf, mainFile = this.plugin.mainFile;
    if (!event.dataTransfer || !main || !mainFile || this.pending) return;
    this.source = { token: crypto.randomUUID(), kind, file, path: file.path, main, mainFile, original, item: item ? { ...item } : undefined };
    event.dataTransfer.setData(MIME, this.source.token);
    event.dataTransfer.effectAllowed = kind === 'file' ? 'copyMove' : 'copy';
  }
  private bind(doc: Document): void {
    if (this.documents.has(doc)) return; this.documents.add(doc);
    const drag = (event: DragEvent) => this.handle(event);
    const clear = () => { this.source = undefined; if (!this.menu) this.clearHighlight(); };
    const leave = (event: DragEvent) => { if (!event.relatedTarget) this.clearHighlight(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { clear(); this.menu?.hide(); } };
    const reposition = () => { const target = this.markedTarget; if (target) { this.clearHighlight(); this.showTarget(target); } };
    doc.addEventListener('scroll', reposition, true);
    doc.defaultView?.addEventListener('resize', reposition);
    doc.addEventListener('dragover', drag, true); doc.addEventListener('drop', drag, true);
    doc.addEventListener('dragend', clear, true); doc.addEventListener('dragleave', leave, true); doc.addEventListener('keydown', escape, true);
    this.cleanup.push(() => { doc.removeEventListener('dragover', drag, true); doc.removeEventListener('drop', drag, true); doc.removeEventListener('dragend', clear, true); doc.removeEventListener('dragleave', leave, true); doc.removeEventListener('keydown', escape, true); });
    this.cleanup.push(() => { doc.removeEventListener('scroll', reposition, true); doc.defaultView?.removeEventListener('resize', reposition); });
  }
  private clearHighlight(): void { this.highlight?.classList.remove('mdp-reuse-target'); this.highlight = undefined; this.caret?.remove(); this.caret = undefined; this.lineHighlight?.remove(); this.lineHighlight = undefined; this.markedTarget = undefined; }
  private showTarget(target: Target): void {
    this.markedTarget = target;
    this.highlight = target.canvas?.wrapperEl ?? target.leaf.view.containerEl;
    this.highlight.classList.add('mdp-reuse-target');
    if (!target.editor || target.offset === undefined) return;
    if (target.editor.getValue() !== target.original) return;
    const rect = target.editor.cm?.coordsAtPos(target.offset);
    if (!rect) return;
    const viewport = target.leaf.view.containerEl.querySelector('.cm-scroller')?.getBoundingClientRect();
    if (viewport && (rect.top < viewport.top || rect.bottom > viewport.bottom || rect.left < viewport.left || rect.left > viewport.right)) return;
    const doc = target.leaf.view.containerEl.ownerDocument;
    const content = target.leaf.view.containerEl.querySelector('.cm-content')?.getBoundingClientRect();
    if (content && viewport) {
      const left = Math.max(content.left, viewport.left), right = Math.min(content.right, viewport.right);
      if (right > left) {
        this.lineHighlight = doc.createElement('div');
        this.lineHighlight.className = 'mdp-reuse-line';
        this.lineHighlight.setAttribute('aria-hidden', 'true');
        Object.assign(this.lineHighlight.style, { left: `${left}px`, top: `${rect.top}px`, width: `${right - left}px`, height: `${rect.bottom - rect.top}px` });
        doc.body.appendChild(this.lineHighlight);
      }
    }
    this.caret = doc.createElement('div');
    this.caret.className = 'mdp-reuse-caret';
    this.caret.setAttribute('aria-hidden', 'true');
    Object.assign(this.caret.style, { left: `${rect.left}px`, top: `${rect.top}px`, height: `${rect.bottom - rect.top}px` });
    doc.body.appendChild(this.caret);
  }
  private destination(leaf: WorkspaceLeaf): ReuseDestination {
    if (!this.plugin.mainFile) return 'unsupported';
    if (leaf.view instanceof MarkdownView && leaf.view.getMode() === 'source') {
      if (leaf === this.plugin.mainLeaf) return 'main-markdown';
      if (this.plugin.isSub(groupOf(leaf))) return 'sub-markdown';
    }
    if (leaf.getViewState().type === 'canvas' && this.plugin.isSub(groupOf(leaf))) return 'sub-canvas';
    return 'unsupported';
  }
  private target(event: DragEvent, source: Source): Target | null {
    let leaf: WorkspaceLeaf | undefined;
    const path = event.composedPath();
    this.plugin.app.workspace.iterateAllLeaves(candidate => { if (path.includes(candidate.view.containerEl)) leaf = candidate; });
    if (!leaf) return null;
    const destination = this.destination(leaf);
    if (!canReuse(source.kind, destination)) return null;
    if (leaf.view instanceof MarkdownView) {
      // Native editor body only: no tab bars, Properties, reading view or toolbars.
      if (!path.some(el => (el as HTMLElement)?.classList?.contains('cm-content'))) return null;
      const editor = leaf.view.editor as NativeEditor, pos = editor.posAtMouse?.(event);
      if (!pos || !leaf.view.file) return null;
      return { leaf, destination, file: leaf.view.file, path: leaf.view.file.path, editor, offset: editor.posToOffset(pos), original: editor.getValue() };
    }
    const view = leaf.view as unknown as CanvasView, canvas = view.canvas;
    if (!view.file || !canvas || !path.includes(canvas.wrapperEl) || typeof canvas.posFromEvt !== 'function' || typeof canvas.createTextNode !== 'function' || typeof canvas.removeNode !== 'function' || typeof view.save !== 'function') return null;
    const point = canvas.posFromEvt(event);
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    return { leaf, destination, file: view.file, path: view.file.path, canvas, point, original: JSON.stringify(canvas.getData()) };
  }
  private handle(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes(MIME)) return;
    // Existing card-grid reordering owns its own drag/drop events.
    if (event.composedPath().some(el => (el as HTMLElement)?.classList?.contains('mdp-card-grid'))) { this.clearHighlight(); return; }
    event.preventDefault(); event.stopImmediatePropagation(); this.clearHighlight();
    const source = this.source;
    const target = source && !this.pending ? this.target(event, source) : null;
    event.dataTransfer.dropEffect = target ? 'copy' : 'none';
    if (event.type === 'dragover') {
      if (target) this.showTarget(target);
      return;
    }
    this.source = undefined;
    if (!source || event.dataTransfer.getData(MIME) !== source.token) return;
    if (!target) { new Notice(source.kind === 'file' ? '파일 카드 한 개를 Main/Sub 문서의 편집 영역에 놓아주세요.' : 'Main/Sub 문서의 편집 영역 또는 Sub Canvas에 놓아주세요.'); return; }
    const menu = new Menu(); this.menu?.hide(); this.menu = menu;
    this.showTarget(target);
    menu.onHide(() => { if (this.menu === menu) { this.menu = undefined; this.clearHighlight(); } });
    for (const option of reuseOptions(source.kind, source.file.extension === 'md', !!target.canvas)) {
      menu.addItem(item => item.setTitle(option.title).setIcon(option.mode === 'link' || option.mode === 'source' ? 'link' : 'file-text').onClick(() => {
        if (this.pending || this.stopped) return;
        this.pending = true;
        void this.commit(source, target, option.mode).catch(error => { new Notice(String(error.message ?? error)); }).finally(() => { this.pending = false; });
      }));
    }
    menu.addSeparator(); menu.addItem(item => item.setTitle('취소').setIcon('x').onClick(() => {}));
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
  private valid(source: Source, target: Target): boolean {
    const app = this.plugin.app;
    return !this.stopped && this.plugin.mainLeaf === source.main && this.plugin.mainFile === source.mainFile
      && app.vault.getAbstractFileByPath(source.path) === source.file && source.file.path === source.path
      && app.vault.getAbstractFileByPath(target.path) === target.file && target.file.path === target.path
      && this.destination(target.leaf) === target.destination
      && (target.leaf.view as MarkdownView).file === target.file
      && target.leaf.view.containerEl.isConnected;
  }
  private async fileText(file: TFile): Promise<string> {
    let value: string | undefined;
    this.plugin.app.workspace.iterateAllLeaves(leaf => { if (leaf.view instanceof MarkdownView && leaf.view.file === file) value = leaf.view.editor.getValue(); });
    return value ?? this.plugin.app.vault.read(file);
  }
  private async commit(source: Source, target: Target, mode: ReuseMode): Promise<void> {
    const app = this.plugin.app;
    if (!this.valid(source, target)) throw Error('문서 또는 Space가 변경되었습니다. 다시 끌어 놓아주세요.');
    let content = source.item?.text ?? '';
    if (source.original !== undefined && await this.fileText(source.file) !== source.original) throw Error('원문이 변경되었습니다. 최신 항목을 다시 끌어 놓아주세요.');
    if (mode === 'body') content = bodyOnly(await this.fileText(source.file));
    const link = app.fileManager.generateMarkdownLink(source.file, target.file.path, source.kind === 'block' ? '#^' + source.item!.id : undefined);
    const text = source.kind === 'url' ? webReuseText(source.item!.target!, source.item!.text, mode === 'named-url') : mode === 'footnote' && target.canvas ? footnoteInsertion('', 0, content).value : reuseText(mode, link, content);
    if (!text) throw Error('삽입할 본문이 없습니다.');
    const disk = await app.vault.read(target.file);
    if (!this.valid(source, target)) throw Error('문서 또는 Space가 변경되었습니다. 다시 끌어 놓아주세요.');
    if (source.original !== undefined && (source.main.view as MarkdownView).editor.getValue() !== source.original) throw Error('원문이 변경되었습니다. 최신 항목을 다시 끌어 놓아주세요.');
    if (target.editor) {
      const view = target.leaf.view as MarkdownView, editor = target.editor;
      if (view.editor !== editor || editor.getValue() !== target.original) throw Error('삽입 대상이 변경되었습니다. 다시 끌어 놓아주세요.');
      // Refuse an external-disk conflict instead of overwriting newer content.
      if (disk.replace(/\r\n/g, '\n') !== target.original.replace(/\r\n/g, '\n')) throw Error('문서 저장이 끝난 뒤 다시 끌어 놓아주세요.');
      const insertion = mode === 'footnote' ? footnoteInsertion(target.original, target.offset!, content) : { changes: [{ offset: target.offset!, text }], value: target.original.slice(0, target.offset) + text + target.original.slice(target.offset!) };
      const changed = insertion.value;
      editor.transaction({ changes: insertion.changes.map(change => ({ from: editor.offsetToPos(change.offset), text: change.text })) }, 'input.drop');
      try { await view.save(); }
      catch (error) {
        if (editor.getValue() === changed) {
          editor.replaceRange(target.original, { line: 0, ch: 0 }, editor.offsetToPos(changed.length));
          await app.vault.process(target.file, current => current.replace(/\r\n/g, '\n') === changed.replace(/\r\n/g, '\n') ? disk : current);
        }
        throw Error('삽입 내용을 저장하지 못했습니다. ' + String(error));
      }
    } else if (target.canvas) {
      const canvas = target.canvas, view = target.leaf.view as unknown as CanvasView;
      if (view.canvas !== canvas || JSON.stringify(canvas.getData()) !== target.original) throw Error('Canvas가 변경되었습니다. 다시 끌어 놓아주세요.');
      if (!sameCanvasData(disk, target.original)) throw Error('Canvas 저장이 끝난 뒤 다시 끌어 놓아주세요.');
      // Native creation preserves coordinate transforms, existing nodes and undo history.
      let node: CanvasNode | undefined;
      try {
        node = canvas.createTextNode({ pos: target.point!, size: { width: 300, height: 180 }, text, focus: false, save: false });
        canvas.requestSave(); await view.save();
      } catch (error) {
        if (node) { canvas.removeNode(node); canvas.requestSave(); await view.save(); }
        throw Error('Canvas 카드를 저장하지 못했습니다. ' + String(error));
      }
    }
  }
}
