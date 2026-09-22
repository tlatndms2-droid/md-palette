import { Modal, TFile } from 'obsidian';
import type MDPalettePlugin from './main';

export class SubDesignationModal extends Modal {
  private pending = false;
  constructor(plugin: MDPalettePlugin, private main: TFile, private file: TFile, private apply: () => Promise<void>) { super(plugin.app); }
  onOpen(): void {
    this.titleEl.setText('Main에 연결하시겠습니까?');
    this.contentEl.addClass('mdp-sub-designation');
    this.contentEl.createEl('p', { text: `${this.file.path} 파일은 현재 Main에 연결되어 있지 않습니다.` });
    this.contentEl.createDiv({ text: `Main: ${this.main.path}`, cls: 'mdp-muted' });
    this.contentEl.createEl('p', { text: '연결하면 이 탭 그룹을 Sub로 지정합니다. 기존 Sub 그룹과 열린 파일은 일반 상태로 유지합니다.' });
    const error = this.contentEl.createDiv({ cls: 'mdp-new-note-error', attr: { role: 'alert' } });
    const actions = this.contentEl.createDiv({ cls: 'mdp-modal-actions' });
    const cancel = actions.createEl('button', { text: '취소' });
    const confirm = actions.createEl('button', { text: '연결하고 Sub로 지정', cls: 'mod-cta' });
    cancel.onclick = () => this.close();
    confirm.onclick = async () => {
      if (this.pending) return;
      this.pending = true; cancel.disabled = confirm.disabled = true; error.setText('');
      try { await this.apply(); super.close(); }
      catch (e) { error.setText(e instanceof Error ? e.message : String(e)); }
      finally { this.pending = false; cancel.disabled = confirm.disabled = false; }
    };
  }
  close(): void { if (!this.pending) super.close(); }
  onClose(): void { this.contentEl.empty(); }
}
