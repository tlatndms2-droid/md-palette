import { Modal, TFile } from 'obsidian';
import type MDPalettePlugin from './main';

export class NewLinkedNoteModal extends Modal {
  constructor(private plugin: MDPalettePlugin, private main: TFile, private folder?: string) { super(plugin.app); }
  onOpen(): void {
    this.titleEl.setText('새 링크 파일 추가');
    this.contentEl.addClass('mdp-new-note');
    this.contentEl.createEl('p', { text: '빈 Markdown 파일을 만들고 현재 Main에 연결합니다.' });
    this.contentEl.createDiv({ text: `Main: ${this.main.path}`, cls: 'mdp-muted' });
    const label = this.contentEl.createEl('label', { text: '파일 이름' });
    const input = label.createEl('input', { type: 'text', attr: { 'aria-label': '새 링크 파일 이름', placeholder: '새 노트', maxlength: '183' } });
    const path = this.contentEl.createDiv({ cls: 'mdp-new-note-path mdp-muted' });
    this.contentEl.createDiv({ text: 'Obsidian의 새 노트 저장 위치 설정을 따릅니다.', cls: 'mdp-muted' });
    const error = this.contentEl.createDiv({ cls: 'mdp-new-note-error', attr: { role: 'alert' } });
    const actions = this.contentEl.createDiv({ cls: 'mdp-modal-actions' });
    const cancel = actions.createEl('button', { text: '취소' });
    const submit = actions.createEl('button', { text: '만들고 연결', cls: 'mod-cta' });
    let pending = false;
    const preview = () => {
      error.setText('');
      try { path.setText(`저장 위치: ${this.plugin.newLinkedNotePath(this.main, input.value || '새 노트')}`); }
      catch (e) { path.setText(''); error.setText(e instanceof Error ? e.message : String(e)); }
    };
    input.oninput = preview;
    cancel.onclick = () => this.close();
    const apply = async () => {
      if (pending) return;
      pending = true; input.disabled = submit.disabled = cancel.disabled = true;
      error.setText('');
      try { await this.plugin.createLinkedNote(this.main, input.value, this.folder); this.close(); }
      catch (e) { error.setText(e instanceof Error ? e.message : String(e)); }
      finally { pending = false; input.disabled = submit.disabled = cancel.disabled = false; input.focus(); }
    };
    submit.onclick = () => { void apply(); };
    input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); void apply(); } };
    preview(); input.focus();
  }
  onClose(): void { this.contentEl.empty(); }
}
