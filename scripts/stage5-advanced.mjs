import assert from 'node:assert/strict';import {writeFile,readFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,tap,type,key} from './stage4-helpers.mjs';
const dir='.artifacts/stage5';
async function textClick(selector,text){await tap(await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.trim()===${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await js(`(async()=>{const leaf=app.workspace.getLeavesOfType('markdown').find(l=>l.view.file?.path==='Stage5-Review/Main.md');await ${p}.setMain(leaf);${p}.selectView('metadata');return true})()`);await wait(`!!document.querySelector('.mdp-metadata-search input')`);
 await click('.mdp-metadata-search input');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await key('Backspace','Backspace',8);await wait(`document.querySelectorAll('.mdp-meta-tasks').length===2`);
 const before=await js(`app.vault.read(${p}.mainFile)`);
 await js(`window.stage5Patch=${p}.patchMain;${p}.patchMain=async()=>{throw Error('시험용 저장 실패')};true`);
 const checked=await js(`document.querySelector('.mdp-meta-tasks input').checked`);
 try{await click('.mdp-meta-tasks input');assert.equal(await js(`document.querySelector('.mdp-meta-tasks input').checked`),checked);assert.equal(await js(`app.vault.read(${p}.mainFile)`),before)}finally{await js(`${p}.patchMain=window.stage5Patch;true`)}
 // Collapse/filter controls must remain usable in a narrow sidebar.
 await js(`app.workspace.rightSplit.setSize(330);true`);await pause(180);
 const narrow=await js(`(()=>{const root=document.querySelector('.mdp-metadata');return{width:root.clientWidth,scroll:root.scrollWidth}})()`);assert.ok(narrow.scroll<=narrow.width+1);await c.screenshot(dir+'/narrow.png');await js(`app.workspace.rightSplit.setSize(480);true`);
 // Existing Link View actions still target Sub and preserve all Main-adjacent tabs.
 const mainId=await js(`${p}.mainLeaf.id`);await textClick('.mdp-tabs button','Link View');await textClick('.mdp-link-tabs button','Card');
 await wait(`!!document.querySelector('.mdp-card[data-path="Stage5-Review/자료.md"]')`);await click('.mdp-card[data-path="Stage5-Review/자료.md"]','left',2);await wait(`!!${p}.subGroup&&!${p}.busy`);assert.equal(await js(`${p}.mainLeaf.id`),mainId);assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file.path`),'Stage5-Review/자료.md');
 await textClick('.mdp-link-tabs button','Connections');await wait(`!!document.querySelector('.mdp-connections')`);assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 await textClick('.mdp-link-tabs button','Folder');await wait(`!!document.querySelector('.mdp-folder-view')`);assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 await textClick('.mdp-tabs button','Metadata View');await wait(`!!document.querySelector('.mdp-metadata-search')`);
 // Create a large Main fixture. Each section still searches beyond the first rendered page.
 const text=Array.from({length:2000},(_,i)=>`- [ ] 검증할 일 ${i}\n\n==강조 ${i}==\n\n내용 ${i} ^block-${i}\n`).join('\n');
 await js(`(async()=>{const path='Stage5-Review/Large.md',file=app.vault.getAbstractFileByPath(path);if(file)await app.vault.modify(file,${JSON.stringify(text)});else await app.vault.create(path,${JSON.stringify(text)});return true})()`);
 const elapsed=await js(`(async()=>{const leaf=app.workspace.createLeafInParent(${p}.mainGroup,${p}.mainGroup.children.length);await leaf.openFile(app.vault.getAbstractFileByPath('Stage5-Review/Large.md'));const start=performance.now();await ${p}.setMain(leaf);return performance.now()-start})()`);
 await wait(`document.querySelector('[data-kind="tasks"] .mdp-metadata-count')?.textContent==='2000'`);assert.equal(await js(`document.querySelectorAll('.mdp-meta-tasks').length`),100);
 const start=performance.now();await click('.mdp-metadata-search input');await type('1999');await wait(`document.querySelectorAll('.mdp-meta-tasks').length===1`);const searchRoundTrip=performance.now()-start;
 assert.ok((await js(`document.querySelector('.mdp-meta-tasks').innerText`)).includes('1999'));
 await click('.mdp-metadata-search input');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await key('Backspace','Backspace',8);
 await js(`(async()=>{await ${p}.navigateMain(${p}.mainFile,0);return true})()`);const typingStart=performance.now();await type('입력 확인\n');const typingRoundTrip=performance.now()-typingStart;await wait(`${p}.mainLeaf.view.editor.getValue().startsWith('입력 확인')`);
 // Restore the review Main, preserve nonempty query until restart, and collapse Highlights.
 await js(`(async()=>{await ${p}.setMain(app.workspace.getLeavesOfType('markdown').find(l=>l.view.file?.path==='Stage5-Review/Main.md'));return true})()`);await wait(`document.querySelector('[data-kind="tasks"] .mdp-metadata-count')?.textContent==='2'`);
 if(!await js(`${p}.metadataCollapsed.includes('highlights')`))await click('[data-kind="highlights"] .mdp-metadata-toggle');
 await click('.mdp-metadata-search input');await type('자료');
 await textClick('.mdp-meta-links .mdp-metadata-text','Stage5-Review/자료.md');
 await js(`${p}.flushState();app.workspace.requestSaveLayout();true`);await pause(1600);
 const snapshot=await js(`({main:${p}.mainFile.path,mainId:${p}.mainLeaf.id,active:app.workspace.getMostRecentLeaf().view.file?.path,collapsed:${p}.metadataCollapsed,folders:${p}.foldersByMain,cards:${p}.cards,connections:${p}.connections,spaces:${p}.data.spaces})`);
 await writeFile(dir+'/before-restart.json',JSON.stringify(snapshot,null,2));
 const original=JSON.parse(await readFile(dir+'/backup/.obsidian/plugins/md-palette/data.json','utf8'));for(const [path,state]of Object.entries(original.foldersByMain))assert.deepEqual(snapshot.folders[path],state);assert.deepEqual(snapshot.cards.labels,original.cards.labels);assert.deepEqual(snapshot.cards.assignments,original.cards.assignments);
 const result={passed:true,rollback:true,narrow,large:{tasks:2000,highlights:2000,blocks:2000,mainSetMs:elapsed,searchRoundTripMs:searchRoundTrip,typingRoundTripMs:typingRoundTrip,note:'CDP/input helpers include 180-250ms waits; not pure UI latency'},errors:c.errors};assert.deepEqual(c.errors,[]);await writeFile(dir+'/advanced-result.json',JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
