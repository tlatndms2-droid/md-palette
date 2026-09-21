import type { DisplayMode } from './cards-state';
export type FolderDisplay = DisplayMode | 'compact';
export const folderDisplayModes: readonly FolderDisplay[] = ['compact', 'large', 'medium', 'small', 'list', 'details', 'tiles'];
export interface VirtualFolder { id: string; name: string; parent: string }
export type Sort = 'manual' | 'name' | 'type' | 'mtime' | 'size';
export interface FolderState {
  folders: VirtualFolder[]; positions: Record<string, string>; order: string[];
  mode: 'composite' | 'tree' | 'folder'; display: FolderDisplay; current: string;
  collapsed: string[]; treeSort: 'manual' | 'name'; sort: Sort; descending: boolean;
  split: number; layout: 'vertical' | 'horizontal';
}
export const folderKey = (id: string): string => 'd:' + id;
export const fileKey = (path: string): string => 'f:' + path;
// Legacy global folders are intentionally not copied into any document.
export function readDocumentFolders(raw: unknown): Record<string, FolderState> {
  const result: Record<string, FolderState> = Object.create(null);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [path, value] of Object.entries(raw)) if (path.endsWith('.md')) result[path] = readFolders(value);
  }
  return result;
}
export function readFolders(raw: unknown): FolderState {
  const v = raw && typeof raw === 'object' ? raw as Partial<FolderState> : {};
  const folders: VirtualFolder[] = [];
  for (const f of Array.isArray(v.folders) ? v.folders : []) if (f && typeof f.id === 'string' && f.id && typeof f.name === 'string' && f.name.trim() && typeof f.parent === 'string' && !folders.some(x => x.id === f.id)) folders.push({ id: f.id, name: f.name, parent: f.parent });
  for (const f of folders) {
    const seen = new Set([f.id]); let parent = f.parent;
    while (parent) { if (seen.has(parent)) { f.parent = ''; break; } seen.add(parent); const next = folders.find(x => x.id === parent); if (!next) { f.parent = ''; break; } parent = next.parent; }
  }
  const exists = (id: unknown): id is string => typeof id === 'string' && (!id || folders.some(f => f.id === id));
  const positions: Record<string, string> = Object.create(null);
  if (v.positions && typeof v.positions === 'object') for (const [path, id] of Object.entries(v.positions)) if (exists(id)) positions[path] = id;
  return { folders, positions, order: Array.isArray(v.order) ? [...new Set(v.order.filter(x => typeof x === 'string'))] : [],
    mode: v.mode === 'tree' || v.mode === 'folder' ? v.mode : 'composite', display: folderDisplayModes.includes(v.display!) ? v.display! : 'compact',
    current: exists(v.current) ? v.current : '', collapsed: Array.isArray(v.collapsed) ? v.collapsed.filter(exists) : [], treeSort: v.treeSort === 'name' ? 'name' : 'manual',
    sort: ['manual','name','type','mtime','size'].includes(v.sort!) ? v.sort! : 'manual', descending: v.descending === true,
    split: typeof v.split === 'number' && Number.isFinite(v.split) ? Math.max(.2, Math.min(.8, v.split)) : .5, layout: v.layout === 'horizontal' ? 'horizontal' : 'vertical' };
}
export function ancestors(s: FolderState, id: string): string[] {
  const result: string[] = []; const seen = new Set<string>();
  while (id && !seen.has(id)) { seen.add(id); const f = s.folders.find(x => x.id === id); if (!f) break; result.unshift(id); id = f.parent; }
  return result;
}
export function parentOf(s: FolderState, key: string): string { return key.startsWith('d:') ? s.folders.find(f => folderKey(f.id) === key)?.parent ?? '' : s.positions[key.slice(2)] ?? ''; }
export function canMove(s: FolderState, keys: string[], target: string): boolean {
  if (target && !s.folders.some(f => f.id === target)) return false;
  return keys.length > 0 && keys.every(key => !key.startsWith('d:') || (s.folders.some(f => folderKey(f.id) === key) && !ancestors(s, target).includes(key.slice(2))));
}
export function moveItems(s: FolderState, keys: string[], target: string, before?: string): void {
  if (!canMove(s, keys, target)) throw Error('자기 자신이나 하위 폴더로 이동할 수 없습니다.');
  const selected = new Set(keys);
  const top = keys.filter(key => !ancestors(s, parentOf(s, key)).some(id => selected.has(folderKey(id))));
  if (before && top.includes(before)) return;
  for (const key of top) {
    if (key.startsWith('d:')) s.folders.find(f => folderKey(f.id) === key)!.parent = target;
    else s.positions[key.slice(2)] = target;
  }
  const moving = new Set(top), ordered = [...s.order.filter(k => moving.has(k)), ...top.filter(k => !s.order.includes(k))];
  s.order = s.order.filter(k => !moving.has(k));
  const index = before ? s.order.indexOf(before) : -1;
  s.order.splice(index < 0 ? s.order.length : index, 0, ...ordered);
}
export function deleteFolder(s: FolderState, id: string): void {
  const folder = s.folders.find(f => f.id === id); if (!folder) return;
  for (const f of s.folders) if (f.parent === id) f.parent = folder.parent;
  for (const path of Object.keys(s.positions)) if (s.positions[path] === id) s.positions[path] = folder.parent;
  if (s.current === id) s.current = folder.parent;
  s.folders = s.folders.filter(f => f.id !== id); s.order = s.order.filter(k => k !== folderKey(id)); s.collapsed = s.collapsed.filter(k => k !== id);
}
