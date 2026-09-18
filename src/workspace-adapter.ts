import { App, TFile, WorkspaceLeaf, WorkspaceSplit } from 'obsidian';

// Obsidian exposes the workspace tree, but not typed live group moves.
// Keep runtime-only members behind this adapter and check before mutation.
export type Group = {
  id: string;
  type: 'tabs';
  children: WorkspaceLeaf[];
  currentTab: number;
  parent: Split;
  containerEl: HTMLElement;
};
export type Split = {
  id: string;
  type: string;
  direction: string;
  parent?: Split;
  children: Array<Group | Split>;
  containerEl: HTMLElement;
  removeChild(item: Group | Split): void;
  insertChild(index: number, item: Group | Split): void;
};

export function groupOf(leaf: WorkspaceLeaf | null): Group | undefined {
  const group = leaf?.parent as unknown as Group | undefined;
  return group?.type === 'tabs' && Array.isArray(group.children) ? group : undefined;
}
export function activeIn(group?: Group): WorkspaceLeaf | undefined {
  return group?.children[group.currentTab] ?? group?.children[0];
}
export function fileIn(app: App, leaf?: WorkspaceLeaf): TFile | null {
  const path = leaf?.getViewState().state?.file;
  const file = typeof path === 'string' ? app.vault.getAbstractFileByPath(path) : null;
  return file instanceof TFile ? file : null;
}
export function markdownIn(app: App, group?: Group): TFile | null {
  const leaf = activeIn(group);
  const file = fileIn(app, leaf);
  return file?.extension === 'md' && leaf?.getViewState().type === 'markdown' ? file : null;
}
export function groupsIn(app: App): Group[] {
  const groups = new Set<Group>();
  app.workspace.iterateAllLeaves(leaf => { const g = groupOf(leaf); if (g) groups.add(g); });
  return [...groups];
}
export function isCentral(app: App, group?: Group): boolean {
  if (!group) return false;
  // A sidebar is not a Space. Main-window and popout document groups are allowed.
  const root = activeIn(group)?.getRoot();
  return !!root && root !== app.workspace.leftSplit && root !== app.workspace.rightSplit;
}
export function newTab(app: App, group: Group): WorkspaceLeaf {
  return app.workspace.createLeafInParent(group as unknown as WorkspaceSplit, group.children.length);
}

/** Move managed groups only, preserving every leaf and all ordinary groups. */
export function arrange(app: App, main: Group, followers: Group[]): boolean {
  if (!followers.length) return false;
  let parent = main.parent;
  const ordered = () => parent.direction === 'vertical' && followers.every((g, i) => g.parent === parent && parent.children[parent.children.indexOf(main) + i + 1] === g);
  if (ordered()) return false;
  for (const group of [main, ...followers]) {
    if (!group.parent || typeof group.parent.removeChild !== 'function' || typeof group.parent.insertChild !== 'function') throw Error('지원하지 않는 탭 그룹 구조입니다.');
  }
  let spacer: WorkspaceLeaf | undefined;
  // A vertical split is left-to-right in Obsidian. Preserve other horizontal rows.
  if (parent.direction !== 'vertical') {
    const leaf = activeIn(main);
    if (!leaf) throw Error('메인 탭을 찾을 수 없습니다.');
    spacer = app.workspace.createLeafBySplit(leaf, 'vertical');
    parent = main.parent;
  }
  try {
    let anchor = main;
    for (const group of followers) {
      parent = anchor.parent;
      if (group.parent === parent && parent.children[parent.children.indexOf(anchor) + 1] === group) { anchor = group; continue; }
      const oldParent = group.parent;
      const oldIndex = oldParent.children.indexOf(group);
      oldParent.removeChild(group);
      // Removal can collapse an intermediate split. Re-read the live anchor parent.
      try { anchor.parent.insertChild(anchor.parent.children.indexOf(anchor) + 1, group); }
      catch (error) { oldParent.insertChild(oldIndex, group); throw error; }
      anchor = group;
    }
  } finally { spacer?.detach(); }
  app.workspace.requestSaveLayout();
  return true;
}
