export const fileTypes = ['all', 'md', 'canvas', 'pdf', 'image', 'video', 'other'] as const;
export type FileType = typeof fileTypes[number];
export const displayModes = ['large', 'medium', 'small', 'list', 'details', 'tiles'] as const;
export type DisplayMode = typeof displayModes[number];
export interface Label { id: string; name: string; color: string }
export interface CardState {
  order: string[]; labels: Label[]; assignments: Record<string, string>;
  fileType: FileType; selectedTypes: FileType[]; labelFilter: string[]; typeCollapsed: boolean; labelCollapsed: boolean;
  display: DisplayMode; textSize: 'small' | 'normal' | 'large';
}
export function readCards(raw: unknown): CardState {
  const v = raw && typeof raw === 'object' ? raw as Partial<CardState> : {};
  const strings = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((s): s is string => typeof s === 'string'))] : [];
  const labels: Label[] = [];
  if (Array.isArray(v.labels)) for (const l of v.labels) {
    if (l && typeof l.id === 'string' && typeof l.name === 'string' && /^#[\da-f]{6}$/i.test(l.color) && !labels.some(x => x.id === l.id)) labels.push({ id: l.id, name: l.name, color: l.color });
  }
  const assignments: Record<string, string> = Object.create(null);
  if (v.assignments && typeof v.assignments === 'object') for (const [path, id] of Object.entries(v.assignments)) if (labels.some(l => l.id === id)) assignments[path] = id;
  return { order: strings(v.order), labels: labels.filter(l => Object.values(assignments).includes(l.id)), assignments,
    fileType: fileTypes.includes(v.fileType!) ? v.fileType! : 'all',
    selectedTypes: Array.isArray(v.selectedTypes) ? strings(v.selectedTypes).filter((t): t is FileType => t !== 'all' && fileTypes.includes(t as FileType)) : v.fileType && v.fileType !== 'all' && fileTypes.includes(v.fileType) ? [v.fileType] : fileTypes.filter(t => t !== 'all'),
    labelFilter: strings(v.labelFilter).filter(id => Object.values(assignments).includes(id)),
    typeCollapsed: v.typeCollapsed === true, labelCollapsed: v.labelCollapsed === true,
    display: 'list', textSize: v.textSize === 'small' || v.textSize === 'large' ? v.textSize : 'normal' };
}
export function toggleType(state: CardState, type: FileType): void {
  state.selectedTypes = type === 'all' ? fileTypes.filter(t => t !== 'all') : state.selectedTypes.includes(type) ? state.selectedTypes.filter(t => t !== type) : [...state.selectedTypes, type];
  state.fileType = state.selectedTypes.length === 1 ? state.selectedTypes[0] : 'all';
}
export function typeSelected(state: CardState, type: FileType): boolean { return type === 'all' ? fileTypes.filter(t => t !== 'all').every(t => state.selectedTypes.includes(t)) : state.selectedTypes.includes(type); }
export function classify(extension: string): FileType {
  const ext = extension.toLowerCase();
  if (['md', 'canvas', 'pdf'].includes(ext)) return ext as FileType;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'mkv', 'ogv'].includes(ext)) return 'video';
  return 'other';
}
export function bodyOnly(text: string): string { return text.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)\s*(?:\r?\n|$)/, ''); }
export function reorder(order: string[], selected: string[], target: string | null, after: boolean): string[] {
  const moving = new Set(selected);
  if (target && moving.has(target)) return order;
  const block = order.filter(p => moving.has(p)), rest = order.filter(p => !moving.has(p));
  const index = target === null ? rest.length : rest.indexOf(target);
  if (index < 0) return order;
  rest.splice(index + (target !== null && after ? 1 : 0), 0, ...block);
  return rest;
}
export function pruneLabels(state: CardState): void {
  const used = new Set(Object.values(state.assignments));
  state.labels = state.labels.filter(l => used.has(l.id));
  state.labelFilter = state.labelFilter.filter(id => used.has(id));
}
export function deleteLabel(state: CardState, id: string): void {
  state.labels = state.labels.filter(label => label.id !== id);
  state.labelFilter = state.labelFilter.filter(label => label !== id);
  for (const path of Object.keys(state.assignments)) if (state.assignments[path] === id) delete state.assignments[path];
}
