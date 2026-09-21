import assert from 'node:assert/strict';import {writeFile,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {c,p,js,pause,click,wait} from './stage4-helpers.mjs';
const dir='.artifacts/sub-height',base='SubHeight-Review/',restart=process.argv[2]==='restart';
const geometry=()=>js(`(()=>{const p=${p},root=app.workspace.rootSplit;return {main:p.mainGroup.containerEl.getBoundingClientRect().toJSON(),subs:p.subGroups.map(g=>({id:g.id,rect:g.containerEl.getBoundingClientRect().toJSON(),files:g.children.map(l=>l.view.file?.path)})),root:root.containerEl.getBoundingClientRect().toJSON(),left:root.children[0].children.map(g=>({id:g.id,active:g.children[g.currentTab]?.view.file?.path,rect:g.containerEl.getBoundingClientRect().toJSON()}))}})()`);
async function assertLayout(){const s=await geometry();assert.equal(s.left[0].active,'Revision-Review/영상.webm');assert.equal(s.left[1].active,base+'Main.md');assert.ok(s.left[0].rect.bottom<=s.main.top+2);for(const sub of s.subs){assert.ok(Math.abs(sub.rect.y-s.root.y)<2);assert.ok(Math.abs(sub.rect.height-s.root.height)<2);assert.ok(sub.rect.x>=s.main.right-2)}return s}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await wait(`${p}?.mainFile?.path==='${base}Main.md'`);assert.equal(await js(`${p}.manifest.version`),'0.0.15');
 await assertLayout();
 if(!restart){
  await c.screenshot(dir+'/upgraded.png');
  // Reset only managed roles and regroup fixture Sub tabs, preserving all leaves.
  await js(`(async()=>{const p=${p},main=p.mainLeaf,old=p.subGroup,top=app.workspace.rootSplit.children[0].children[0];await p.unsetMain();for(const l of [...old.children]){l.parent.removeChild(l);top.insertChild(top.children.length,l)}const video=top.children.find(l=>l.view.file?.path==='Revision-Review/영상.webm');app.workspace.setActiveLeaf(video);await p.setMain(main);p.selectView('link','card');return true})()`);await pause(350);
  const leavesBefore=await js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{if(l.getRoot()===app.workspace.rootSplit)a.push(l.id)});return a})()`);
  await click(`.mdp-card[data-path="${base}학습 노트.md"] .mdp-card-name`,'left',2);await pause(400);await assertLayout();
  const leavesAfter=await js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{if(l.getRoot()===app.workspace.rootSplit)a.push(l.id)});return a})()`);for(const id of leavesBefore)assert.ok(leavesAfter.includes(id));assert.equal(leavesAfter.length,leavesBefore.length+1);
  const initial=await js(`${p}.subGroup.children[${p}.subGroup.currentTab].id`);
  await click(`.mdp-card[data-path="${base}다른 노트.md"] .mdp-card-name`,'left',2);await pause(200);assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].id`),initial);await assertLayout();
  await click(`.mdp-card[data-path="${base}학습 노트.md"] .mdp-card-name`,'left',2,2);await pause(200);assert.equal(await js(`${p}.subGroup.children.length`),2);await assertLayout();
  await click(`.mdp-card[data-path="${base}다른 노트.md"] .mdp-card-name`,'left',2,10);await pause(250);assert.equal(await js(`${p}.subGroups.length`),2);await assertLayout();await c.screenshot(dir+'/multiple.png');
  // Retain every tab; end with one large Sub for the user's reference layout.
  await js(`(()=>{const p=${p},first=p.subGroups[0],extra=p.subGroups[1];for(const l of [...extra.children]){extra.removeChild(l);first.insertChild(first.children.length,l)}p.subGroups=[first];p.subGroup=first;app.workspace.setActiveLeaf(first.children.find(l=>l.view.file?.path==='${base}학습 노트.md'));p.sync(false);p.persist();return true})()`);await pause(1000);await assertLayout();
  await writeFile(dir+'/expected.json',JSON.stringify(await js(`({spaces:${p}.data.spaces,leafIds:(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{if(l.getRoot()===app.workspace.rootSplit)a.push(l.id)});return a})()})`)));await c.screenshot(dir+'/after.png');
  assert.equal(c.errors.length,0);await writeFile(dir+'/ui-result.json',JSON.stringify({version:'0.0.15',passed:true,migratedOldLayout:true,newSubFullHeight:true,ordinaryTabsPreserved:true,replaceAndCtrlTabAndCtrlShiftGroup:true,geometry:await geometry()},null,2));console.log('Upgrade, fresh Sub, replace, Ctrl tab, Ctrl Shift group and leaf preservation passed');
 }else{
  const expected=JSON.parse(await readFile(dir+'/expected.json','utf8'));assert.deepEqual(await js(`${p}.data.spaces`),expected.spaces);
  const ids=await js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{if(l.getRoot()===app.workspace.rootSplit)a.push(l.id)});return a})()`);assert.deepEqual(ids,expected.leafIds);
  await click(`.mdp-card[data-path="${base}다른 노트.md"] .mdp-card-name`,'left',2);await pause(200);await assertLayout();await click(`.mdp-card[data-path="${base}학습 노트.md"] .mdp-card-name`,'left',2);await pause(200);await assertLayout();
  const vault=await js('app.vault.adapter.getBasePath()'),hash=b=>createHash('sha256').update(b).digest('hex');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
  const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));for(const f of originals)assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
  const old=JSON.parse(await readFile(dir+'/backup/.obsidian/plugins/md-palette/data.json','utf8')),now=await js(`${p}.data`);for(const k of ['labels','assignments','fileType','labelFilter'])assert.deepEqual(now.cards[k],old.cards[k]);for(const [path,state]of Object.entries(old.foldersByMain))assert.deepEqual(now.foldersByMain[path],state);
  const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)),sha256);assets.push({name,sha256})}
  assert.equal(JSON.parse(await readFile(dir+'/ui-result.json','utf8')).passed,true);assert.equal(c.errors.length,0);await c.screenshot(dir+'/restart.png');const result={version:'0.0.15',passed:true,restart:true,originalFilesUnchanged:originals.length,allTabsRestored:true,previousLabelsFoldersPreserved:true,geometry:await geometry(),assets};await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
 }
}finally{c.close()}
