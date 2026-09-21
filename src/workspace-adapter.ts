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
  setDirection(direction: string): void;
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
  const root = activeIn(main)?.getRoot() as unknown as Split | undefined;
  if (!root || !Array.isArray(root.children) || typeof root.setDirection !== 'function') throw Error('지원하지 않는 작업 공간 구조입니다.');
  const branch = (): Group | Split => {
    let node: Group | Split = main;
    while (node.parent && node.parent !== root) node = node.parent;
    if (node.parent !== root) throw Error('메인 탭의 위치를 찾을 수 없습니다.');
    return node;
  };
  const ordered = () => root.direction === 'vertical' && followers.every((g, i) => g.parent === root && root.children[root.children.indexOf(branch()) + i + 1] === g);
  if (ordered()) return false;
  for (const group of [main, ...followers]) {
    if (!group.parent || typeof group.parent.removeChild !== 'function' || typeof group.parent.insertChild !== 'function') throw Error('지원하지 않는 탭 그룹 구조입니다.');
  }
  // Keep the complete top/bottom layout together as the left column.
  // Obsidian's "vertical" direction means side-by-side columns.
  if (root.direction !== 'vertical') {
    const Constructor = WorkspaceSplit as unknown as new (workspace: App['workspace'], direction: string) => Split;
    const stack = new Constructor(app.workspace, root.direction);
    if (typeof stack.insertChild !== 'function') throw Error('지원하지 않는 작업 공간 구조입니다.');
    for (const child of [...root.children]) { root.removeChild(child); stack.insertChild(stack.children.length, child); }
    root.setDirection('vertical');
    root.insertChild(0, stack);
  }
    let anchor: Group | Split = branch();
    for (const group of followers) {
      if (group.parent === root && root.children[root.children.indexOf(anchor) + 1] === group) { anchor = group; continue; }
      const oldParent = group.parent;
      const oldIndex = oldParent.children.indexOf(group);
      oldParent.removeChild(group);
      // Extracting a nested Sub may collapse the old split around Main.
      if (!root.children.includes(anchor)) anchor = branch();
      try { root.insertChild(root.children.indexOf(anchor) + 1, group); }
      catch (error) { oldParent.insertChild(oldIndex, group); throw error; }
      anchor = group;
    }
  app.workspace.requestSaveLayout();
  return true;
}
