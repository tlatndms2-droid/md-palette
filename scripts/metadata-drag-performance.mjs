import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect} from './cdp.mjs';
const c=await connect(),js=s=>c.evaluate(s),p="app.plugins.plugins['md-palette']",dir='.artifacts/metadata-drag';
const pause=ms=>new Promise(r=>setTimeout(r,ms)),hash=b=>createHash('sha256').update(b).digest('hex');
let mainOriginal,targetOriginal,vault;
try{
 await mkdir(dir,{recursive:true});vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Metadata-Sandbox-20260922'));
 assert.equal(await js(`${p}.mainFile.path`),'Metadata Review.md');
 await js(`(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath('Metadata Drop Target.md'));window.perfLeaf=${p}.subGroup.children[${p}.subGroup.currentTab];await perfLeaf.setViewState({...perfLeaf.getViewState(),state:{...perfLeaf.getViewState().state,mode:'source',source:true}});return true})()`);
 mainOriginal=await js(`${p}.mainLeaf.view.editor.getValue()`);targetOriginal=await js('perfLeaf.view.editor.getValue()');
 await writeFile(dir+'/performance-backup.json',JSON.stringify({mainOriginal,targetOriginal},null,2));
 const large=targetOriginal+'긴 문서의 본문을 보존하며 정확한 삽입 위치를 확인합니다. '.repeat(12)+'\n'+('긴 문서 본문 '.repeat(20)+'\n').repeat(5000);
 const main=mainOriginal+'\n'+Array.from({length:1500},(_,i)=>`==강조 ${i} **중요** 내용==`).join('\n');
 await js(`(async()=>{await app.vault.modify(${p}.mainFile,${JSON.stringify(main)});perfLeaf.view.editor.setValue(${JSON.stringify(large)});await perfLeaf.view.save();return true})()`);await pause(1200);
 const counts=await js(`({items:document.querySelectorAll('.mdp-meta-highlights').length,total:document.querySelector('[data-kind="highlights"] .mdp-metadata-count').textContent})`);assert.equal(counts.total,'1503');
 const to=await js(`(()=>{const e=perfLeaf.view.editor;e.setCursor({line:0,ch:2});e.scrollIntoView({from:{line:0,ch:2},to:{line:0,ch:2}},true);const r=e.cm.coordsAtPos(2);return{x:r.left,y:(r.top+r.bottom)/2}})()`);
 const from=await js(`(()=>{window.getSelection().removeAllRanges();const e=document.querySelector('.mdp-meta-highlights p');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.left+10,y:r.top+10}})()`);
 await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...from});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...from});for(let i=1;i<=10;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:from.x-i*5,y:from.y+i*2});await pause(100);assert.ok(c.dragEvents.length);const data=c.dragEvents.at(-1).data;
 await js(`(()=>{const d=${p}.reuseDrag,e=perfLeaf.view.editor;window.dragPerf={d,e,handle:d.handle,getValue:e.getValue,reads:0,times:[],markers:new Set()};e.getValue=function(){dragPerf.reads++;return dragPerf.getValue.call(this)};d.handle=function(event){const t=performance.now();dragPerf.handle.call(this,event);dragPerf.times.push(performance.now()-t);for(const n of document.querySelectorAll('.mdp-reuse-line,.mdp-reuse-caret'))dragPerf.markers.add(n)};return true})()`);
 await c.send('Input.dispatchDragEvent',{type:'dragEnter',...to,data});
 for(let i=0;i<120;i++)await c.send('Input.dispatchDragEvent',{type:'dragOver',x:to.x+(i%3)*7,y:to.y,data});
 const metrics=await js(`({events:dragPerf.times.length,reads:dragPerf.reads,markerObjects:dragPerf.markers.size,meanMs:dragPerf.times.reduce((a,b)=>a+b,0)/dragPerf.times.length,maxMs:Math.max(...dragPerf.times)})`);
 assert.equal(metrics.markerObjects,2);assert.ok(metrics.reads<=2);assert.equal(await js('perfLeaf.view.editor.getValue()'),large);
  await c.screenshot(dir+'/long-document.png');
  await js(`perfLeaf.view.editor.replaceRange('시험 편집 ',{line:0,ch:0});true`);
  await c.send('Input.dispatchDragEvent',{type:'dragOver',...to,data});
  assert.equal(await js(`${p}.reuseDrag.markedTarget.original`),'시험 편집 '+large);
  metrics.documentChangeInvalidatesCache=true;
 await c.send('Input.dispatchDragEvent',{type:'drop',...to,data});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...to});await pause(80);
 const cancel=await js(`(()=>{const e=[...document.querySelectorAll('.menu-item-title')].find(e=>e.textContent==='취소'),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,button:'left',clickCount:1,...cancel});await pause(80);
 assert.equal(await js('perfLeaf.view.editor.getValue()'),'시험 편집 '+large);assert.equal(await js(`!!document.querySelector('.mdp-reuse-caret,.mdp-reuse-line')`),false);
 await c.send('Input.setInterceptDrags',{enabled:false});assert.deepEqual(c.errors,[]);
 await writeFile(dir+'/performance.json',JSON.stringify({passed:true,version:'0.1.4',targetCharacters:large.length,metadata:counts,...metrics,cancelPreservesDocument:true},null,2));console.log(metrics);
}finally{
 await js(`if(window.dragPerf){dragPerf.d.handle=dragPerf.handle;dragPerf.e.getValue=dragPerf.getValue;delete window.dragPerf}true`).catch(()=>{});
 if(mainOriginal!==undefined){await js(`(async()=>{await app.vault.modify(${p}.mainFile,${JSON.stringify(mainOriginal)});perfLeaf.view.editor.setValue(${JSON.stringify(targetOriginal)});await perfLeaf.view.save();return true})()`);assert.equal(hash(await readFile(vault+'/Metadata Review.md')),hash(Buffer.from(mainOriginal)));assert.equal(hash(await readFile(vault+'/Metadata Drop Target.md')),hash(Buffer.from(targetOriginal)))}
 c.close();
}
