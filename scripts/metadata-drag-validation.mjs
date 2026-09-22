import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),js=s=>c.evaluate(s),p="app.plugins.plugins['md-palette']",mode=process.argv[2]??'probe';
const dir='.artifacts/metadata-drag',pause=ms=>new Promise(r=>setTimeout(r,ms));
const sources=[['context','.mdp-footnote-context strong'],['footnote','.mdp-meta-footnotes .mdp-metadata-markdown:not(.mdp-footnote-context) strong'],['highlight','.mdp-meta-highlights p'],['block','.mdp-meta-blocks strong'],['url','.mdp-meta-links strong']];
async function origin(selector){
 return js(`(()=>{window.getSelection().removeAllRanges();const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing source');e.scrollIntoView({block:'center'});const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);const t=w.nextNode();const r=document.createRange();r.setStart(t,0);r.setEnd(t,Math.min(2,t.length));const b=r.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()`);
}
async function start(selector){
 const pt=await origin(selector);await c.send('Input.setInterceptDrags',{enabled:mode!=='native'});c.dragEvents.length=0;
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...pt});
 for(let i=1;i<=12;i++){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:pt.x-5*i,y:pt.y+2*i});if(mode==='native')await pause(20)}
 await pause(150);
 const state=await js(`({kind:${p}.reuseDrag.source?.kind,selection:window.getSelection().toString()})`);
 return {pt,state,data:c.dragEvents.at(-1)?.data};
}
async function cancel(d){
 if(d.data)await c.send('Input.dispatchDragEvent',{type:'dragCancel',...d.pt,data:d.data});
 await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...d.pt});await c.send('Input.setInterceptDrags',{enabled:false});await pause(80);
}
try{
 await mkdir(dir,{recursive:true});assert.ok((await js('app.vault.adapter.getBasePath()')).endsWith('MDPalette-Metadata-Sandbox-20260922'));
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 const results=[];
 if(mode==='drop'||mode==='live'||mode==='native'){
  await js(`(async()=>{const path='Metadata Drop Target.md';if(!app.vault.getAbstractFileByPath(path))await app.vault.create(path,${JSON.stringify('앞부분 뒤쪽\n\n끝\n')});await ${p}.openIn('sub',app.vault.getAbstractFileByPath(path));window.dropLeaf=${p}.subGroup.children[${p}.subGroup.currentTab];await dropLeaf.setViewState({...dropLeaf.getViewState(),state:{...dropLeaf.getViewState().state,mode:'source',source:true}});return true})()`);await pause(250);
  if(mode!=='drop')await js(`dropLeaf.setViewState({...dropLeaf.getViewState(),state:{...dropLeaf.getViewState().state,mode:'source',source:false}}).then(()=>true)`);
  await pause(200);const original=await js('dropLeaf.view.editor.getValue()');
  await writeFile(dir+'/target-before.json',JSON.stringify({path:'Metadata Drop Target.md',original}));
  for(const [name,selector]of sources){
   await js(`window.dragLog=[];if(window.dragLogger)for(const t of ['dragstart','dragenter','dragover','drop','dragend'])window.removeEventListener(t,window.dragLogger,true);window.dragLogger=e=>window.dragLog.push({type:e.type,x:e.clientX,y:e.clientY,target:e.target.className,source:${p}.reuseDrag.source?.kind});for(const t of ['dragstart','dragenter','dragover','drop','dragend'])window.addEventListener(t,window.dragLogger,true);true`);
   const to=await js(`(()=>{const e=dropLeaf.view.editor;e.setCursor({line:0,ch:2});e.scrollIntoView({from:{line:0,ch:2},to:{line:0,ch:2}},true);const r=e.cm.coordsAtPos(2);return{x:r.left,y:(r.top+r.bottom)/2}})()`);
   const d=await start(selector);if(mode!=='native')assert.ok(d.data);let result;
   try{
    if(mode==='native'){
     for(let i=1;i<=15;i++){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:d.pt.x+(to.x-d.pt.x)*i/15,y:d.pt.y+(to.y-d.pt.y)*i/15});await pause(20)}
    }else for(const type of ['dragEnter','dragOver'])await c.send('Input.dispatchDragEvent',{type,...to,data:d.data});await pause(100);
    result=await js(`({marked:!!${p}.reuseDrag.markedTarget,offset:${p}.reuseDrag.markedTarget?.offset,caret:!!document.querySelector('.mdp-reuse-caret'),line:!!document.querySelector('.mdp-reuse-line')})`);
    if(mode!=='native')await c.send('Input.dispatchDragEvent',{type:'drop',...to,data:d.data});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...to});await pause(100);
    const menu=await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`);result.menu=menu;
    if(menu.length){const q=await js(`(()=>{const e=document.querySelector('.menu-item-title'),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,button:'left',clickCount:1,...q});await pause(350)}
    result.value=await js('dropLeaf.view.editor.getValue()');result.notices=await js(`[...document.querySelectorAll('.notice')].map(e=>e.textContent)`);
    assert.equal(result.marked,true,name);assert.equal(result.offset,2,name);assert.ok(result.menu.length>=3,name);assert.notEqual(result.value,original,name);assert.deepEqual(result.notices,[],name);
    results.push({name,start:d.state,to,events:await js('window.dragLog'),...result});
   }finally{await cancel(d);await js(`dropLeaf.view.editor.setValue(${JSON.stringify(original)});dropLeaf.view.save().then(()=>true)`);await pause(250)}
  }
 }else{
 for(const [name,selector]of sources){const d=await start(selector);results.push({name,...d.state,types:d.data?.items.map(i=>i.mimeType)??[]});await cancel(d)}
 }
 console.log(results.map(r=>({name:r.name,offset:r.offset,menu:r.menu,types:r.types})));await writeFile(dir+'/'+mode+'.json',JSON.stringify(results,null,2));
 if(mode==='verify')assert.ok(results.every(r=>r.types.includes('application/x-md-palette-reuse')),'each text surface starts the metadata drag');
}finally{await js(`if(window.dragLogger){for(const t of ['dragstart','dragenter','dragover','drop','dragend'])window.removeEventListener(t,window.dragLogger,true);delete window.dragLogger}true`).catch(()=>{});c.close()}
