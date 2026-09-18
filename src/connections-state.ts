export const sectionKeys = ['backlinks', 'outgoing', 'graph'] as const;
export type SectionKey = typeof sectionKeys[number];
export interface ConnectionsState { graphOptions?: Record<string, unknown>; heights: Record<SectionKey, number>; collapsed: Record<SectionKey, boolean> }
export function readConnections(value: unknown): ConnectionsState {
  const state: ConnectionsState = { heights: { backlinks: 25, outgoing: 25, graph: 50 }, collapsed: { backlinks: false, outgoing: false, graph: false } };
  if (!value || typeof value !== 'object') return state;
  const raw = value as Partial<ConnectionsState>;
  if (raw.graphOptions && typeof raw.graphOptions === 'object' && !Array.isArray(raw.graphOptions)) state.graphOptions = structuredClone(raw.graphOptions);
  for (const key of sectionKeys) {
    const n = raw.heights?.[key];
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) state.heights[key] = Math.max(1, Math.min(1000, n));
    state.collapsed[key] = raw.collapsed?.[key] === true;
  }
  return state;
}
export function relations(links: Record<string, Record<string, number>>, main: string, markdownPaths: Set<string>): { backlinks: string[]; outgoing: string[] } {
  const outgoing = Object.keys(links[main] ?? {}).filter(p => p !== main && markdownPaths.has(p) && links[main][p] > 0);
  const backlinks = Object.keys(links).filter(p => p !== main && markdownPaths.has(p) && links[p][main] > 0);
  return { backlinks: backlinks.sort((a, b) => a.localeCompare(b)), outgoing: outgoing.sort((a, b) => a.localeCompare(b)) };
}
