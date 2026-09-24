import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,click,textClick,tap as rawTap,key,point} from './stage4-helpers.mjs';
const dir='.artifacts/canvas-placement',j=JSON.stringify,checks=[];
c.screenshot=async path=>{const {data}=await c.send('Page.captureScreenshot',{format:'png',fromSurface:true});await writeFile(path,Buffer.from(data,'base64'))};
const check=s=>{checks.push(s);console.log('PASS',s);};
const data=()=>js('targetLeaf.view.canvas.getData()');
const at=(x,y)=>js(`(()=>{const c=targetLeaf.view.canvas,p=c.domFromPos({x:${x},y:${y}});return{x:p.x+c.canvasRect.cx,y:p.y+c.canvasRect.cy}})()`);
const move=async(x,y)=>{await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...await at(x,y)});await pause(100);};
const settle=async()=>{for(let i=0;i<100;i++){if(!await js(`${p}.canvasInsert.locked`))return;await pause(50)}throw Error('Save did not settle')};
const tap=async(...args)=>{await rawTap(...args);await settle()};
const undo=async()=>{await js(`app.commands.executeCommandById('md-palette:undo-canvas-insert');true`);await pause(250);await settle();};
try{
 await mkdir(dir,{recursive:true});
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Canvas-Sandbox-20260924'));
 assert.equal(await js(`${p}.manifest.version`),'0.1.9');
 await js(`(()=>{const w=require('@electron/remote').getCurrentWindow();w.webContents.setBackgroundThrottling(false);w.restore();w.showInactive();return true})()`);
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1600,height:1100,deviceScaleFactor:1,mobile:false});
 await js(`window.targetLeaf=app.workspace.getLeavesOfType('canvas').find(l=>l.view.file?.path==='Review-Target.canvas');app.workspace.setActiveLeaf(targetLeaf,{focus:false});true`);
 if(process.argv[2]==='restart'){
  const expected=JSON.parse(await readFile(dir+'/expected.json','utf8'));
  assert.deepEqual(await data(),expected.canvas);assert.deepEqual(await js(`JSON.parse(JSON.stringify(${p}.folders))`),expected.folders);
  check('full process restart preserves inserted folder nodes, edges and plugin state at 0.1.9');
  await c.screenshot(dir+'/restart.png');
  // Restore the affected Canvas exactly after persistence verification.
  const original=await readFile(dir+'/backup/Review-Target.canvas','utf8');
  await js(`(async()=>{targetLeaf.view.canvas.importData(${original},true);await targetLeaf.view.save();await app.vault.modify(targetLeaf.view.file,${j(original)});return true})()`);
  assert.equal(await readFile(vault+'/Review-Target.canvas','utf8'),original);
  check('affected Sandbox Canvas restored byte-for-byte to pretest backup');
 }else{
  const sources=await js(`(async()=>Object.fromEntries(await Promise.all(app.vault.getFiles().filter(f=>f.extension!=='canvas').map(async f=>[f.path,await app.vault.read(f)]))))()`);
  const original=await data();await writeFile(dir+'/original.json',j(original));
  const base={nodes:[{id:'placement-existing',type:'text',text:'기존 카드 · 겹침 확인',x:0,y:0,width:300,height:180}],edges:[]};
  await js(`(async()=>{targetLeaf.view.canvas.importData(${j(base)},true);await targetLeaf.view.save();targetLeaf.view.canvas.setViewport(300,300,-1.5);${p}.selectView('link','card');return true})()`);await pause(250);
  const current=await data();
  await click('.mdp-card[data-path="Review-A.md"]');await click('.mdp-card[data-path="Review-B.md"]','left',1,2);
  await click('.mdp-card[data-path="Review-A.md"]','right');await textClick('.menu-item-title','현재 Canvas에 삽입…');
  assert.equal(await js(`document.querySelectorAll('.mdp-canvas-insert-bar .mod-cta').length`),0);
  await move(10,10);const first=await js(`${p}.canvasInsert.session.placement.nodes[0].x`);
  await move(80,60);assert.notEqual(await js(`${p}.canvasInsert.session.placement.nodes[0].x`),first);assert.deepEqual(await data(),current);
  await tap(await at(20,20));assert.deepEqual(await data(),current);assert.ok(await js(`!!document.querySelector('.mdp-canvas-preview.is-collision')`));
  await c.screenshot(dir+'/collision.png');await key('Escape','Escape',27);assert.equal(await js(`!!${p}.canvasInsert.session`),false);assert.deepEqual(await data(),current);
  check('actual file menu: preview follows pointer without edits; bundle overlap blocked; Escape removes preview');
  await settle();await js(`${p}.canvasInsert.files(['Review-A.md']);true`);await move(20,20);await tap(await at(20,20));
  assert.equal((await data()).nodes.length,2);assert.equal(await js(`!!${p}.canvasInsert.session`),false);await undo();assert.deepEqual(await data(),current);
  check('single-file menu click permits existing overlap and commits once without a confirmation button');
  await js(`${p}.canvasInsert.files(['Review-A.md','Review-B.md']);true`);await move(0,650);
  await c.screenshot(dir+'/menu-preview.png');await tap(await at(0,650));assert.equal((await data()).nodes.length,3);await undo();assert.deepEqual(await data(),current);
  check('multi-file menu click inserts at a clear position and undo restores existing content');
  // Real native multi-selection drag, including an overlapping drop location.
  await click('.mdp-card[data-path="Review-A.md"]');await click('.mdp-card[data-path="Review-B.md"]','left',1,2);
  const start=await point('.mdp-card[data-path="Review-A.md"]');await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...start});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...start});
  for(let i=1;i<=8;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:start.x-i*4,y:start.y+i*3});
  for(let i=0;i<30&&!c.dragEvents.length;i++)await pause(50);assert.ok(c.dragEvents.length);
  const payload=c.dragEvents.at(-1).data,where=await at(20,20);
  for(const type of ['dragEnter','dragOver','drop'])await c.send('Input.dispatchDragEvent',{type,...where,data:payload});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...where});await c.send('Input.setInterceptDrags',{enabled:false});await pause(300);
  assert.equal((await data()).nodes.length,3);assert.equal(await js(`!!${p}.canvasInsert.session`),false);assert.equal(await js(`!!document.querySelector('.mdp-canvas-insert-bar')`),false);
  await c.screenshot(dir+'/direct-drop.png');await undo();assert.deepEqual(await data(),current);
  check('native multi-file drag drops immediately at overlap, without preview/extra click, then undoes');
  // Save failure remains an atomic rollback under click-to-commit.
  await js(`${p}.canvasInsert.files(['Review-A.md']);window.originalSave=targetLeaf.view.save;window.saveCount=0;targetLeaf.view.save=async function(...args){if(++saveCount===2)throw Error('injected save failure');return originalSave.apply(this,args)};true`);
  await tap(await at(20,20));await js('targetLeaf.view.save=originalSave;true');assert.deepEqual(await data(),current);await key('Escape','Escape',27);
  check('injected save failure rolls back all new nodes');
  await js(`${p}.canvasInsert.files(['Review-A.md']);true`);await move(0,650);
  await js(`targetLeaf.openFile(app.vault.getAbstractFileByPath('Review-Map.canvas')).then(()=>true)`);await pause(250);assert.equal(await js(`!!${p}.canvasInsert.session`),false);
  await js(`targetLeaf.openFile(app.vault.getAbstractFileByPath('Review-Target.canvas')).then(()=>true)`);await pause(200);
  check('changing target Canvas cancels moving preview');
  await js(`targetLeaf.view.canvas.setViewport(300,300,-1.5);${p}.selectView('link','folder');true`);await pause(180);
  await pause(5500);await click('[data-key="d:root-a"]','right');await textClick('.menu-item-title','폴더를 현재 Canvas에 삽입…');await move(0,650);
  assert.equal(await js(`${p}.canvasInsert.session.placement.nodes.length`),4);assert.equal(await js(`${p}.canvasInsert.session.placement.edges.length`),3);
  await c.screenshot(dir+'/folder-preview.png');await tap(await at(0,650));assert.equal((await data()).nodes.length,5);assert.equal((await data()).edges.length,3);
  check('actual folder menu previews hierarchy and inserts four nodes/three edges on first click');
  for(const [path,text]of Object.entries(sources))assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath(${j(path)}))`),text);
  check('source Markdown, images and Main links preserved');
  await writeFile(dir+'/expected.json',j({canvas:await data(),folders:await js(`JSON.parse(JSON.stringify(${p}.folders))`)}));
  await js(`${p}.flushState();true`);await pause(500);
 }
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const local=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),local);assets.push({name,sha256:createHash('sha256').update(local).digest('hex')});}
 assert.equal(c.errors.length,0,j(c.errors));await writeFile(dir+'/'+(process.argv[2]||'ui')+'-result.json',JSON.stringify({version:'0.1.9',passed:true,checks,assets},null,2));
}finally{await c.send('Input.setInterceptDrags',{enabled:false}).catch(()=>{});await js(`if(window.originalSave&&window.targetLeaf)targetLeaf.view.save=originalSave;true`).catch(()=>{});c.close();}

