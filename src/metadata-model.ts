export type MetadataKind = 'footnotes' | 'highlights' | 'tasks' | 'blocks' | 'links';
export const metadataSections: [MetadataKind, string][] = [['footnotes', '각주'], ['highlights', 'Highlights'], ['tasks', 'Tasks'], ['blocks', 'Block Reference'], ['links', 'Links']];
export interface MetadataItem {
  kind: MetadataKind; offset: number; end: number; text: string;
  id?: string; context?: string; from?: number; to?: number; prefix?: string; checked?: boolean; duplicate?: boolean; target?: string;
}
export type MetadataResult = Record<MetadataKind, MetadataItem[]>;
const blank = (value: string) => value.replace(/[^\r\n]/g, ' ');
/** Mask literal regions without changing UTF-16 source positions. */
export function metadataMask(text: string, frontmatter = true): string {
  let result = text;
  if (frontmatter) result = result.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)(?:\r?\n|$)/, blank);
  result = result.replace(/%%[\s\S]*?%%|<!--[\s\S]*?-->/g, blank);
  const lines = result.split('\n'); let fence = '', length = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) { if (m && m[1][0] === fence && m[1].length >= length && lines[i].slice(m[0].length).trim() === '') fence = ''; lines[i] = blank(lines[i]); }
    else if (m) { fence = m[1][0]; length = m[1].length; lines[i] = blank(lines[i]); }
  }
  result = lines.join('\n').replace(/(`+)([^`]|(?!\1)`)*?\1/g, blank);
  return result;
}
const escaped = (text: string, offset: number) => { let n = 0; while (offset > 0 && text[--offset] === '\\') n++; return n % 2 === 1; };
export function parseMetadata(text: string, blockRanges: Array<{ start: number; end: number }> = []): MetadataResult {
  const out: MetadataResult = { footnotes: [], highlights: [], tasks: [], blocks: [], links: [] };
  const masked = metadataMask(text);
  const lines = text.split('\n'); const safeLines = masked.split('\n'); const starts: number[] = []; let cursor = 0;
  for (const line of lines) { starts.push(cursor); cursor += line.length + 1; }
  const definitions = new Map<string, MetadataItem[]>();
  const definitionRanges: Array<[number, number]> = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^ {0,3}\[\^([^\]]+)\]:/.test(safeLines[i])) continue;
    const m = lines[i].match(/^ {0,3}\[\^([^\]]+)\]:[ \t]*/)!;
    let last = i;
    while (last + 1 < lines.length && (/^(?: {4}|\t)\S|^(?: {4}|\t)\s*\S/.test(lines[last + 1]) || (lines[last + 1].trim() === '' && /^(?: {4}|\t)\S/.test(lines[last + 2] ?? '')))) last++;
    const from = starts[i] + m[0].length, to = starts[last] + lines[last].replace(/\r$/, '').length;
    const content = text.slice(from, to).replace(/\r?\n(?: {4}|\t)/g, '\n');
    const item: MetadataItem = { kind: 'footnotes', id: m[1], offset: starts[i], end: to, from, to, prefix: lines.slice(i + 1, last + 1).find(l => /^(?: {4}|\t)/.test(l))?.match(/^( {4}|\t)/)?.[1] ?? '    ', text: content };
    definitions.set(m[1], [...definitions.get(m[1]) ?? [], item]); definitionRanges.push([starts[i], to]); i = last;
  }
  for (const m of masked.matchAll(/\[\^([^\]\n]+)\]/g)) {
    const offset = m.index!;
    if (escaped(text, offset) || definitionRanges.some(([from, to]) => offset >= from && offset < to)) continue;
    const defs = definitions.get(m[1]); if (!defs) continue;
    const start = text.lastIndexOf('\n', offset) + 1; const end = text.indexOf('\n', offset);
    out.footnotes.push({ ...defs[0], offset, context: text.slice(start, end < 0 ? text.length : end).replace(/\[\^[^\]]+\]/g, ''), duplicate: defs.length > 1 });
  }
  for (const m of masked.matchAll(/(?<![=])==(?=\S)([\s\S]*?\S)==(?![=])/g)) {
    if (!escaped(text, m.index!) && !m[1].includes('\n\n')) out.highlights.push({ kind: 'highlights', offset: m.index!, end: m.index! + m[0].length, text: text.slice(m.index! + 2, m.index! + m[0].length - 2) });
  }
  for (let i = 0; i < lines.length; i++) {
    const task = safeLines[i].match(/^\s*(?:>\s*)*(?:[-+*]|\d+[.)])\s+\[([ xX])\]\s+/);
    if (task) {
      const from = starts[i] + task[0].indexOf('[') + 1;
      out.tasks.push({ kind: 'tasks', offset: starts[i], end: starts[i] + lines[i].length, text: lines[i].slice(task[0].length).trimEnd(), checked: task[1] !== ' ', from, to: from + 1 });
    }
    const block = safeLines[i].match(/(?:^|\s)\^([A-Za-z0-9-]+)\s*\r?$/);
    if (block) {
      const offset = starts[i] + block.index! + block[0].indexOf('^');
      const cached = blockRanges.find(r => r.start <= offset && r.end >= offset);
      let first = i;
      if (lines[i].trim() === '^' + block[1]) { first--; while (first >= 0 && !lines[first].trim()) first--; }
      while (first > 0 && safeLines[first - 1].trim() && !/\^[A-Za-z0-9-]+\s*$/.test(safeLines[first - 1])) first--;
      const from = cached?.start ?? starts[Math.max(0, first)];
      out.blocks.push({ kind: 'blocks', id: block[1], offset, end: starts[i] + lines[i].length, text: text.slice(from, offset).trim() });
    }
  }
  const blockCounts = new Map<string, number>();
  for (const item of out.blocks) blockCounts.set(item.id!, (blockCounts.get(item.id!) ?? 0) + 1);
  for (const item of out.blocks) item.duplicate = blockCounts.get(item.id!)! > 1;
  // Properties are included; code and comments remain excluded.
  const linkText = metadataMask(text, false); const occupied: Array<[number, number]> = [];
  const add = (offset: number, length: number, target: string, label: string) => {
    if (escaped(text, offset)) return;
    occupied.push([offset, offset + length]);
    out.links.push({ kind: 'links', offset, end: offset + length, target: target.trim(), text: label.trim() || target.trim() });
  };
  for (const m of linkText.matchAll(/!?\[\[([^\]\n]+)\]\]/g)) {
    const [target, ...label] = m[1].split('|'); add(m.index!, m[0].length, target, label.join('|'));
  }
  // Balanced parentheses in Markdown destinations, with optional angle wrapping/title.
  for (const m of linkText.matchAll(/!?\[([^\]\n]*)\]\(/g)) {
    const start = m.index!; if (occupied.some(([a,b]) => start >= a && start < b)) continue;
    let end = start + m[0].length, depth = 1;
    for (; end < linkText.length && linkText[end] !== '\n'; end++) {
      if (escaped(text, end)) continue;
      if (linkText[end] === '(') depth++;
      if (linkText[end] === ')' && --depth === 0) break;
    }
    if (depth !== 0) continue;
    const raw = text.slice(start + m[0].length, end).trim();
    const target = raw.startsWith('<') ? raw.slice(1, raw.indexOf('>')) : raw.replace(/\s+["'][\s\S]*$/, '');
    if (target) add(start, end + 1 - start, target.replace(/\\([()])/g, '$1'), m[1]);
  }
  const refs = new Map<string, string>();
  for (const m of linkText.matchAll(/^ {0,3}\[([^\]^]+)\]:\s*<?(\S+?)>?(?:\s+["'][^\n]*|\s*)$/gm)) { refs.set(m[1].toLowerCase(), m[2]); occupied.push([m.index!, m.index! + m[0].length]); }
  for (const m of linkText.matchAll(/!?\[([^\]\n^]+)\](?:\[([^\]\n]*)\])?/g)) {
    if (occupied.some(([a,b]) => m.index! >= a && m.index! < b)) continue;
    const target = refs.get((m[2] || m[1]).toLowerCase()); if (target) add(m.index!, m[0].length, target, m[1]);
  }
  for (const m of linkText.matchAll(/https?:\/\/[^\s<>"'\]]+/gi)) {
    if (occupied.some(([a,b]) => m.index! >= a && m.index! < b)) continue;
    const target = m[0].replace(/[.,;!?]+$/, ''); add(m.index!, target.length, target, target);
  }
  out.links.sort((a,b) => a.offset - b.offset);
  return out;
}
export function footnoteReplacement(item: MetadataItem, value: string, source: string): string {
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  return value.replace(/\r\n/g, '\n').split('\n').join(newline + (item.prefix ?? '    '));
}
