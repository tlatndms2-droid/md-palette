import assert from 'node:assert/strict';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,wait,click,textClick,tap,key} from './stage4-helpers.mjs';
const dir='.artifacts/sub-rules',mode=process.argv[2]??'ui',j=JSON.stringify,checks=[];
const {root}=JSON.parse(await readFile(dir+'/fixture.json','utf8'));
const path=name=>root+'/'+name,hash=b=>createHash('sha256').update(b).digest('hex');
const check=s=>{checks.push(s);console.log('PASS',s)};
const card=name=>'.mdp-card[data-path='+j(path(name))+']';
const group=()=>js(`${p}.subGroup?.id`);
const leaves=()=>js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{const file=l.getViewState().state?.file;if(file&&l.getRoot()!==app.workspace.leftSplit&&l.getRoot()!==app.workspace.rightSplit)a.push({id:l.id,file,group:l.parent.id})});return a})()`);
async function setLeaf(expr){await js(`app.workspace.setActiveLeaf(${expr},{focus:true});true`);await pause(100)}
async function tabMenu(expr,title){
 const pt=await js(`(()=>{const e=(${expr}).tabHeaderEl;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await tap(pt,'right');await textClick('.menu-item-title',title);await pause(250);
}
async function gesture(name,mods=0){await click(card(name),'left',2,mods);await pause(250)}
try{
 await mkdir(dir,{recursive:true});const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Metadata-Sandbox-20260922'));
 if(mode==='install'){
  assert.equal(await js(`${p}.manifest.version`),'0.1.6');
  // A temporary empty view models the file-less phase of a view replacement.
  const transient=await js(`(async()=>{const g=${p}.subGroup,l=g.children[g.currentTab],id=g.id;await l.setViewState({type:'empty',state:{}});await new Promise(r=>setTimeout(r,120));const lost=!${p}.subGroups.some(x=>x.id===id);await l.openFile(app.vault.getAbstractFileByPath(${j(path('자료 A.md'))}));return{group:id,lostDuringEmpty:lost}})()`);
  await writeFile(dir+'/legacy-transient.json',j(transient));
  for(const [name,openMode]of [['자료 A.md','replace'],['사진.png','group'],['지도.canvas','group']])await js(`new Promise(resolve=>${p}.run(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath(${j(path(name))}),'',${j(openMode)});resolve(true)}))`);
  await pause(200);await js(`${p}.flushState();${p}.saveChain.then(()=>true)`);
  const migration=await js(`({last:${p}.subGroup.id,groups:${p}.subGroups.map(g=>g.id),data:JSON.parse(JSON.stringify(${p}.data))})`);migration.leaves=await leaves();await writeFile(dir+'/migration-before.json',j(migration));
  await js(`app.plugins.unloadPlugin('md-palette').then(()=>true)`);
  for(const name of ['main.js','manifest.json','styles.css'])await cp(name,vault+'/.obsidian/plugins/md-palette/'+name);
  await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');if(!${p})await app.plugins.loadPlugin('md-palette');return true})()`);await pause(500);
  assert.equal(await group(),migration.last);assert.deepEqual(await js(`${p}.subGroups.map(g=>g.id)`),[migration.last]);assert.deepEqual(await leaves(),migration.leaves);
  const current=await js(`JSON.parse(JSON.stringify(${p}.data))`);for(const k of ['cards','foldersByMain','folderDefaults','metadataFontSize'])assert.deepEqual(current[k],migration.data[k],k);
  check('upgrade retains last-used Sub only and preserves all tabs, files and organization');
 }
 assert.equal(await js(`${p}.manifest.version`),'0.1.7');await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1100,deviceScaleFactor:1,mobile:false});
 await js(`${p}.selectView('link','card');app.workspace.rightSplit.setSize(460);true`);await pause(300);
 if(mode==='restart'){
  const e=JSON.parse(await readFile(dir+'/expected.json','utf8'));assert.equal(await group(),e.group);assert.deepEqual(await js(`${p}.subGroups.map(g=>g.id)`),[e.group]);
  assert.deepEqual(await leaves(),e.leaves);assert.equal(await js(`app.vault.read(${p}.mainFile)`),e.main);
  assert.equal(await js(`${p}.subGroup.parent.id`),e.parent);assert.equal(await js(`document.querySelectorAll('[aria-label="Sub Space"]').length`),1);
  check('restart retains single Sub, nested layout, links and all open tabs');
  await gesture('사진.png');assert.equal(await group(),e.group);await gesture('지도.canvas');assert.equal(await group(),e.group);check('image and Canvas replacement still target the same Sub after restart');
 }else{
  const initialGroup=await group();
  for(const name of ['자료 A.md','사진.png','지도.canvas','자료 B.md']){
   await gesture(name);assert.equal(await group(),initialGroup);assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file.path`),path(name));assert.equal(await js(`document.querySelectorAll('[aria-label="Sub Space"]').length`),1);
  }
  check('native Card double-click switches MD/image/Canvas in the same Sub with one icon');
  await js(`window.designated=${p}.subGroup;window.subLeaf=designated.children[designated.currentTab];true`);
  await js(`subLeaf.setViewState({type:'empty',state:{}}).then(()=>true)`);await pause(250);assert.equal(await group(),initialGroup);assert.equal(await js(`document.querySelectorAll('[aria-label="Sub Space"]').length`),1);
  await js(`subLeaf.openFile(app.vault.getAbstractFileByPath(${j(path('사진.png'))})).then(()=>true)`);await pause(250);assert.equal(await group(),initialGroup);check('temporary empty/loading view no longer clears Sub designation');
  const n=await js(`${p}.subGroup.children.length`);await gesture('자료 A.md',2);assert.equal(await js(`${p}.subGroup.children.length`),n+1);await gesture('자료 A.md',2);assert.equal(await js(`${p}.subGroup.children.length`),n+1);check('Ctrl double-click adds a Sub tab and reuses an existing same-file tab');
  const before=await leaves();await gesture('지도.canvas',10);const after=await leaves();assert.equal(after.length,before.length+1);assert.equal(await group(),initialGroup);
  assert.deepEqual(after.filter(l=>before.some(b=>b.id===l.id)),before);await js(`window.generalLeaf=app.workspace.getMostRecentLeaf();true`);
  assert.notEqual(await js('generalLeaf.parent.id'),initialGroup);assert.equal(await js(`${p}.isSub(generalLeaf.parent)`),false);check('Ctrl+Shift double-click creates a normal group without changing Main/Sub');
  // A native tab menu assigns a linked Canvas in place without repositioning it.
  const parent=await js('generalLeaf.parent.parent.id');await tabMenu('generalLeaf','서브 스페이스로 지정');const assigned=await group();assert.equal(assigned,await js('generalLeaf.parent.id'));assert.notEqual(assigned,initialGroup);assert.equal(await js('generalLeaf.parent.parent.id'),parent);assert.equal(await js(`${p}.subGroups.length`),1);
  await tabMenu('generalLeaf','서브 스페이스 지정 해제');assert.equal(await group(),undefined);assert.deepEqual(await leaves(),after);check('linked Canvas tab menu assigns/unassigns role only and keeps every tab');
  await setLeaf('generalLeaf');await js(`app.commands.executeCommandById('md-palette:set-sub');true`);await pause(250);assert.equal(await group(),assigned);check('Sub designation toggle command works');
  await js(`(async()=>{window.unlinkedLeaf=app.workspace.createLeafBySplit(generalLeaf,'vertical');await unlinkedLeaf.openFile(app.vault.getAbstractFileByPath(${j(path('미연결 사진.png'))}));return true})()`);await pause(250);
  const mainBefore=await js(`app.vault.read(${p}.mainFile)`);
  await tabMenu('unlinkedLeaf','서브 스페이스로 지정');await wait(`document.querySelector('.mdp-sub-designation')`);await c.screenshot(dir+'/link-dialog.png');await textClick('.modal button','취소');assert.equal(await group(),assigned);assert.equal(await js(`app.vault.read(${p}.mainFile)`),mainBefore);check('unlinked image cancellation changes neither link nor role');
  await tabMenu('unlinkedLeaf','서브 스페이스로 지정');await textClick('.modal button','연결하고 Sub로 지정');await wait(`!document.querySelector('.mdp-sub-designation')`);await pause(300);
  assert.equal(await group(),await js('unlinkedLeaf.parent.id'));assert.ok((await js(`app.vault.read(${p}.mainFile)`)).includes(`[[${path('미연결 사진.png')}]]`));check('confirm links an image to Main then assigns its existing group as the sole Sub');
  // Reject a stale modal before its transaction writes anything.
  await js(`(async()=>{window.staleLeaf=app.workspace.createLeafBySplit(generalLeaf,'vertical');await staleLeaf.openFile(app.vault.getAbstractFileByPath(${j(path('미연결.md'))}));return true})()`);await pause(250);
  const staleBefore=await js(`app.vault.read(${p}.mainFile)`),oldGroup=await group();
  await tabMenu('staleLeaf','서브 스페이스로 지정');await js(`staleLeaf.openFile(app.vault.getAbstractFileByPath(${j(path('자료 B.md'))})).then(()=>true)`);await textClick('.modal button','연결하고 Sub로 지정');assert.match(await js(`document.querySelector('.mdp-sub-designation [role="alert"]').textContent`),/변경/);await textClick('.modal button','취소');assert.equal(await js(`app.vault.read(${p}.mainFile)`),staleBefore);assert.equal(await group(),oldGroup);check('stale target popup is rejected without linking or reassigning');
  // Switch failure is safe and leaves role unchanged.
  await js(`staleLeaf.openFile(app.vault.getAbstractFileByPath(${j(path('미연결.md'))})).then(()=>true)`);await pause(200);await tabMenu('staleLeaf','서브 스페이스로 지정');
  await js(`window.subOriginalFM=app.fileManager.processFrontMatter;app.fileManager.processFrontMatter=async()=>{throw Error('검증용 연결 저장 실패')};true`);
  try{await textClick('.modal button','연결하고 Sub로 지정');assert.match(await js(`document.querySelector('.mdp-sub-designation [role="alert"]').textContent`),/저장 실패/);await textClick('.modal button','취소')}
  finally{await js('app.fileManager.processFrontMatter=window.subOriginalFM;delete window.subOriginalFM;true')}
  assert.equal(await group(),oldGroup);assert.equal(await js(`app.vault.read(${p}.mainFile)`),staleBefore);check('connection write failure leaves role and Main unchanged');
  // Exercise native Split down, not a hand-edited workspace tree.
  await setLeaf('unlinkedLeaf');await js(`app.commands.executeCommandById('workspace:split-horizontal');true`);await pause(500);await js(`window.lowerLeaf=app.workspace.getMostRecentLeaf();true`);
  assert.notEqual(await js('lowerLeaf.parent.id'),oldGroup);await js(`lowerLeaf.openFile(app.vault.getAbstractFileByPath(${j(path('아래 일반.md'))})).then(()=>true)`);await pause(400);
  assert.equal(await group(),oldGroup);assert.equal(await js(`${p}.subGroup.parent.id`),await js('lowerLeaf.parent.parent.id'));assert.equal(await js(`${p}.isSub(lowerLeaf.parent)`),false);
  const geometry=await js(`(()=>{const a=${p}.subGroup.containerEl.getBoundingClientRect(),b=lowerLeaf.parent.containerEl.getBoundingClientRect();return{top:a.top,bottom:a.bottom,belowTop:b.top}})()`);assert.ok(geometry.belowTop>=geometry.bottom-3,j(geometry));check('native Split down stays below Sub without forced full-height rearrangement');
  await gesture('지도.canvas');assert.equal(await group(),oldGroup);assert.equal(await js(`${p}.subGroup.parent.id`),await js('lowerLeaf.parent.parent.id'));await c.screenshot(dir+'/split.png');
  await js(`${p}.flushState();${p}.saveChain.then(()=>true)`);await writeFile(dir+'/expected.json',j({group:await group(),parent:await js(`${p}.subGroup.parent.id`),leaves:await leaves(),main:await js(`app.vault.read(${p}.mainFile)`)}));
 }
 const backup=JSON.parse(await readFile(dir+'/backup.json','utf8'));for(const f of backup.originals){
  const bytes=await readFile(vault+'/'+f.path);
  if(hash(bytes)!==f.sha256&&f.path.endsWith('.canvas')){
   // Only reverse Obsidian JSON formatting when exact original bytes are provable by the recorded hash.
   const original=JSON.stringify(JSON.parse(bytes.toString('utf8')));assert.equal(hash(original),f.sha256,f.path);
   await writeFile(dir+'/canvas-format-before-restore.json',j({path:f.path,formatted:bytes.toString('utf8'),originalSha256:f.sha256}));
   await js(`app.vault.modify(app.vault.getAbstractFileByPath(${j(f.path)}),${j(original)}).then(()=>true)`);
  }
  assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
 }check('all pre-existing Sandbox source-file hashes preserved/restored');
 await c.screenshot(dir+'/'+(mode==='restart'?'restart':'ui')+'.png');assert.deepEqual(c.errors,[]);
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(sha256,hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)));assets.push({name,sha256})}
 const report={passed:true,version:'0.1.7',checks,assets};await writeFile(dir+'/'+(mode==='restart'?'restart':'ui')+'-result.json',j(report));
 if(mode==='restart'){assert.deepEqual(JSON.parse(await readFile(dir+'/ui-result.json','utf8')).assets,assets);await writeFile(dir+'/release-ready.json',j(report))}
}catch(e){await c.screenshot(dir+'/failure.png');throw e}finally{c.close()}
