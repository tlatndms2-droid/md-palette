import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { c,p,js,pause,wait,click,textClick,key,type,tap } from './stage4-helpers.mjs';
const dir='.artifacts/canvas-new-placement',root='CanvasPlacement015',main=root+'/A.canvas',j=JSON.stringify;
const hash=v=>createHash('sha256').update(v).digest('hex'),mode=process.argv[2]||'ui',checks=[];
const pass=t=>{checks.push(t);console.log('PASS',t)};
const snapshot=()=>js(`${p}.mainLeaf.view.canvas.getData()`);
async function save(){await js(`(async()=>{await ${p}.mainLeaf.view.save();${p}.flushState();await ${p}.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1600)}
async function create(name,{folder=false,format='canvas'}={}){
 if(folder){await textClick('.mdp-tabs button','Folder');if(!await js(`!!document.querySelector('.mdp-tree-root')`)){await pause(500);await textClick('.mdp-tabs button','Folder');}await wait(`!!document.querySelector('.mdp-tree-root')`);await click('.mdp-tree-root','right');await textClick('.menu-item-title','새 링크 파일 추가');}
 else {await textClick('.mdp-tabs button','Card');await textClick('button','+ 새 링크 파일 추가');}
 await wait(`!!document.querySelector('[aria-label="새 링크 파일 형식"]')`);
 assert.deepEqual(await js(`Array.from(document.querySelector('[aria-label="새 링크 파일 형식"]').options).map(o=>o.value)`),['md','canvas']);
 if(format==='canvas'){await click('[aria-label="새 링크 파일 형식"]');await key('End','End',35);await key('Enter','Enter',13);}
 await click('[aria-label="새 링크 파일 이름"]');await type(root+'-'+(process.env.PLACEMENT_TEST_SUFFIX||'')+name);
 const label=await js(`document.querySelector('.mdp-new-note-path').textContent`),path=label.replace('저장 위치: ','');
 await c.screenshot(`${dir}/dialog.png`);
 await textClick('.modal button',format==='canvas'?'만들고 위치 선택':'만들고 연결');await wait(`!document.querySelector('.modal')`);
 return path;
}
async function move(fx=.58,fy=.6){const pt=await js(`(()=>{const r=${p}.mainLeaf.view.canvas.wrapperEl.getBoundingClientRect();return{x:r.x+r.width*${fx},y:r.y+r.height*${fy}}})()`);await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt});await pause(130);return pt;}
try{
 await mkdir(dir,{recursive:true});const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
 if(mode==='install'){
  await js(`(async()=>{${p}.flushState();await ${p}.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1600);
  await cp(`${vault}/.obsidian`,`${dir}/pretest-obsidian`,{recursive:true,errorOnExist:true,force:false});
  const paths=await js(`app.vault.getFiles().filter(f=>['md','canvas'].includes(f.extension)).map(f=>f.path)`),originals=[];
  for(const path of paths)originals.push({path,sha256:hash(await readFile(`${vault}/${path}`))});
  await writeFile(`${dir}/originals.json`,j(originals));
  await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
  const assets=[];for(const name of ['main.js','manifest.json','styles.css']){await cp(name,`${vault}/.obsidian/plugins/md-palette/${name}`);const sha256=hash(await readFile(name));assert.equal(hash(await readFile(`${vault}/.obsidian/plugins/md-palette/${name}`)),sha256);assets.push({name,sha256})}
  await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return true})()`);await wait(`${p}.ready`);
  await writeFile(`${dir}/install.json`,j({version:'0.1.15',vault,assets}));
  await js(`(async()=>{await app.vault.createFolder(${j(root)});await app.vault.create(${j(main)},JSON.stringify({nodes:[{id:'original',type:'text',text:'기존 A 내용 보존',x:-500,y:-300,width:300,height:160}],edges:[]}));const leaf=app.workspace.createLeafBySplit(${p}.mainLeaf,'horizontal');await leaf.openFile(app.vault.getAbstractFileByPath(${j(main)}));await ${p}.setMain(leaf);return true})()`);
  await save();await cp(`${vault}/${main}`,`${dir}/initial-A.canvas`);pass('isolated final build installed, original files/configuration backed up');
 }else if(mode==='reload'){
  await save();await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
  const assets=[];for(const name of ['main.js','manifest.json','styles.css']){await cp(name,`${vault}/.obsidian/plugins/md-palette/${name}`);const sha256=hash(await readFile(name));assert.equal(hash(await readFile(`${vault}/.obsidian/plugins/md-palette/${name}`)),sha256);assets.push({name,sha256})}
  await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return true})()`);await wait(`${p}.ready`);
  await writeFile(`${dir}/install.json`,j({version:'0.1.15',vault,assets}));
 }else if(mode==='ui'){
  assert.equal(await js(`${p}.manifest.version`),'0.1.15');
  await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1800,height:1050,deviceScaleFactor:1,mobile:false});
  const before=await snapshot(),beforeBytes=await readFile(`${vault}/${main}`),cancel=await create('Cancelled');
  await wait(`!!document.querySelector('.mdp-canvas-ghost')`);await move();await c.screenshot(`${dir}/preview.png`);
  assert.deepEqual(await snapshot(),before);await key('Escape','Escape',27);await wait(`!document.querySelector('.mdp-canvas-preview')`);assert.deepEqual(await snapshot(),before);
  assert.equal(hash(await readFile(`${vault}/${main}`)),hash(beforeBytes));assert.deepEqual(JSON.parse(await readFile(`${vault}/${cancel}`,'utf8')),{nodes:[],edges:[]});
  assert.equal(await js(`${p}.connectedFiles().some(f=>f.path===${j(cancel)})`),false);pass('Canvas option, moving preview, Esc leaves empty B and no Main changes or link');
  const placed=await create('Placed');await wait(`!!document.querySelector('.mdp-canvas-ghost')`);const pt=await move(.52,.52);
  await js(`document.addEventListener('pointerdown',e=>window.placementClick=${p}.mainLeaf.view.canvas.posFromEvt(e),{capture:true,once:true});true`);
  await tap(pt);await wait(`!document.querySelector('.mdp-canvas-preview')`);const intended=await js('window.placementClick');
  await wait(`!!app.metadataCache.resolvedLinks[${j(main)}]?.[${j(placed)}]`);const after=await snapshot(),node=after.nodes.find(n=>n.file===placed);
  assert.ok(node);assert.ok(Math.abs(node.x-intended.x)<2&&Math.abs(node.y-intended.y)<2);assert.deepEqual(after.nodes.find(n=>n.id==='original'),before.nodes[0]);
  assert.deepEqual(JSON.parse(await readFile(`${vault}/${placed}`,'utf8')),{nodes:[],edges:[]});
  assert.ok(await js(`${p}.connectedFiles().some(f=>f.path===${j(placed)})`));await c.screenshot(`${dir}/placed.png`);pass('click places B card at chosen position inside Main A; native link and palette update');
  const folder=await create('FolderPlaced',{folder:true});await wait(`!!document.querySelector('.mdp-canvas-ghost')`);await tap(await move(.7,.65));await wait(`!document.querySelector('.mdp-canvas-preview')`);
  assert.equal(await js(`${p}.folders.positions[${j(folder)}]`),'');pass('Folder creation commits virtual position only after placement');
  const note=await create('Markdown',{format:'md'});await wait(`!!app.metadataCache.resolvedLinks[${j(note)}]?.[${j(main)}]`);assert.match(await readFile(`${vault}/${note}`,'utf8'),/link note/);assert.equal((await snapshot()).nodes.length,before.nodes.length+2);pass('Markdown creation retains reverse link and adds no Canvas card');
  await textClick('.mdp-tabs button','Card');await save();await writeFile(`${dir}/expected.json`,j({main,placed,folder,note,cancel,data:await snapshot(),folders:await js(`${p}.folders`)}));
  assert.deepEqual(c.errors,[]);await writeFile(`${dir}/ui.json`,j({passed:true,version:'0.1.15',checks,errors:c.errors}));
 }else if(mode==='restart'){
  const expected=JSON.parse(await readFile(`${dir}/expected.json`,'utf8'));await wait(`${p}?.ready`);assert.equal(await js(`${p}.manifest.version`),'0.1.15');assert.equal(await js(`${p}.mainFile.path`),main);
  assert.deepEqual(await snapshot(),expected.data);assert.deepEqual(await js(`${p}.folders`),expected.folders);await wait(`${p}.connectedFiles().some(f=>f.path===${j(expected.placed)})`);
  assert.equal(await js(`${p}.connectedFiles().some(f=>f.path===${j(expected.cancel)})`),false);assert.deepEqual(JSON.parse(await readFile(`${vault}/${expected.cancel}`,'utf8')),{nodes:[],edges:[]});
  await c.screenshot(`${dir}/restart.png`);assert.deepEqual(c.errors,[]);await writeFile(`${dir}/restart.json`,j({passed:true,version:'0.1.15',errors:c.errors}));pass('process restart preserves exact placement, native link, folder and cancelled empty file');
 }
}finally{c.close()}
