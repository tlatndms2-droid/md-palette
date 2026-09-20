export interface SavedSpace { groupId: string; activeFile: string | null; leafId?: string }
export interface SavedSpaces {
  main?: SavedSpace;
  sub?: SavedSpace;
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
  return result;
}
