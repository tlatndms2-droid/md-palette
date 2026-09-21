export interface SavedSpace { groupId: string; activeFile: string | null; leafId?: string }
export interface SavedSpaces {
  main?: SavedSpace;
  sub?: SavedSpace;
  subs?: SavedSpace[];
}
export type TopView = 'link' | 'metadata';
export type LinkView = 'card' | 'connections' | 'folder';
export function readSpaces(value: unknown): SavedSpaces {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const result: SavedSpaces = {};
  for (const key of ['main', 'sub'] as const) {
    const item = raw[key] as Partial<SavedSpace> | undefined;
    if (item && typeof item.groupId === 'string' && (typeof item.activeFile === 'string' || item.activeFile === null)) result[key] = { groupId: item.groupId, activeFile: item.activeFile, ...(typeof item.leafId === 'string' ? { leafId: item.leafId } : {}) };
  }
  if (Array.isArray(raw.subs)) {
    const seen = new Set<string>();
    result.subs = raw.subs.flatMap(item => {
      if (!item || typeof item.groupId !== 'string' || (typeof item.activeFile !== 'string' && item.activeFile !== null) || seen.has(item.groupId) || item.groupId === result.main?.groupId) return [];
      seen.add(item.groupId); return [{ groupId: item.groupId, activeFile: item.activeFile }];
    });
  }
  return result;
}
export type SubOpenMode = 'replace' | 'tab' | 'group';
export function subOpenMode(event?: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }): SubOpenMode {
  return event && (event.ctrlKey || event.metaKey) ? event.shiftKey ? 'group' : 'tab' : 'replace';
}
