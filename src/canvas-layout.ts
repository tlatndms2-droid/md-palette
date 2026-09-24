import type { FolderState } from './folders-state';
export interface CanvasNode { id: string; type: string; x: number; y: number; width: number; height: number; file?: string; text?: string; [key: string]: unknown }
export interface CanvasEdge { id: string; fromNode: string; toNode: string; fromSide?: string; toSide?: string; [key: string]: unknown }
export interface CanvasData { nodes: CanvasNode[]; edges: CanvasEdge[]; [key: string]: unknown }
export interface Placement { nodes: CanvasNode[]; edges: CanvasEdge[] }
const width = 300, height = 180, gap = 50;
export function fileLayout(paths: string[], id: () => string): Placement {
  return { nodes: [...new Set(paths)].map((file, index) => ({ id: id(), type: 'file', file, x: (index % 3) * (width + gap), y: Math.floor(index / 3) * (height + gap), width, height })), edges: [] };
}
export function folderLayout(state: FolderState, paths: string[], root: string, id: () => string): Placement {
  const chosen = state.folders.find(f => f.id === root);
  if (root && !chosen) throw Error('선택한 가상 폴더가 없습니다.');
  const nodes: CanvasNode[] = [], edges: CanvasEdge[] = [], visiting = new Set<string>();
  const ranks = new Map(state.order.map((key,index) => [key,index]));
  let row = 0;
  const visit = (folder: string, depth: number, name: string): CanvasNode => {
    if (visiting.has(folder)) throw Error('가상 폴더 연결이 올바르지 않습니다.');
    visiting.add(folder);
    const node: CanvasNode = { id:id(), type:'text', text:name, x:depth*(width+120), y:0, width, height };
    nodes.push(node);
    const items = [
      ...state.folders.filter(f => f.parent === folder).map(f => ({ key:'d:'+f.id, folder:f.id, name:f.name, file:'' })),
      ...[...new Set(paths)].filter(path => (state.positions[path] ?? '') === folder).map(file => ({ key:'f:'+file, file, folder:'', name:'' }))
    ].sort((a,b) => (ranks.get(a.key) ?? Infinity) - (ranks.get(b.key) ?? Infinity));
    const children: CanvasNode[] = [];
    for (const item of items) {
      let child: CanvasNode;
      if (item.file) { child = { id:id(), type:'file', file:item.file, x:(depth+1)*(width+120), y:row++*(height+gap), width,height }; nodes.push(child); }
      else child = visit(item.folder, depth+1, item.name);
      children.push(child); edges.push({id:id(),fromNode:node.id,fromSide:'right',toNode:child.id,toSide:'left'});
    }
    node.y = children.length ? (children[0].y + children[children.length-1].y)/2 : row++*(height+gap);
    visiting.delete(folder); return node;
  };
  visit(root, 0, chosen?.name ?? '전체 가상 폴더');
  return { nodes,edges };
}
export function translate(layout: Placement, point: {x:number;y:number}): Placement {
  return {nodes:layout.nodes.map(n=>({...n,x:n.x+point.x,y:n.y+point.y})),edges:layout.edges.map(e=>({...e}))};
}
function overlaps(a: CanvasNode,b: CanvasNode): boolean { return a.x < b.x+b.width+16 && a.x+a.width+16 > b.x && a.y < b.y+b.height+16 && a.y+a.height+16 > b.y; }
export function collides(placement: Placement, existing: CanvasData): boolean {
  return placement.nodes.some((node,i) => existing.nodes.some(other=>overlaps(node,other)) || placement.nodes.slice(0,i).some(other=>overlaps(node,other)));
}
