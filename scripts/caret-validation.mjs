import assert from 'node:assert/strict';
import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,wait,point,tap,key} from './stage4-helpers.mjs';
const dir='.artifacts/caret', checks=[], hash=b=>createHash('sha256').update(b).digest('hex');
const fixture='앞부분 원하는 위치 뒷부분\n\n빈 줄 다음\n'+('긴 문장 가운데 정확한 위치 확인 '.repeat(18))+'\n\n끝';
const check=s=>{checks.push(s);console.log('PASS',s)};
async function menu(name){await tap(await js(`(()=>{const e=[...document.querySelectorAll('.menu-item-title')].find(e=>e.textContent===${JSON.stringify(name)});if(!e)throw Error('Missing menu');const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));await wait(`!${p}.reuseDrag.pending`)}
async function reset(){await js(`(async()=>{caretLeaf.view.editor.setValue(${JSON.stringify(fixture)});await caretLeaf.view.save();caretLeaf.view.editor.setCursor({line:0,ch:0});return true})()`);await pause(180)}
async function location(offset){return js(`(()=>{const e=caretLeaf.view.editor,o=${offset};e.scrollIntoView({from:e.offsetToPos(o),to:e.offsetToPos(o)},true);const r=e.cm.coordsAtPos(o);return{x:r.left,y:(r.top+r.bottom)/2,offset:o}})()`)}
async function drag(pt,finish=true){
 await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;const a=await point('.mdp-meta-links:last-child');
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...a});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...a});
 for(let i=1;i<=9;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:a.x+i*4,y:a.y+i*2});
 for(let i=0;i<30&&!c.dragEvents.length;i++)await pause(50);assert.ok(c.dragEvents.length,'native drag started');const data=c.dragEvents.at(-1).data;
 for(const type of ['dragEnter','dragOver'])await c.send('Input.dispatchDragEvent',{type,x:pt.x,y:pt.y,data});await pause(80);
 const state=await js(`(()=>{const d=${p}.reuseDrag,t=d.markedTarget,r=t.editor.cm.coordsAtPos(t.offset),e=document.querySelector('.mdp-reuse-caret'),b=e?.getBoundingClientRect();return{url:d.source.item.target,offset:t.offset,shown:!!e,left:b?.left,top:b?.top,expectedLeft:r.left,expectedTop:r.top}})()`);
 assert.equal(state.shown,true);assert.ok(Math.abs(state.left-state.expectedLeft)<1);assert.ok(Math.abs(state.top-state.expectedTop)<1);assert.equal(state.offset,pt.offset);
 if(finish){await c.send('Input.dispatchDragEvent',{type:'drop',x:pt.x,y:pt.y,data});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:pt.x,y:pt.y});await pause(80);assert.equal(await js(`!!document.querySelector('.mdp-reuse-caret')`),true)}
 else {await c.screenshot(dir+'/caret.png');await key('Escape','Escape',27);await c.send('Input.dispatchDragEvent',{type:'dragCancel',x:pt.x,y:pt.y,data});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:pt.x,y:pt.y})}
 await c.send('Input.setInterceptDrags',{enabled:false});
 return state.url;
}
try {
 await mkdir(dir,{recursive:true});
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage7-Sandbox-20260922'));
 if(process.argv[2]==='install'){
  const backup=dir+'/backup-'+Date.now();await cp(vault+'/.obsidian',backup+'/.obsidian',{recursive:true});await cp(vault+'/Review/B.md',backup+'/B.md');
  await writeFile(dir+'/backup.json',JSON.stringify({backup,b:hash(await readFile(vault+'/Review/B.md'))}));
  await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
  for(const name of ['main.js','manifest.json','styles.css']){await cp(name,vault+'/.obsidian/plugins/md-palette/'+name);assert.equal(hash(await readFile(name)),hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)))}
  await js(`app.plugins.loadManifests().then(()=>app.plugins.enablePluginAndSave('md-palette')).then(()=>true)`);await wait(`${p}?.mainFile?.path==='Review/Main.md'`);
 }
 assert.equal(await js(`${p}.manifest.version`),'0.1.1');
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1700,height:1100,deviceScaleFactor:1,mobile:false});
 await js(`(async()=>{window.caretLeaf=${p}.subGroups[0].children.find(l=>l.view.file?.path==='Review/B.md');await app.workspace.revealLeaf(caretLeaf);await caretLeaf.setViewState({...caretLeaf.getViewState(),state:{...caretLeaf.getViewState().state,mode:'source',source:true}});${p}.metadataCollapsed=[];${p}.selectView('metadata');return true})()`);await pause(350);
 const original=await js('caretLeaf.view.editor.getValue()');
 const sourceBefore=await js(`app.vault.read(${p}.mainFile)`);
 try {
  for(const offset of [4,8,fixture.indexOf('\n')+1,fixture.indexOf('긴 문장')+70,fixture.length]){
   await reset();const pt=await location(offset);const url=await drag(pt);
   const target=await js(`${p}.reuseDrag.markedTarget.offset`);assert.equal(target,offset);
   await menu('주소 그대로 삽입');const value=await js('caretLeaf.view.editor.getValue()');
   assert.equal(value,fixture.slice(0,offset)+url+fixture.slice(offset));
   assert.equal(await js(`!!document.querySelector('.mdp-reuse-caret')`),false);check('caret and insertion match character offset '+offset);
  }
  await js(`caretLeaf.setViewState({...caretLeaf.getViewState(),state:{...caretLeaf.getViewState().state,mode:'source',source:false}}).then(()=>true)`);await pause(150);
  await reset();const liveUrl=await drag(await location(8));await menu('주소 그대로 삽입');assert.equal(await js('caretLeaf.view.editor.getValue()'),fixture.slice(0,8)+liveUrl+fixture.slice(8));check('Live Preview exact insertion');
  await reset();await drag(await location(5),false);assert.equal(await js('caretLeaf.view.editor.getValue()'),fixture);assert.equal(await js(`!!document.querySelector('.mdp-reuse-caret')`),false);check('Escape cancels drag and removes caret');
  await drag(await location(5));await menu('취소');assert.equal(await js('caretLeaf.view.editor.getValue()'),fixture);assert.equal(await js(`!!document.querySelector('.mdp-reuse-caret')`),false);check('menu cancel removes caret without inserting');
  await drag(await location(5));await js(`caretLeaf.view.editor.replaceRange('새 편집',{line:0,ch:0});true`);await menu('주소 그대로 삽입');assert.equal(await js('caretLeaf.view.editor.getValue()'),'새 편집'+fixture);check('stale insertion refused after intervening edit');
  assert.equal(await js(`app.vault.read(${p}.mainFile)`),sourceBefore);check('source unchanged');
 } finally {await js(`caretLeaf.view.editor.setValue(${JSON.stringify(original)});caretLeaf.view.save().then(()=>true)`)}
 assert.equal(c.errors.length,0);const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)),sha256);assets.push({name,sha256})}
 await writeFile(dir+'/'+(process.argv[2]==='install'?'ui':'restart')+'-result.json',JSON.stringify({passed:true,checks,assets},null,2));
} catch(e){await c.screenshot(dir+'/failure.png');throw e}finally{c.close()}
