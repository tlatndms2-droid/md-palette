import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect} from './cdp.mjs';
const c=await connect(),p="app.plugins.plugins['md-palette']",dir='.artifacts/canvas-revision',mode=process.argv[2]??'ui',checks=[];
const js=s=>c.evaluate(s),pause=ms=>new Promise(r=>setTimeout(r,ms)),j=JSON.stringify;
async function click(selector,button='left',count=1,modifiers=0){const q=await js(`(()=>{const e=document.querySelector(${j(selector)});if(!e)throw Error('Missing '+${j(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await tap(q,button,count,modifiers);}
async function tap(pt,button='left',count=1,modifiers=0){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button,clickCount:count,modifiers,...pt});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button,clickCount:count,modifiers,...pt});await pause(160);}
async function textClick(selector,text){const q=await js(`(()=>{const e=[...document.querySelectorAll(${j(selector)})].find(e=>e.textContent.trim()===${j(text)});if(!e)throw Error('Missing '+${j(text)});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await tap(q);}
const check=s=>{checks.push(s);console.log('PASS',s);};
const active=()=>js(`${p}.subGroup.children[${p}.subGroup.currentTab].getViewState().state.file`);
const canvas=()=>js(`window.targetLeaf.view.canvas.getData()`);
try{
 await mkdir(dir,{recursive:true});const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Canvas-Sandbox-20260924'));
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1600,height:1100,deviceScaleFactor:1,mobile:false});
 assert.equal(await js(`${p}.manifest.version`),'0.1.8');
 if(mode==='prepare'){
  await js(`(async()=>{
   const files={'Review-Main.md':'---\\nlink note:\\n  - "[[Review-A.md]]"\\n  - "[[Review-B.md]]"\\n  - "[[Review-Map.canvas]]"\\n  - "[[Review-Image.svg]]"\\n---\\n# Main\\n','Review-A.md':'# A\\n원본 보존','Review-B.md':'# B\\n원본 보존','Review-Unlinked.md':'# 미연결','Review-Map.canvas':'{"nodes":[],"edges":[]}','Review-Image.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="purple"/></svg>','Review-Target.canvas':JSON.stringify({nodes:[{id:'existing',type:'text',text:'기존 카드 보존',x:0,y:0,width:300,height:180}],edges:[]})};
   for(const [name,body]of Object.entries(files))if(!app.vault.getAbstractFileByPath(name))await app.vault.create(name,body.replaceAll('\\\\n','\\n'));
   return true;
  })()`);await pause(700);
  await js(`(async()=>{const f=n=>app.vault.getAbstractFileByPath(n);window.mainLeaf=app.workspace.getLeaf(true);await mainLeaf.openFile(f('Review-Main.md'));await ${p}.setMain(mainLeaf);window.subLeaf=app.workspace.createLeafBySplit(mainLeaf,'vertical');await subLeaf.openFile(f('Review-A.md'));window.unlinkedLeaf=app.workspace.createLeafInParent(subLeaf.parent,1);await unlinkedLeaf.openFile(f('Review-Unlinked.md'));app.workspace.setActiveLeaf(subLeaf);await ${p}.toggleSub(subLeaf);window.targetLeaf=app.workspace.createLeafBySplit(subLeaf,'horizontal');await targetLeaf.openFile(f('Review-Target.canvas'));${p}.folders.folders=[{id:'root-a',name:'자료',parent:''},{id:'child-b',name:'하위 폴더',parent:'root-a'}];${p}.folders.positions={'Review-A.md':'root-a','Review-B.md':'child-b'};${p}.folders.order=['d:root-a','f:Review-A.md','d:child-b','f:Review-B.md','f:Review-Map.canvas','f:Review-Image.svg'];${p}.cards.labels=[{id:'keep',name:'보존 라벨',color:'#aa77bb'}];${p}.cards.assignments={'Review-A.md':'keep'};${p}.cardsChanged();app.workspace.rightSplit.setSize(460);${p}.selectView('link','card');return true})()`);await pause(400);
  assert.equal(await active(),'Review-A.md');assert.equal(await js(`${p}.connectedFiles().length`),4);
  await writeFile(dir+'/source-before.json',j(await js(`(async()=>Object.fromEntries(await Promise.all(app.vault.getFiles().filter(f=>f.extension!=='canvas').map(async f=>[f.path,await app.vault.read(f)]))))()`)));
  for(const name of ['.obsidian/plugins/md-palette/data.json','.obsidian/workspace.json']){try{await cp(vault+'/'+name,dir+'/backup/pretest_'+name.replaceAll('/','_'));}catch(e){if(e.code!=='ENOENT')throw e;}}
  check('isolated fixtures ready; linked and unlinked inactive tabs are preserved');
 }else{
  await js(`window.mainLeaf=${p}.mainLeaf;window.subLeaf=${p}.subGroup.children.find(l=>l.getViewState().state.file==='Review-A.md');window.unlinkedLeaf=${p}.subGroup.children.find(l=>l.getViewState().state.file==='Review-Unlinked.md');window.targetLeaf=app.workspace.getLeavesOfType('canvas').find(l=>l.getViewState().state.file==='Review-Target.canvas');true`);
  if(mode==='restart'){
   const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8'));
   assert.deepEqual(await canvas(),expected.canvas);assert.deepEqual(await js(`${p}.cards.selectedTypes`),expected.types);assert.deepEqual(await js(`JSON.parse(JSON.stringify(${p}.folders))`),expected.folders);
   assert.equal(await js(`${p}.cards.display`),'list');assert.equal(await active(),expected.active);check('process restart preserves Canvas nodes and edges, filters, folders, list view and Sub');
  }else{
   const mainBefore=await js(`app.vault.read(${p}.mainFile)`),tabsBefore=await js(`${p}.subGroup.children.map(l=>({id:l.id,state:l.getViewState()}))`);
   await js(`subLeaf.openFile(app.vault.getAbstractFileByPath('Review-Unlinked.md')).then(()=>true)`);assert.equal(await active(),'Review-A.md');
   await js(`subLeaf.setViewState({type:'markdown',state:{file:'Review-Unlinked.md'}}).then(()=>true)`);assert.equal(await active(),'Review-A.md');
   await js(`app.workspace.setActiveLeaf(unlinkedLeaf,{focus:true});true`);assert.equal(await active(),'Review-A.md');
   const header=await js(`(()=>{const r=unlinkedLeaf.tabHeaderEl.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await tap(header);assert.equal(await active(),'Review-A.md');
   await js(`(async()=>{const fresh=app.workspace.createLeafInParent(subLeaf.parent,subLeaf.parent.children.length);await fresh.openFile(app.vault.getAbstractFileByPath('Review-Unlinked.md'));return true})()`);await pause(120);
   assert.deepEqual(await js(`${p}.subGroup.children.map(l=>({id:l.id,state:l.getViewState()}))`),tabsBefore);assert.equal(await js(`app.vault.read(${p}.mainFile)`),mainBefore);check('unlinked file open, state replacement, inactive-tab click and new tab are blocked without changing tabs or links');
   assert.equal(await active(),'Review-A.md');
   await js(`${p}.selectView('link','card');true`);await pause(180);
   assert.equal(await js(`!!document.querySelector('.mdp-card-view [aria-label="보기 형식"]')`),false);assert.ok(await js(`!!document.querySelector('.mdp-card-view .mdp-display-list')`));
   for(const type of ['PDF','이미지','영상','기타'])await textClick('.mdp-card-view .mdp-filter-section button.mdp-chip',type);
   assert.deepEqual((await js(`${p}.cards.selectedTypes`)).sort(),['canvas','md']);assert.equal(await js(`document.querySelectorAll('.mdp-card').length`),3);check('list-only controls and MD + Canvas filter work with existing labels');
   await c.screenshot(dir+'/list.png');
   await textClick('.mdp-card-view .mdp-filter-section button.mdp-chip','전체');assert.equal(await js(`${p}.cards.selectedTypes.length`),6);
   await click('.mdp-card[data-path="Review-A.md"]');await click('.mdp-card[data-path="Review-B.md"]','left',1,2);
   assert.equal(await js(`document.querySelectorAll('.mdp-card.is-selected').length`),2);
   await js(`app.workspace.setActiveLeaf(targetLeaf,{focus:false});true`);
   await click('.mdp-card[data-path="Review-A.md"]','right');await textClick('.menu-item-title','현재 Canvas에 삽입…');
   assert.ok(await js(`!!document.querySelector('.mdp-canvas-insert-bar')`));
   const original=await canvas();
   const at=async(x,y)=>js(`(()=>{const c=targetLeaf.view.canvas,p=c.domFromPos({x:${x},y:${y}}),r=c.canvasRect;return{x:p.x+r.cx,y:p.y+r.cy}})()`);
   await tap(await at(30,30));assert.equal(await js(`document.querySelector('.mdp-canvas-insert-bar .mod-cta').disabled`),true);assert.deepEqual(await canvas(),original);check('collision blocks confirmation and preview leaves Canvas data untouched');
   await textClick('.mdp-canvas-insert-bar button','취소');assert.deepEqual(await canvas(),original);
   await js(`${p}.canvasInsert.files(['Review-A.md','Review-B.md']);true`);await pause(100);
   await js(`targetLeaf.view.canvas.setViewport(400,650,-1.5);true`);await pause(100);await tap(await at(0,600));
   assert.equal(await js(`document.querySelector('.mdp-canvas-insert-bar .mod-cta').disabled`),false);
   await c.screenshot(dir+'/file-preview.png');await textClick('.mdp-canvas-insert-bar button','이 위치에 삽입 확정');await pause(250);
   assert.equal((await canvas()).nodes.length,3);assert.deepEqual((await canvas()).nodes.filter(n=>n.file).map(n=>n.file).sort(),['Review-A.md','Review-B.md']);check('multi-file menu inserts separate original-file nodes at chosen position');
   await js(`app.commands.executeCommandById('md-palette:undo-canvas-insert');true`);await pause(250);assert.deepEqual(await canvas(),original);check('last insertion undo restores existing Canvas without changing sources');
   await js(`${p}.selectView('link','folder');true`);await pause(150);await click('[data-key="d:root-a"]','right');await textClick('.menu-item-title','폴더를 현재 Canvas에 삽입…');await pause(100);await tap(await at(0,600));
   assert.equal(await js(`${p}.canvasInsert.session.placement.nodes.length`),4);assert.equal(await js(`${p}.canvasInsert.session.placement.edges.length`),3);
   await c.screenshot(dir+'/folder-preview.png');await textClick('.mdp-canvas-insert-bar button','이 위치에 삽입 확정');await pause(250);
   assert.equal((await canvas()).nodes.length,5);assert.equal((await canvas()).edges.length,3);check('selected folder exports exact descendant files, title nodes and parent-child edges');
   await js(`${p}.selectView('link','card');${p}.flushState();true`);await pause(400);
   await writeFile(dir+'/restart-expected.json',j({canvas:await canvas(),types:await js(`${p}.cards.selectedTypes`),folders:await js(`JSON.parse(JSON.stringify(${p}.folders))`),active:await active()}));
  }
  const before=JSON.parse(await readFile(dir+'/source-before.json','utf8'));
  for(const [path,text]of Object.entries(before))assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath(${j(path)}))`),text,path);
  check('original Markdown/image contents and Main links are unchanged');
  await c.screenshot(dir+'/'+mode+'.png');
 }
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const local=await readFile(name),installed=await readFile(vault+'/.obsidian/plugins/md-palette/'+name);assert.deepEqual(installed,local,name);assets.push({name,sha256:createHash('sha256').update(local).digest('hex')});}
 assert.equal(c.errors.length,0,j(c.errors));await writeFile(dir+'/'+mode+'-result.json',JSON.stringify({version:'0.1.8',checks,assets,passed:true},null,2));
}finally{c.close();}
