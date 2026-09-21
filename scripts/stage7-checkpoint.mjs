import assert from 'node:assert/strict';import {readFile,writeFile,cp,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {c,p,js,pause,wait,click} from './stage4-helpers.mjs';
const dir='.artifacts/stage7',mode=process.argv[2],hash=b=>createHash('sha256').update(b).digest('hex');
const snapshot=()=>js(`(()=>{const p=${p},tabs=[];app.workspace.iterateAllLeaves(l=>{tabs.push({id:l.id,type:l.getViewState().type,state:l.getViewState().state})});return{version:p.manifest.version,spaces:p.data.spaces,cards:p.data.cards,foldersByMain:p.data.foldersByMain,connections:p.data.connections,tabs:tabs.sort((a,b)=>a.id.localeCompare(b.id))}})()`);
try{
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage7-Sandbox-20260922'));
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1700,height:1100,deviceScaleFactor:1,mobile:false});
 if(mode==='before'){
  await js(`(async()=>{const p=${p};p.selectView('link','card');p.flushState();await p.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1500);
  const files=[];for(const path of await js('app.vault.getFiles().map(f=>f.path)'))files.push({path,sha256:hash(await readFile(vault+'/'+path))});await writeFile(dir+'/pre-upgrade-files.json',JSON.stringify(files,null,2));
  await cp(vault+'/.obsidian',dir+'/pre-upgrade-backup/.obsidian',{recursive:true});await writeFile(dir+'/pre-upgrade.json',JSON.stringify(await snapshot(),null,2));console.log({saved:true,files:files.length});
 }
 if(mode==='upgrade'){
  const expected=JSON.parse(await readFile(dir+'/pre-upgrade.json','utf8'));await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
  const assets=[];for(const name of ['main.js','manifest.json','styles.css']){await cp(name,vault+'/.obsidian/plugins/md-palette/'+name);const sha256=hash(await readFile(name));assert.equal(hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)),sha256);assets.push({name,sha256})}
  await js(`app.plugins.loadManifests().then(()=>app.plugins.enablePluginAndSave('md-palette')).then(()=>true)`);await wait(`${p}?.mainFile?.path==='Review/Main.md'`);
  const current=await snapshot();assert.equal(current.version,'0.1.0');for(const key of ['spaces','cards','foldersByMain','connections'])assert.deepEqual(current[key],expected[key],key);
  const savedLayout=JSON.parse(await readFile(dir+'/pre-upgrade-backup/.obsidian/workspace.json','utf8')),oldTabs=[];
  function collect(n){if(n?.type==='leaf'&&n.state.type!=='md-palette-sidebar')oldTabs.push({id:n.id,type:n.state.type,state:n.state.state});for(const child of n?.children??[])collect(child)}
  for(const key of ['main','left','right'])collect(savedLayout[key]);oldTabs.sort((a,b)=>a.id.localeCompare(b.id));const nowTabs=current.tabs.filter(t=>t.type!=='md-palette-sidebar');assert.deepEqual(nowTabs,oldTabs);
  for(const f of JSON.parse(await readFile(dir+'/pre-upgrade-files.json','utf8')))assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
  await c.screenshot(dir+'/upgraded.png');await writeFile(dir+'/upgrade-result.json',JSON.stringify({passed:true,version:current.version,assets,preservedSourceFiles:JSON.parse(await readFile(dir+'/pre-upgrade-files.json','utf8')).length},null,2));console.log('PASS 0.0.15 to 0.1.0 state/tab/file preservation');
 }
 if(mode==='save-restart'){
  await js(`(async()=>{const p=${p};p.selectView('link','card');p.flushState();await p.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1500);await writeFile(dir+'/restart-expected.json',JSON.stringify(await snapshot(),null,2));console.log('Saved restart checkpoint');
  const files=[];for(const path of await js('app.vault.getFiles().map(f=>f.path)'))files.push({path,sha256:hash(await readFile(vault+'/'+path))});await writeFile(dir+'/restart-files.json',JSON.stringify(files,null,2));
 }
 if(mode==='restart'){
  await wait(`${p}?.mainFile?.path==='Review/Main.md'`);const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8')),current=await snapshot();assert.equal(current.version,'0.1.0');for(const key of ['spaces','cards','foldersByMain','connections'])assert.deepEqual(current[key],expected[key],key);
  // Canvas can recenter its viewport when the test display metrics change. The
  // persisted Canvas nodes are checked byte-for-byte below; compare tab identity,
  // file and editor state independently of that app-owned camera position.
  const tabIdentity=t=>({...t,state:Object.fromEntries(Object.entries(t.state??{}).filter(([key])=>key!=='viewState'))});
  assert.deepEqual(current.tabs.map(tabIdentity),expected.tabs.map(tabIdentity));assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Main Space"]').length`),1);assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Sub Space"]').length`),current.spaces.subs.length);
  const dimensions=await js(`({root:app.workspace.rootSplit.containerEl.getBoundingClientRect().height,subs:${p}.subGroups.map(g=>g.containerEl.getBoundingClientRect().height)})`);assert.ok(dimensions.subs.every(h=>Math.abs(h-dimensions.root)<3));
  const id=await js(`${p}.subGroup.children[${p}.subGroup.currentTab].id`),path=await js(`${p}.connectedFiles().find(f=>!${p}.subGroup.children.some(l=>l.view.file===f)).path`);await click(`.mdp-card[data-path="${path}"] .mdp-card-name`,'left',2);await wait(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file?.path===${JSON.stringify(path)}`);assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].id`),id);
  for(const f of JSON.parse(await readFile(dir+'/restart-files.json','utf8')))assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
  const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)),sha256);assets.push({name,sha256})}
  await c.screenshot(dir+'/restart.png');assert.equal(c.errors.length,0);await writeFile(dir+'/restart-result.json',JSON.stringify({passed:true,version:'0.1.0',dimensions,assets,restoredTabs:current.tabs.length},null,2));console.log('PASS process restart, roles, all tabs, last Sub, folders, labels, source hashes');
 }
}finally{c.close()}
