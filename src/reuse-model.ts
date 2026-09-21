export type ReuseKind = 'file' | 'highlight' | 'block';
export type ReuseMode = 'link' | 'embed' | 'body' | 'text' | 'source';
export type ReuseDestination = 'main-markdown' | 'sub-markdown' | 'sub-canvas' | 'unsupported';

export function canReuse(kind: ReuseKind, destination: ReuseDestination): boolean {
  return kind === 'file' ? destination === 'main-markdown' : destination !== 'unsupported';
}
export function reuseOptions(kind: ReuseKind, markdownFile: boolean, canvas: boolean): Array<{ mode: ReuseMode; title: string }> {
  if (kind === 'file') return [{ mode: 'link', title: '링크 삽입' }, { mode: 'embed', title: '임베드 삽입' }, ...(markdownFile ? [{ mode: 'body' as const, title: '본문 Markdown 삽입' }] : [])];
  if (kind === 'highlight') return [{ mode: 'text', title: canvas ? '텍스트 카드 만들기' : '텍스트 삽입' }, { mode: 'source', title: canvas ? '출처 링크 포함 카드 만들기' : '출처 링크 포함 삽입' }];
  return canvas ? [{ mode: 'text', title: '블록 내용 카드 만들기' }, { mode: 'link', title: '블록 링크 카드 만들기' }] : [{ mode: 'link', title: '블록 링크 삽입' }, { mode: 'embed', title: '블록 임베드 삽입' }];
}
export function reuseText(mode: ReuseMode, link: string, content: string): string {
  // CodeMirror normalizes inserted newlines; match its value for safe rollback.
  content = content.replace(/\r\n?/g, '\n');
  if (mode === 'link') return link;
  if (mode === 'embed') return '!' + link;
  if (mode === 'source') return content + '\n\n출처: ' + link;
  return content;
}
/** Compare saved Canvas data without depending on JSON object key ordering. */
export function sameCanvasData(a: string, b: string): boolean {
  const stable = (value: unknown, key = ''): unknown => Array.isArray(value) ? (key === 'nodes' || key === 'edges' ? [...value].sort((a, b) => String(a.id).localeCompare(String(b.id))) : value).map(v => stable(v)) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => [key, stable(v, key)])) : value;
  try { return JSON.stringify(stable(JSON.parse(a))) === JSON.stringify(stable(JSON.parse(b))); } catch { return false; }
}
