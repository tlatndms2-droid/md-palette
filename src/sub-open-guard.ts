import { Notice, TFile, WorkspaceLeaf } from 'obsidian';
import type MDPalettePlugin from './main';
import { groupOf, type Group } from './workspace-adapter';

/** Reject file replacement before Obsidian unloads the previous view. */
export class SubOpenGuard {
  private known = new WeakSet<WorkspaceLeaf>();
  private noticeAt = 0;
  private lastAllowed = new WeakMap<Group,WorkspaceLeaf>();
  constructor(private plugin: MDPalettePlugin) {
    plugin.app.workspace.iterateAllLeaves(l => this.known.add(l));
    const guard = this, proto = WorkspaceLeaf.prototype;
    const open = proto.openFile, state = proto.setViewState;
    proto.openFile = async function(file, options) {
      if (guard.block(this, file.path)) return;
      return open.call(this, file, options);
    };
    const wrappedOpen = proto.openFile;
    proto.setViewState = async function(value, ...rest) {
      if (typeof value.state?.file === 'string' && guard.block(this, value.state.file)) return;
      return state.call(this, value, ...rest);
    };
    const wrappedState = proto.setViewState;
    plugin.register(() => { if (proto.openFile === wrappedOpen) proto.openFile = open; if (proto.setViewState === wrappedState) proto.setViewState = state; });
    const workspace = plugin.app.workspace, active = workspace.setActiveLeaf;
    const wrappedActive = function(leaf: WorkspaceLeaf, options?: boolean | {focus?:boolean}, focus?: boolean) {
      const path = leaf?.getViewState().state?.file;
      if (typeof path === 'string' && guard.block(leaf, path)) return;
      return (active as (leaf:WorkspaceLeaf,options?:boolean|{focus?:boolean},focus?:boolean)=>void).call(workspace, leaf, options, focus);
    } as typeof active;
    workspace.setActiveLeaf = wrappedActive;
    plugin.register(() => { if (workspace.setActiveLeaf === wrappedActive) workspace.setActiveLeaf = active; });
    const group = groupOf(plugin.app.workspace.getMostRecentLeaf());
    if (group) {
      const tabs = Object.getPrototypeOf(group) as { selectTabIndex(index: number, ...args: unknown[]): unknown };
      const select = tabs.selectTabIndex;
      const wrapped = function(this: Group, index: number, ...args: unknown[]) {
        const leaf = this.children[index];
        const path = leaf?.getViewState().state?.file;
        if (typeof path === 'string' && guard.block(leaf, path)) return;
        return select.call(this, index, ...args);
      };
      tabs.selectTabIndex = wrapped;
      plugin.register(() => { if (tabs.selectTabIndex === wrapped) tabs.selectTabIndex = select; });
    }
    plugin.registerEvent(plugin.app.workspace.on('file-open', () => plugin.app.workspace.iterateAllLeaves(l => this.known.add(l))));
  }
  allowed(path: string): boolean {
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    // Preserve the existing explicitly supported Main-copy designation.
    return file instanceof TFile && this.plugin.linkedPaths().has(file.path);
  }
  private block(leaf: WorkspaceLeaf, path: string): boolean {
    const group=groupOf(leaf);
    if (!this.plugin.mainFile || !this.plugin.isSub(group) || this.allowed(path)) { this.known.add(leaf); if(group&&this.plugin.isSub(group))this.lastAllowed.set(group,leaf); return false; }
    this.notify();
    // Only remove an empty leaf created by this rejected open; never an existing tab.
    if (!this.known.has(leaf) && leaf.getViewState().type === 'empty') queueMicrotask(() => {
      if (leaf.getViewState().type === 'empty' && this.plugin.isSub(groupOf(leaf))) {
        const previous=this.lastAllowed.get(group!) ?? group!.children.find(l=>{const p=l.getViewState().state?.file;return typeof p==='string'&&this.allowed(p);});
        leaf.detach();
        if(previous&&group!.children.includes(previous))this.plugin.app.workspace.setActiveLeaf(previous,{focus:false});
      }
    });
    return true;
  }
  notify(): void { if (Date.now() - this.noticeAt > 700) { this.noticeAt = Date.now(); new Notice('Sub 공간에서는 Main에 연결된 파일만 열 수 있습니다.'); } }
}
