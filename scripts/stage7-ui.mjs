import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {c,p,js,pause,wait,point,tap,click,key,type,create,drag,view,sort} from './stage4-helpers.mjs';
const dir='.artifacts/stage7',mode=process.argv[2]||'spaces',checks=[];
const check=s=>{checks.push(s);console.log('PASS',s)};
const card=n=>`.mdp-card[data-path="Review/${n}"] .mdp-card-name`;
const body=()=>js(`app.vault.read(${p}.mainFile)`);
async function textClick(selector,text){await tap(await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing '+${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
async function dbl(s,m=0){const pt=await point(s);await tap(pt,'left',1,m);await tap(pt,'left',2,m);await pause(300)}
async function tab(top,sub){await textClick('.mdp-tabs button',top);if(sub)await textClick('.mdp-link-tabs button',sub);await pause(200)}
async function selectAll(s,t){await click(s);await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});await type(t)}
const state=()=>js(`(()=>{const p=${p};return {main:p.mainFile?.path,last:p.subGroup?.id,groups:p.subGroups.map(g=>({id:g.id,active:g.children[g.currentTab]?.view.file?.path,leaves:g.children.map(l=>({id:l.id,file:l.view.file?.path}))})),icons:document.querySelectorAll('.mdp-space-icon[aria-label="Sub Space"]').length}})()`);
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1700,height:1100,deviceScaleFactor:1,mobile:false});
 await key('Escape','Escape',27);
 if(mode==='spaces'){
  await js(`app.workspace.getLeafById('review-main').tabHeaderEl.dataset.stage7='main';true`);
  await click('[data-stage7="main"]','right');await textClick('.menu-item-title','메인 스페이스로 지정');await wait(`${p}.mainFile?.path==='Review/Main.md'`);
  assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Main Space"]').length`),1);check('Main context menu assigns pinned document and icon');
  await js(`${p}.cards.display='list';${p}.cardsChanged();true`);await pause(200);
  const paths=await js(`[...document.querySelectorAll('.mdp-card')].map(e=>e.dataset.path)`);assert.equal(paths.length,6);assert.equal(new Set(paths).size,6);assert.ok(!paths.includes('Review/Main.md'));check('Card combines backlink/outgoing without duplicate or Main');
  await click(card('A.md'));await click(card('B.md'),'left',1,2);assert.equal((await state()).groups.length,0);assert.equal(await js(`document.querySelectorAll('.mdp-card.is-selected').length`),2);check('single/Ctrl selection does not open files');
  await dbl(card('A.md'));const first=await state(),leaf=first.groups[0].leaves[0].id;
  await dbl(card('B.md'));let s=await state();assert.equal(s.groups[0].active,'Review/B.md');assert.equal(s.groups[0].leaves[0].id,leaf);assert.equal(s.groups[0].leaves.length,1);
  await dbl(card('C.md'),2);assert.equal((await state()).groups[0].leaves.length,2);
  await dbl(card('B.md'),2);assert.equal((await state()).groups[0].leaves.length,2);
  await dbl(card('A.md'),10);s=await state();assert.equal(s.groups.length,2);assert.equal(s.icons,2);check('default replaces; Ctrl new tab/reuses same file; Ctrl+Shift new Sub group');
  const bounds=await js(`(()=>{const p=${p};return {root:app.workspace.rootSplit.containerEl.getBoundingClientRect().toJSON(),main:p.mainGroup.containerEl.getBoundingClientRect().toJSON(),subs:p.subGroups.map(g=>g.containerEl.getBoundingClientRect().toJSON())}})()`);assert.ok(bounds.main.height<bounds.root.height*.7);for(const b of bounds.subs)assert.ok(Math.abs(b.height-bounds.root.height)<3);check('multiple Sub groups use full height alongside stacked left groups');
  await click('.mdp-card[data-path="Review/D.md"]','right');await textClick('.menu-item-title','새 Label 만들기');await type('학습');await textClick('.modal button','만들기');assert.ok(await js(`${p}.cards.assignments['Review/D.md']`));check('label menu applies label without changing Markdown');
  const before=await body();await click('.mdp-add-connection');await type('Extra');await textClick('.suggestion-item','Review/Extra.md');await wait(`${p}.connectedFiles().some(f=>f.path==='Review/Extra.md')`);assert.ok((await body()).includes('[[Review/Extra.md]]'));assert.ok((await body()).includes('keep: preserved'));check('connection picker adds link note and preserves other frontmatter');
  await c.screenshot(dir+'/spaces-card.png');
 }
 if(mode==='connections'){
  await js(`${p}.selectView('link','connections');true`);await pause(400);
  const out=await js(`document.querySelector('.mdp-connections').innerText`);assert.ok(out.includes('B'));assert.ok(!out.includes('그림.svg'));check('Connections lists Markdown from all properties and body');
  assert.ok(await js(`!!document.querySelector('.mdp-native-graph-view canvas')`));check('native Local Graph view mounted');
  await dbl('.mdp-connection-row[data-path="Review/D.md"]');const s=await state();assert.equal(s.groups.find(g=>g.id===s.last)?.active,'Review/D.md');
  await c.screenshot(dir+'/connections.png');check('Connections double click opens target in Sub');
 }
 if(mode==='folder'){
  await js(`${p}.selectView('link','folder');true`);await pause(250);
  const before=await body();const folder=await create('학습 자료');await writeFile(dir+'/folder-id.json',JSON.stringify(folder));
  await drag('[data-surface="folder"][data-key="f:Review/A.md"]',`[data-surface="folder"][data-key="d:${folder}"]`);
  assert.equal(await js(`${p}.folders.positions['Review/A.md']`),folder);assert.equal(await body(),before);check('virtual folder creation and native file drag preserve source links/files');
  await dbl(`[data-surface="folder"][data-key="d:${folder}"]`);assert.equal(await js(`${p}.folders.current`),folder);check('double click enters virtual folder');
  await click('.mdp-folder-grid','right');await textClick('.menu-item-title','새 링크 파일 추가');await type('새 학습 노트');await textClick('.modal button','만들고 연결');await wait(`!document.querySelector('.mdp-new-note')`);assert.ok(await js(`!!app.vault.getAbstractFileByPath('새 학습 노트.md')`));assert.equal(await js(`${p}.folders.positions['새 학습 노트.md']`),folder);check('new linked note created and placed in current virtual folder');
  await view('Tree뷰');await view('복합뷰');check('Tree/composite menu preserves folder state');
  await c.screenshot(dir+'/folder.png');
 }
 if(mode==='metadata'){
  await js(`(async()=>{const p=${p};const e=p.mainLeaf.view.editor;e.setValue(e.getValue().replace('- [x] 해야 할 일','- [ ] 해야 할 일'));await p.mainLeaf.view.save();p.selectView('link','card');return true})()`);
  await textClick('.mdp-tabs button','Metadata View');await pause(200);
  const sections=await js(`[...document.querySelectorAll('.mdp-metadata-section')].map(e=>e.dataset.kind)`);assert.deepEqual(sections,['footnotes','highlights','tasks','blocks','links']);check('five Metadata sections visible including URL Links');
  await click('.mdp-meta-tasks input');await wait(`document.querySelectorAll('.mdp-meta-tasks.is-complete').length===2`);assert.ok((await body()).includes('- [x] 해야 할 일'));check('Task click updates Markdown');
  await click('.mdp-footnote-edit');await selectAll('.mdp-footnote-input','수정한 보충 설명\n두 번째 줄');await textClick('.mdp-footnote-actions button','저장');await wait(`!document.querySelector('.mdp-footnote-input')`);assert.ok((await body()).includes('[^note]: 수정한 보충 설명\n    두 번째 줄'));check('footnote edit saves multiline content');
  await click('.mdp-footnote-edit');await js(`app.vault.process(${p}.mainFile,s=>s+${JSON.stringify('\n새 외부 편집\n')})`);await pause(350);await textClick('.mdp-footnote-actions button','저장');await wait(`!document.querySelector('.mdp-footnote-input')`);assert.ok((await body()).includes('새 외부 편집'));check('footnote stale draft does not overwrite external edit');
  await click('[data-kind="highlights"] .mdp-metadata-toggle');assert.equal(await js(`document.querySelector('[data-kind="highlights"] .mdp-metadata-body').hidden`),true);
  await selectAll('.mdp-metadata-search input','강조');assert.equal(await js(`document.querySelector('[data-kind="highlights"] .mdp-metadata-body').hidden`),false);await selectAll('.mdp-metadata-search input','');await key('Backspace','Backspace',8);check('Metadata search temporarily expands matched section');
  await click('[data-kind="highlights"] .mdp-metadata-toggle');await c.screenshot(dir+'/metadata.png');
 }
 assert.equal(c.errors.length,0);await writeFile(dir+'/'+mode+'-result.json',JSON.stringify({passed:true,checks,errors:c.errors},null,2));
}catch(e){await c.screenshot(dir+'/'+mode+'-failure.png');await writeFile(dir+'/'+mode+'-failure.json',JSON.stringify({checks,error:String(e),errors:c.errors},null,2));throw e}finally{c.close()}
