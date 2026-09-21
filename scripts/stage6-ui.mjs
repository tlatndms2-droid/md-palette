import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,point,tap,click,key} from './stage4-helpers.mjs';
const dir='.artifacts/stage6',base='Stage6-Review/',fixtures=JSON.parse(await readFile(dir+'/fixtures.json','utf8'));
const card=n=>`.mdp-card[data-path="${base+n}"] .mdp-card-name`;
const value=leaf=>js(`${leaf}.view.editor.getValue()`);
async function textClick(text){await tap(await js(`(()=>{const e=[...document.querySelectorAll('.menu-item-title')].find(e=>e.textContent===${JSON.stringify(text)});if(!e)throw Error('Missing menu '+${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));await pause(180)}
async function markdownPoint(leaf){return js(`(()=>{const e=${leaf}.view.editor,pos=e.getValue().indexOf('여기에 추가: ')+8;e.scrollIntoView({from:e.offsetToPos(pos),to:e.offsetToPos(pos)},true);const r=e.cm.coordsAtPos(pos);return{x:r.left+1,y:(r.top+r.bottom)/2,offset:e.posToOffset(e.posAtCoords(r.left+1,(r.top+r.bottom)/2))}})()`)}
async function drag(selector,pt){
 await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;
 const a=await point(selector);await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...a});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...a});
 for(let i=1;i<=8;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:a.x+i*3,y:a.y+i*2});
 for(let i=0;i<30&&!c.dragEvents.length;i++)await pause(50);assert.ok(c.dragEvents.length,'native source drag');
 const data=c.dragEvents.at(-1).data;assert.ok(data.items.some(i=>i.mimeType==='application/x-md-palette-reuse'));
 for(const type of ['dragEnter','dragOver','drop'])await c.send('Input.dispatchDragEvent',{type,x:pt.x,y:pt.y,data});
 await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:pt.x,y:pt.y});await c.send('Input.setInterceptDrags',{enabled:false});await pause(300);
}
async function resetMain(){await key('Escape','Escape',27);await js(`(async()=>{const l=${p}.mainLeaf;await app.workspace.revealLeaf(l);await l.setViewState({...l.getViewState(),state:{...l.getViewState().state,mode:'source',source:true}});l.view.editor.setValue(${JSON.stringify(fixtures['Main.md'])});await l.view.save();${p}.selectView('link','card');return true})()`);await wait(`document.querySelector('.mdp-card-name')`);await pause(250)}
async function metadata(){await js(`${p}.metadataCollapsed=[];${p}.selectView('metadata');true`);await wait(`document.querySelector('.mdp-meta-highlights')`)}
const report={version:'0.0.12',checks:[]};
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 assert.equal(await js(`${p}.manifest.version`),report.version);
 for(const [mode,expected]of [['링크 삽입','[[Stage6-Review/자료]]'],['임베드 삽입','![[Stage6-Review/자료]]'],['본문 Markdown 삽입','# 자료 제목\n\n재사용할 **본문**입니다.\n']]){
  await resetMain();const before=await value(`${p}.mainLeaf`),pt=await markdownPoint(`${p}.mainLeaf`);await drag(card('자료.md'),pt);
  assert.deepEqual(await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`),['링크 삽입','임베드 삽입','본문 Markdown 삽입','취소']);
  if(mode==='링크 삽입')await c.screenshot(dir+'/file-drop-menu.png');
  await textClick(mode);await wait(`!${p}.reuseDrag.pending`);assert.equal(await value(`${p}.mainLeaf`),before.slice(0,pt.offset)+expected+before.slice(pt.offset));report.checks.push(mode+' exact position');
 }
 await resetMain();let before=await value(`${p}.mainLeaf`),pt=await markdownPoint(`${p}.mainLeaf`);
 await drag(card('그림.svg'),pt);assert.deepEqual(await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`),['링크 삽입','임베드 삽입','취소']);await textClick('임베드 삽입');await wait(`!${p}.reuseDrag.pending`);assert.equal(await value(`${p}.mainLeaf`),before.slice(0,pt.offset)+'![[Stage6-Review/그림.svg]]'+before.slice(pt.offset));report.checks.push('image embed / no body option');
 for(const cancel of ['escape','outside','cancel']){
  await resetMain();before=await value(`${p}.mainLeaf`);await drag(card('자료.md'),await markdownPoint(`${p}.mainLeaf`));
  if(cancel==='escape')await key('Escape','Escape',27);else if(cancel==='cancel')await textClick('취소');else await tap({x:1780,y:980});
  assert.equal(await value(`${p}.mainLeaf`),before);assert.equal(await js(`!!document.querySelector('.menu')`),false);report.checks.push('cancel '+cancel);
 }
 await resetMain();await js(`(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath('${base}Sub.md'));window.s6Sub=app.workspace.getMostRecentLeaf();await s6Sub.setViewState({...s6Sub.getViewState(),state:{...s6Sub.getViewState().state,mode:'source',source:true}});s6Sub.view.editor.setValue(${JSON.stringify(fixtures['Sub.md'])});await s6Sub.view.save();return true})()`);await pause(250);
 before=await value('s6Sub');await drag(card('자료.md'),await markdownPoint('s6Sub'));assert.equal(await value('s6Sub'),before);assert.equal(await js(`!!document.querySelector('.menu')`),false);report.checks.push('file card rejected in Sub');
 for(const [selector,mode,expected]of [['.mdp-meta-highlights','텍스트 삽입','첫 강조 문장\n두 번째 줄'],['.mdp-meta-highlights','출처 링크 포함 삽입','첫 강조 문장\n두 번째 줄\n\n출처: [[Stage6-Review/Main]]'],['.mdp-meta-blocks','블록 링크 삽입','[[Stage6-Review/Main#^study]]'],['.mdp-meta-blocks','블록 임베드 삽입','![[Stage6-Review/Main#^study]]']]){
  await metadata();before=await value('s6Sub');pt=await markdownPoint('s6Sub');await drag(selector,pt);await textClick(mode);await wait(`!${p}.reuseDrag.pending`);assert.equal(await value('s6Sub'),before.slice(0,pt.offset)+expected+before.slice(pt.offset));report.checks.push(mode+' into Sub exact position');
 }
 await metadata();before=await value(`${p}.mainLeaf`);pt=await markdownPoint(`${p}.mainLeaf`);await drag('.mdp-meta-highlights',pt);await textClick('텍스트 삽입');await wait(`!${p}.reuseDrag.pending`);assert.equal(await value(`${p}.mainLeaf`),before.slice(0,pt.offset)+'첫 강조 문장\n두 번째 줄'+before.slice(pt.offset));report.checks.push('highlight into Main exact position');
 await c.screenshot(dir+'/markdown-result.png');
 await resetMain();await metadata();await js(`(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath('${base}Board.canvas'));window.s6Canvas=app.workspace.getMostRecentLeaf();return true})()`);await pause(400);
 for(const [selector,mode,expected,viewport]of [['.mdp-meta-highlights','텍스트 카드 만들기','첫 강조 문장\n두 번째 줄',[0,0,0]],['.mdp-meta-highlights','출처 링크 포함 카드 만들기','첫 강조 문장\n두 번째 줄\n\n출처: [[Stage6-Review/Main]]',[430,-270,-1]],['.mdp-meta-blocks','블록 내용 카드 만들기','블록의 첫 줄\n블록의 두 번째 줄',[-120,300,.5]],['.mdp-meta-blocks','블록 링크 카드 만들기','[[Stage6-Review/Main#^study]]',[700,500,0]]]){
  await js(`s6Canvas.view.canvas.setViewport(${viewport.join(',')});true`);await pause(180);
  const ids=await js(`[...s6Canvas.view.canvas.nodes.keys()]`);
  pt=await js(`(()=>{const c=s6Canvas.view.canvas,r=c.wrapperEl.getBoundingClientRect(),e={clientX:r.x+r.width*.3,clientY:r.y+r.height*.4};return{x:e.clientX,y:e.clientY,pos:c.posFromEvt(e)}})()`);
  await drag(selector,pt);if(mode==='출처 링크 포함 카드 만들기')await c.screenshot(dir+'/canvas-drop-menu.png');await textClick(mode);await wait(`!${p}.reuseDrag.pending`);
  const node=await js(`s6Canvas.view.canvas.getData().nodes.find(n=>!${JSON.stringify(ids)}.includes(n.id))`);assert.ok(node);assert.equal(node.text,expected);const bounds=await js(`s6Canvas.view.canvas.nodes.get('${node.id}').nodeEl.getBoundingClientRect().toJSON()`);assert.ok(Math.abs(bounds.x-pt.x)<2&&Math.abs(bounds.y-pt.y)<2,JSON.stringify({node,pt,bounds}));report.checks.push(mode+' at transformed Canvas coordinate (<2 screen px)');
 }
 await c.screenshot(dir+'/canvas-result.png');
 assert.equal(await js(`document.querySelector('.mdp-meta-tasks').draggable`),false);
 assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');
 assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('${base}자료.md'))`),fixtures['자료.md']);
 report.passed=true;report.errors=c.errors;assert.equal(c.errors.length,0);await writeFile(dir+'/ui-result.json',JSON.stringify(report,null,2));console.log(report);
}finally{c.close()}
