export type ReuseKind = 'file' | 'highlight' | 'block' | 'footnote' | 'url';
export type ReuseMode = 'link' | 'embed' | 'body' | 'text' | 'source' | 'footnote' | 'address' | 'named-url';
export type ReuseDestination = 'main-markdown' | 'sub-markdown' | 'sub-canvas' | 'unsupported';

export function canReuse(kind: ReuseKind, destination: ReuseDestination): boolean {
  return kind === 'file' ? destination === 'main-markdown' || destination === 'sub-markdown' : destination !== 'unsupported';
}
export function reuseOptions(kind: ReuseKind, markdownFile: boolean, canvas: boolean): Array<{ mode: ReuseMode; title: string }> {
  if (kind === 'footnote') return [{ mode: 'text', title: canvas ? '텍스트 카드 만들기' : '텍스트로 삽입' }, { mode: 'footnote', title: canvas ? '각주 카드 만들기' : '실제 각주로 추가' }];
  if (kind === 'url') return [{ mode: 'address', title: canvas ? '주소 텍스트 카드 만들기' : '주소 그대로 삽입' }, { mode: 'named-url', title: canvas ? '제목 링크 카드 만들기' : '제목이 있는 링크 삽입' }];
  if (kind === 'file') return [{ mode: 'link', title: '링크 삽입' }, { mode: 'embed', title: '임베드 삽입' }, ...(markdownFile ? [{ mode: 'body' as const, title: '본문 Markdown 삽입' }] : [])];
  if (kind === 'highlight') return [{ mode: 'text', title: canvas ? '텍스트 카드 만들기' : '텍스트 삽입' }, { mode: 'source', title: canvas ? '출처 링크 포함 카드 만들기' : '출처 링크 포함 삽입' }];
  return canvas ? [{ mode: 'text', title: '블록 내용 카드 만들기' }, { mode: 'link', title: '블록 링크 카드 만들기' }] : [{ mode: 'link', title: '블록 링크 삽입' }, { mode: 'embed', title: '블록 임베드 삽입' }];
}
export function webReuseText(raw: string, title: string, named: boolean): string {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw Error('지원하지 않는 웹 주소입니다.');
  if (!named) return url.href;
  const label = (title.trim() || url.href).replace(/[\r\n]+/g, ' ').replace(/[\\\[\]]/g, '\\$&');
  const href = url.href.replace(/[<>\\]/g, c => encodeURIComponent(c));
  return `[${label}](<${href}>)`;
}
/** One atomic editor transaction: reference at the drop, unique definition at EOF. */
export function footnoteInsertion(original: string, offset: number, content: string): { changes: Array<{ offset: number; text: string }>; value: string } {
  if (offset < 0 || offset > original.length) throw Error('각주 삽입 위치가 변경되었습니다.');
  const used = new Set([...original.matchAll(/\[\^([^\]\r\n]+)\]/g)].map(m => m[1]));
  let n = 1; while (used.has(`mdp-${n}`)) n++;
  const id = `mdp-${n}`, marker = `[^${id}]`;
  const body = content.replace(/\r\n?/g, '\n').split('\n').map((line, index) => index ? '    ' + line : line).join('\n');
  const suffix = `\n\n[^${id}]: ${body}\n`;
  const changes = offset === original.length ? [{ offset, text: marker + suffix }] : [{ offset, text: marker }, { offset: original.length, text: suffix }];
  return { changes, value: original.slice(0, offset) + marker + original.slice(offset) + suffix };
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
