export type LinkMap = Record<string, Record<string, number>>;
export interface LinkEdge { path: string; outgoing: boolean; incoming: boolean }
/** One reverse index per metadata revision; no per-row full-vault scans. */
export class LinkIndex {
  private edges = new Map<string, Map<string, LinkEdge>>();
  constructor(links: LinkMap) {
    const add = (a: string, b: string, outgoing: boolean) => {
      let neighbors = this.edges.get(a); if (!neighbors) this.edges.set(a, neighbors = new Map());
      const edge = neighbors.get(b) ?? { path: b, outgoing: false, incoming: false };
      if (outgoing) edge.outgoing = true; else edge.incoming = true;
      neighbors.set(b, edge);
    };
    for (const [a, targets] of Object.entries(links)) for (const [b, count] of Object.entries(targets)) {
      if (!count || a === b) continue;
      add(a, b, true); add(b, a, false);
    }
  }
  children(path: string, ancestors: readonly string[]): LinkEdge[] {
    const seen = new Set(ancestors);
    return [...(this.edges.get(path)?.values() ?? [])].filter(e => e.outgoing && !seen.has(e.path));
  }
  reachable(root: string, depth: number): Set<string> {
    const seen = new Set([root]); let frontier = [root];
    for (let i = 0; i < depth && frontier.length; i++) {
      const next: string[] = [];
      for (const path of frontier) for (const edge of this.edges.get(path)?.values() ?? []) {
        // Direct Main connections retain backlinks; nested children follow outgoing links only.
        if (i > 0 && !edge.outgoing) continue;
        if (!seen.has(edge.path)) { seen.add(edge.path); next.push(edge.path); }
      }
      frontier = next;
    }
    return seen;
  }
}
export interface ExplorerState { depth: number; expanded: string[]; sources: Record<string, string> }
export function readExplorer(value: unknown): ExplorerState {
  const raw = value && typeof value === 'object' ? value as Partial<ExplorerState> : {};
  return { depth: Number.isInteger(raw.depth) ? Math.max(1, Math.min(5, raw.depth!)) : 2,
    expanded: Array.isArray(raw.expanded) ? raw.expanded.filter((p): p is string => typeof p === 'string').slice(-2000) : [],
    sources: Object.fromEntries(Object.entries(raw.sources && typeof raw.sources === 'object' ? raw.sources : {}).filter(([,v]) => typeof v === 'string')) };
}
