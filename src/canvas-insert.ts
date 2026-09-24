import { FuzzySuggestModal, Notice, TFile, type WorkspaceLeaf } from 'obsidian';
import type MDPalettePlugin from './main';
import { fileLayout, folderLayout, translate, collides, type CanvasData, type Placement } from './canvas-layout';
const MIME = 'application/x-md-palette-canvas-files';
interface Canvas {
  wrapperEl: HTMLElement; readonly?: boolean;
  canvasRect: {cx:number;cy:number};
  getData(): CanvasData; importData(data: CanvasData, replace: boolean): void;
  requestSave(): void; pushHistory(data: CanvasData): void;
  posFromEvt(event: MouseEvent): {x:number;y:number};
  domFromPos(point:{x:number;y:number}): {x:number;y:number};
}
interface View { file:TFile; canvas:Canvas; save():Promise<void> }
interface Source { main:TFile; signature:string; paths:string[]; folder?:string; layout:Placement }
interface Session { leaf:WorkspaceLeaf; view:View; file:TFile; source:Source; overlay:HTMLElement; panel:HTMLElement; status:HTMLElement; avoidOverlap:boolean; placement?:Placement; frame?:number; clean:()=>void }
class CanvasPicker extends FuzzySuggestModal<WorkspaceLeaf> {
  constructor(private leaves:WorkspaceLeaf[], private choose:(leaf:WorkspaceLeaf)=>void, plugin:MDPalettePlugin) { super(plugin.app); this.setPlaceholder('삽입할 열려 있는 Canvas 선택'); }
  getItems():WorkspaceLeaf[] { return this.leaves; }
  getItemText(leaf:WorkspaceLeaf):string { return (leaf.view as unknown as View).file?.path ?? 'Canvas'; }
  onChooseItem(leaf:WorkspaceLeaf):void { this.choose(leaf); }
}
/** Menu previews are DOM only; a click or direct drop commits one transaction. */
export class CanvasInsert {
  private session?:Session;
  private drag?:{token:string;paths:string[];main:TFile};
  private last?:{leaf:WorkspaceLeaf;view:View;file:TFile;placement:Placement};
  private locked=false;
  private docs=new Set<Document>();
  private cleanup:(()=>void)[]=[];
  constructor(private plugin:MDPalettePlugin) {
    this.bind(document);
    plugin.registerEvent(plugin.app.workspace.on('window-open',(_w,win)=>this.bind(win.document)));
    plugin.registerEvent(plugin.app.workspace.on('file-open',()=>{if(this.session&&!this.valid(this.session))this.cancel();}));
    plugin.addCommand({id:'undo-canvas-insert',name:'마지막 Canvas 삽입 되돌리기',callback:()=>{void this.undo();}});
  }
  destroy():void { this.cancel(); for(const clean of this.cleanup)clean(); this.endDrag(); }
  private endDrag():void {this.drag=undefined;for(const doc of this.docs)doc.documentElement.classList.remove('mdp-canvas-file-drag');}
  startDrag(event:DragEvent,paths:string[]):void {
    if(!event.dataTransfer || !this.plugin.mainFile)return;
    this.drag={token:crypto.randomUUID(),paths:[...paths],main:this.plugin.mainFile};
    for(const doc of this.docs)doc.documentElement.classList.add('mdp-canvas-file-drag');
    event.dataTransfer.setData(MIME,this.drag.token); event.dataTransfer.effectAllowed='copyMove';
  }
  files(paths:string[]):void { this.begin(paths); }
  folder(folder:string):void { this.begin(this.plugin.connectedFiles().map(f=>f.path),folder); }
  private folderSignature():string { return JSON.stringify([this.plugin.folders,this.plugin.explorer.depth,this.plugin.linkRevision]); }
  private source(paths:string[],folder?:string):Source {
    const main=this.plugin.mainFile; if(!main)throw Error('Main을 먼저 지정해주세요.');
    const layout=folder===undefined?fileLayout(paths,()=>crypto.randomUUID()):folderLayout(this.plugin.folders,paths,folder,()=>crypto.randomUUID(),{
      depth:this.plugin.explorer.depth,ancestors:[main.path],
      children:(path,ancestors)=>this.plugin.linkIndex.children(path,ancestors).filter(e=>this.plugin.app.vault.getAbstractFileByPath(e.path) instanceof TFile).map(e=>e.path)
    });
    const included=layout.nodes.flatMap(n=>n.file?[n.file]:[]);
    // Only Obsidian's registered file views can render a file node.
    const registry=(this.plugin.app as unknown as {viewRegistry:{getTypeByExtension(ext:string):string|undefined}}).viewRegistry;
    const invalid=included.filter(path=>{const f=this.plugin.app.vault.getAbstractFileByPath(path);return !(f instanceof TFile)||!registry.getTypeByExtension(f.extension);});
    if(invalid.length)throw Error('삽입할 수 없는 파일: '+invalid.join(', '));
    if(!layout.nodes.length)throw Error('삽입할 파일을 선택해주세요.');
    return {main,signature:folder===undefined?'':this.folderSignature(),paths:included,folder,layout};
  }
  private begin(paths:string[],folder?:string,leaf?:WorkspaceLeaf,event?:MouseEvent):void {
    if(this.locked)return;
    try {
      const source=this.source(paths,folder);
      const leaves=this.plugin.app.workspace.getLeavesOfType('canvas').filter(l=>this.view(l));
      if(leaf){this.preview(leaf,source,event);return;}
      const recent=this.plugin.app.workspace.getMostRecentLeaf();
      if(recent&&leaves.includes(recent)){this.preview(recent,source);return;}
      if(leaves.length===1){this.preview(leaves[0],source);return;}
      if(!leaves.length)throw Error('먼저 삽입할 Canvas를 열어주세요. 새 Canvas는 자동으로 만들지 않습니다.');
      new CanvasPicker(leaves,l=>this.preview(l,source),this.plugin).open();
    }catch(error){new Notice(String(error instanceof Error?error.message:error));}
  }
  private view(leaf:WorkspaceLeaf):View|undefined {
    const v=leaf.view as unknown as View,c=v.canvas;
    return v.file&&c&&typeof c.getData==='function'&&typeof c.importData==='function'&&typeof c.posFromEvt==='function'&&typeof c.domFromPos==='function'&&typeof v.save==='function'&&!c.readonly?v:undefined;
  }
  private valid(s:Session):boolean {
    return this.plugin.mainFile===s.source.main && this.view(s.leaf)===s.view && s.view.file===s.file && this.plugin.app.workspace.getLeavesOfType('canvas').includes(s.leaf)
      && s.source.paths.every(p=>this.plugin.app.vault.getAbstractFileByPath(p) instanceof TFile)
      && (s.source.folder===undefined||this.folderSignature()===s.source.signature);
  }
  private preview(leaf:WorkspaceLeaf,source:Source,event?:MouseEvent):void {
    if(this.locked)return; this.cancel();
    const view=this.view(leaf);if(!view){new Notice('이 Canvas에는 삽입할 수 없습니다.');return;}
    if(source.paths.includes(view.file.path)){new Notice('대상 Canvas 자신을 내부에 삽입할 수 없습니다. 다른 Canvas를 선택해주세요.');return;}
    this.plugin.app.workspace.setActiveLeaf(leaf,{focus:false});
    const host=view.canvas.wrapperEl,doc=host.ownerDocument;
    const overlay=doc.createElement('div');overlay.className='mdp-canvas-preview';
    const panel=doc.createElement('div');panel.className='mdp-canvas-insert-bar';
    const status=panel.createDiv({text:'마우스로 위치 이동 · 클릭하여 삽입 · Esc 취소',attr:{role:'status'}});
    const s:Session={leaf,view,file:view.file,source,overlay,panel,status,avoidOverlap:!event&&source.layout.nodes.length>1,clean:()=>{}};
    this.session=s;
    if(event){
      const point=view.canvas.posFromEvt(event);
      if(!Number.isFinite(point.x)||!Number.isFinite(point.y)){this.cancel();return;}
      s.placement=translate(source.layout,point);void this.commit(s);return;
    }
    host.append(overlay,panel);
    panel.createEl('button',{text:'취소'}).onclick=()=>this.cancel();
    const undo=panel.createEl('button',{text:'마지막 삽입 되돌리기'});undo.disabled=!this.last;undo.onclick=()=>{this.cancel();void this.undo();};
    const move=(e:MouseEvent)=>{if(panel.contains(e.target as Node)||this.locked)return;const point=view.canvas.posFromEvt(e);if(Number.isFinite(point.x)&&Number.isFinite(point.y))s.placement=translate(source.layout,point);};
    const place=(e:MouseEvent)=>{if(panel.contains(e.target as Node)||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();move(e);void this.commit(s);};
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();this.cancel();}};
    host.addEventListener('pointermove',move,true);host.addEventListener('pointerdown',place,true);doc.addEventListener('keydown',key,true);
    s.clean=()=>{host.removeEventListener('pointermove',move,true);host.removeEventListener('pointerdown',place,true);doc.removeEventListener('keydown',key,true);};
    let lastPaint=0;
    const tick=(time=0)=>{if(this.session!==s)return;if(time-lastPaint>=100||!lastPaint){lastPaint=time;if(!this.valid(s)){this.cancel();new Notice('Main·폴더·연결 또는 Canvas가 변경되어 삽입을 취소했습니다.');return;}}this.paint(s);s.frame=doc.defaultView!.requestAnimationFrame(tick);};
    tick();
  }
  private paint(s:Session):void {
    const p=s.placement;if(!p)return;
    const collision=s.avoidOverlap&&collides(p,s.view.canvas.getData());
    const status=collision?'겹침 감지 · 빈 위치로 이동한 뒤 클릭하세요.':`${p.nodes.length}개 노드 · ${p.edges.length}개 연결선 · 클릭하여 삽입 · Esc 취소`;
    if(s.status.textContent!==status)s.status.setText(status);
    const c=s.view.canvas,rect=c.wrapperEl.getBoundingClientRect(),local=s.source.layout;
    let bundle=s.overlay.firstElementChild as HTMLElement|null;
    if(!bundle){
      bundle=s.overlay.createDiv({cls:'mdp-canvas-preview-bundle'});
      Object.assign(bundle.style,{position:'absolute',inset:'0',transformOrigin:'0 0'});
      const svg=s.overlay.ownerDocument.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('mdp-canvas-preview-edges');bundle.append(svg);
      const map=new Map(local.nodes.map(n=>[n.id,n]));
      for(const edge of local.edges){const a=map.get(edge.fromNode)!,b=map.get(edge.toNode)!;const line=svg.ownerDocument.createElementNS(svg.namespaceURI,'path');const x=a.x+a.width,y=a.y+a.height/2,tx=b.x,ty=b.y+b.height/2;line.setAttribute('d',`M${x},${y} C${(x+tx)/2},${y} ${(x+tx)/2},${ty} ${tx},${ty}`);svg.append(line);}
      for(const n of local.nodes){const box=bundle.createDiv({cls:'mdp-canvas-ghost',text:n.file?.split('/').pop()??n.text});Object.assign(box.style,{left:n.x+'px',top:n.y+'px',width:n.width+'px',height:n.height+'px',fontSize:'16px'});}
    }
    // Move/zoom a single prebuilt layer, rather than rebuilding every card per pointer event.
    const first=p.nodes[0],origin=c.domFromPos(first),right=c.domFromPos({x:first.x+first.width,y:first.y});
    const scale=(right.x-origin.x)/first.width,x=origin.x+c.canvasRect.cx-rect.left-local.nodes[0].x*scale,y=origin.y+c.canvasRect.cy-rect.top-local.nodes[0].y*scale;
    const transform=`translate(${x}px,${y}px) scale(${scale})`;
    if(bundle.style.transform!==transform)bundle.style.transform=transform;
    s.overlay.classList.toggle('is-collision',collision);
  }
  private cancel():void { const s=this.session;this.session=undefined;if(!s)return;if(s.frame!==undefined)s.overlay.ownerDocument.defaultView?.cancelAnimationFrame(s.frame);s.clean();s.overlay.remove();s.panel.remove(); }
  private async commit(s:Session):Promise<void> {
    if(this.locked||this.session!==s||!s.placement)return;
    if(!this.valid(s)){this.cancel();return;}
    const before=structuredClone(s.view.canvas.getData()),p=s.placement;
    if(s.avoidOverlap&&collides(p,before)){this.paint(s);return;}
    this.locked=true;
    try {
      // Flush pre-existing native edits before the transaction, then revalidate.
      await s.view.save();
      if(this.session!==s||!this.valid(s)||JSON.stringify(s.view.canvas.getData())!==JSON.stringify(before))throw Error('Canvas 또는 삽입 상태가 변경되었습니다. 다시 삽입해주세요.');
      await this.write(s.view,{...before,nodes:[...before.nodes,...p.nodes],edges:[...before.edges,...p.edges]},before);
      this.last={leaf:s.leaf,view:s.view,file:s.file,placement:structuredClone(p)};this.cancel();
      new Notice('Canvas에 삽입했습니다. 명령 팔레트의 ‘마지막 Canvas 삽입 되돌리기’로 취소할 수 있습니다.');
    }catch(error){if(!s.panel.isConnected)this.cancel();new Notice(String(error instanceof Error?error.message:error));}finally{this.locked=false;}
  }
  private async write(view:View,next:CanvasData,before:CanvasData):Promise<void> {
    try{view.canvas.importData(next,true);view.canvas.requestSave();await view.save();view.canvas.pushHistory(structuredClone(view.canvas.getData()));}
    catch(error){view.canvas.importData(before,true);view.canvas.requestSave();await view.save();throw error;}
  }
  private async undo():Promise<void> {
    const last=this.last;if(!last||this.locked)return;
    if(this.view(last.leaf)!==last.view||last.view.file!==last.file){new Notice('삽입했던 Canvas를 연 상태에서 되돌려주세요.');return;}
    const before=structuredClone(last.view.canvas.getData()),ids=new Set(last.placement.nodes.map(n=>n.id)),edgeIds=new Set(last.placement.edges.map(e=>e.id));
    if(!last.placement.nodes.every(n=>before.nodes.some(current=>current.id===n.id))){new Notice('삽입 결과가 변경되어 되돌리기를 중단했습니다.');return;}
    if(before.edges.some(e=>!edgeIds.has(e.id)&&(ids.has(e.fromNode)||ids.has(e.toNode)))){new Notice('삽입한 카드에 새 연결선이 있어 자동 되돌리기를 중단했습니다.');return;}
    this.locked=true;
    try{await this.write(last.view,{...before,nodes:before.nodes.filter(n=>!ids.has(n.id)),edges:before.edges.filter(e=>!edgeIds.has(e.id))},before);this.last=undefined;new Notice('마지막 삽입을 되돌렸습니다.');}catch(error){new Notice('되돌리기에 실패했습니다: '+String(error));}finally{this.locked=false;}
  }
  private bind(doc:Document):void {
    if(this.docs.has(doc))return;this.docs.add(doc);
    const drag=(event:DragEvent)=>{
      if(!this.drag||!event.dataTransfer?.types.includes(MIME))return;
      const leaf=this.plugin.app.workspace.getLeavesOfType('canvas').find(l=>{const v=this.view(l);return v&&event.composedPath().includes(v.canvas.wrapperEl);});
      if(!leaf)return;event.preventDefault();event.stopImmediatePropagation();event.dataTransfer.dropEffect='copy';
      if(event.type==='drop'){const d=this.drag;this.endDrag();if(event.dataTransfer.getData(MIME)===d.token&&this.plugin.mainFile===d.main)this.begin(d.paths,undefined,leaf,event);}
    };
    const end=()=>{this.endDrag();};
    for(const type of ['dragenter','dragover','drop'])doc.addEventListener(type,drag as EventListener,true);
    doc.addEventListener('dragend',end,true);
    this.cleanup.push(()=>{for(const type of ['dragenter','dragover','drop'])doc.removeEventListener(type,drag as EventListener,true);doc.removeEventListener('dragend',end,true);});
  }
}
