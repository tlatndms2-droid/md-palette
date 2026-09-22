import { Modal, TFile } from 'obsidian';
import type MDPalettePlugin from './main';
import type { NewNoteFormat } from './new-note-name';

export class NewLinkedNoteModal extends Modal {
  constructor(private plugin: MDPalettePlugin, private main: TFile, private folder?: string) { super(plugin.app); }
  onOpen(): void {
    this.titleEl.setText('새 링크 파일 추가');
    this.contentEl.addClass('mdp-new-note');
    this.contentEl.createEl('p', { text: '빈 파일을 만들고 현재 Main에 연결합니다. 자동으로 열지는 않습니다.' });
    this.contentEl.createDiv({ text: `Main: ${this.main.path}`, cls: 'mdp-muted' });
    const formatLabel = this.contentEl.createEl('label', { text: '파일 형식' });
    const format = formatLabel.createEl('select', { attr: { 'aria-label': '새 링크 파일 형식' } });
    format.createEl('option', { value: 'md', text: 'Markdown (.md)' });
    format.createEl('option', { value: 'canvas', text: 'Canvas (.canvas)' });
    const label = this.contentEl.createEl('label', { text: '파일 이름' });
    const input = label.createEl('input', { type: 'text', attr: { 'aria-label': '새 링크 파일 이름', placeholder: '새 노트', maxlength: '187' } });
    const path = this.contentEl.createDiv({ cls: 'mdp-new-note-path mdp-muted' });
    this.contentEl.createDiv({ text: 'Obsidian의 새 노트 저장 위치 설정을 따릅니다.', cls: 'mdp-muted' });
    const error = this.contentEl.createDiv({ cls: 'mdp-new-note-error', attr: { role: 'alert' } });
    const actions = this.contentEl.createDiv({ cls: 'mdp-modal-actions' });
    const cancel = actions.createEl('button', { text: '취소' });
    const submit = actions.createEl('button', { text: '만들고 연결', cls: 'mod-cta' });
    let pending = false;
    const preview = () => {
      error.setText('');
      try { path.setText(`저장 위치: ${this.plugin.newLinkedNotePath(this.main, input.value || '새 노트', format.value as NewNoteFormat)}`); }
      catch (e) { path.setText(''); error.setText(e instanceof Error ? e.message : String(e)); }
    };
    input.oninput = preview;
    format.onchange = preview;
    cancel.onclick = () => this.close();
    const apply = async () => {
      if (pending) return;
      pending = true; format.disabled = input.disabled = submit.disabled = cancel.disabled = true;
      error.setText('');
      try { await this.plugin.createLinkedNote(this.main, input.value, this.folder, format.value as NewNoteFormat); this.close(); }
      catch (e) { error.setText(e instanceof Error ? e.message : String(e)); }
      finally { pending = false; format.disabled = input.disabled = submit.disabled = cancel.disabled = false; input.focus(); }
    };
    submit.onclick = () => { void apply(); };
    input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); void apply(); } };
    preview(); input.focus();
  }
  onClose(): void { this.contentEl.empty(); }
}
