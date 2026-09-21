import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,tap,key,type,drag} from './stage4-helpers.mjs';
const dir='.artifacts/revision3',base='Revision3-Review/',long='다빈치 리졸브 초보자를 위한 에디트 페이지 핵심 가이드.md';
const file=n=>`[data-surface="folder"][data-key="f:${base+n}"]`;
async function textClick(selector,text){await tap(await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing '+${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
async function mode(name){await click('.mdp-folder-toolbar button');if(!await js("!!document.querySelector('.menu-item-title')")){await pause(300);await click('.mdp-folder-toolbar button');}await textClick('.menu-item-title',name);await pause(180)}
async function shortcut(){await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'M',code:'KeyM',modifiers:10,windowsVirtualKeyCode:77});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'M',code:'KeyM',modifiers:0,windowsVirtualKeyCode:77});await pause(350)}
async function activate(id){await js(`(()=>{const leaves=[];app.workspace.iterateAllLeaves(l=>{leaves.push(l)});app.workspace.setActiveLeaf(leaves.find(l=>l.id===${JSON.stringify(id)}),{focus:true});return true})()`);await pause(150)}
async function fixtureTab(name){return js(`(async()=>{const g=${p}.mainGroup;const l=g?app.workspace.createLeafInParent(g,g.children.length):app.workspace.getLeaf('tab');await l.openFile(app.vault.getAbstractFileByPath(${JSON.stringify(base+name)}));app.workspace.setActiveLeaf(l,{focus:true});return l.id})()`)}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.clearDeviceMetricsOverride');
 await js(`(()=>{const w=require('@electron/remote').getCurrentWindow();w.restore();w.setBounds({x:20,y:20,width:1800,height:1050});w.showInactive();app.workspace.rightSplit.setSize(620);return true})()`);
 assert.deepEqual(await js(`Object.fromEntries(Object.entries(${p}.foldersByMain).filter(([k])=>!k.startsWith('${base}')))`),JSON.parse(await readFile(dir+'/previous-folders.json','utf8')));
 assert.equal(await js(`app.commands.commands['md-palette:unset-main']`),undefined);
 assert.equal(await js(`app.commands.commands['md-palette:set-main'].name`),'MD Palette: 메인 스페이스 지정/해제');
 assert.deepEqual(await js(`app.hotkeyManager.customKeys['md-palette:set-main']`),[{modifiers:['Mod','Shift'],key:'M'}]);
 await js(`delete ${p}.foldersByMain['${base}Main.md'];delete ${p}.foldersByMain['${base}Other.md'];true`);
 const originalIds=await js(`(()=>{const ids=[];app.workspace.iterateAllLeaves(l=>{ids.push(l.id)});return ids})()`);
 const mainId=await fixtureTab('Main.md');await shortcut();await wait(`${p}.mainFile?.path==='${base}Main.md'`);
 assert.equal(await js(`${p}.folders.display`),'compact');
 // Same Main toggles off; other eligible Markdown becomes the new Main.
 await activate(mainId);await shortcut();await wait(`!${p}.mainFile`);
 await shortcut();await wait(`${p}.mainFile?.path==='${base}Main.md'`);
 const otherId=await fixtureTab('Other.md');await shortcut();await wait(`${p}.mainFile?.path==='${base}Other.md'`);
 await activate(mainId);await shortcut();await wait(`${p}.mainFile?.path==='${base}Main.md'`);
 if(await js(`${p}.topView!=='link'`))await textClick('.mdp-tabs button','Link View');await textClick('.mdp-tabs button','Folder');
 await wait(`!!document.querySelector('.mdp-display-compact')`);
 // Verify compact rendering never requests linked-file body or binary previews.
 await js(`window.r3Reads=[];window.r3Readers={};for(const k of ['read','cachedRead','readBinary']){window.r3Readers[k]=app.vault[k];app.vault[k]=function(f,...args){if(f.path.startsWith('${base}')&&f.path!=='${base}Main.md')window.r3Reads.push([k,f.path]);return window.r3Readers[k].call(this,f,...args)}};true`);
 try{await mode('제목 카드');await pause(400);assert.deepEqual(await js('window.r3Reads'),[])}finally{await js(`for(const k of Object.keys(window.r3Readers))app.vault[k]=window.r3Readers[k];true`)}
 assert.equal(await js(`document.querySelectorAll('.mdp-display-compact .mdp-preview,.mdp-display-compact .mdp-card-info').length`),0);
 const shape=await js(`(()=>{const e=document.querySelector(${JSON.stringify(file(long))}),t=e.querySelector('.mdp-compact-title');return{height:e.getBoundingClientRect().height,lines:getComputedStyle(t).webkitLineClamp,title:e.title,icon:!!e.querySelector('svg')}})()`);
 assert.equal(shape.height,66);assert.equal(shape.lines,'2');assert.ok(shape.title.includes(long)&&shape.icon);
 await click('.mdp-tree-root','right');await textClick('.menu-item-title','새 가상 폴더 만들기');await type('test 폴더');await textClick('.modal button','저장');await wait(`!document.querySelector('.modal')`);
 const folderId=await js(`${p}.folders.folders.find(f=>f.name==='test 폴더').id`),folder=`[data-surface="folder"][data-key="d:${folderId}"]`;
 await c.send('Page.bringToFront');await c.screenshot(dir+'/compact.png');
 await click(file(long));assert.equal(await js(`document.querySelector(${JSON.stringify(file(long))}).getAttribute('aria-selected')`),'true');
 await click(file('계획법.md'),'left',1,2);assert.equal(await js(`document.querySelectorAll('.mdp-folder-grid [aria-selected="true"]').length`),2);
 // Real drag preserves mixed item handlers in the new compact view.
 await click(file('계획법.md'));await drag(file('계획법.md'),folder);assert.equal(await js(`${p}.folders.positions['${base}계획법.md']`),folderId);
 await click(folder,'left',2);await wait(`!!document.querySelector(${JSON.stringify(file('계획법.md'))})`);
 await click(file('계획법.md'),'left',2);await wait(`${p}.subGroup?.children.some(l=>l.view.file?.path==='${base}계획법.md')`);
 const subId=await js(`${p}.subGroup.children.find(l=>l.view.file?.path==='${base}계획법.md').id`);
 await activate(subId);await shortcut();assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 await click('[aria-label="상위 폴더"]');await wait(`!!document.querySelector(${JSON.stringify(file(long))})`);
 await click(file('프로젝트.canvas'),'left',2);await wait(`app.workspace.getMostRecentLeaf().getViewState().type==='canvas'`);await shortcut();assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 await click(file('그림.svg'),'left',2);await wait(`app.workspace.getMostRecentLeaf().getViewState().type==='image'`);await shortcut();assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 await click(file(long),'right');assert.ok(await js(`[...document.querySelectorAll('.menu-item-title')].some(e=>e.textContent==='Sub Space에서 열기')`));await key('Escape','Escape',27);
 const pt=await js(`(()=>{const e=document.querySelector(${JSON.stringify(file(long))});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+20,y:r.y+20}})()`);
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:30,y:200});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt,modifiers:2});await wait(`!!document.querySelector('.hover-popover')`);await pause(250);assert.ok((await js(`document.querySelector('.hover-popover').innerText`)).includes('긴 제목 본문'));await c.send('Page.bringToFront');await c.screenshot(dir+'/hover.png');await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:30,y:200});await key('Escape','Escape',27);await pause(300);
 for(const [name,value] of [['큰 아이콘','large'],['중간 아이콘','medium'],['작은 아이콘','small'],['목록','list'],['자세히','details'],['타일','tiles'],['제목 카드','compact']]){await mode(name);assert.equal(await js(`${p}.folders.display`),value)}
 await click('[aria-label="Folder 정렬"]');const sortNames=await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`);for(const n of ['사용자 지정','이름','유형','수정 날짜','크기','오름차순','내림차순'])assert.ok(sortNames.includes(n),n);await textClick('.menu-item-title','이름');await click('[aria-label="Folder 정렬"]');await textClick('.menu-item-title','내림차순');assert.equal(await js(`${p}.folders.descending`),true);
 await js(`app.workspace.rightSplit.setSize(330);true`);await pause(200);assert.equal(await js(`(()=>{const e=document.querySelector('.mdp-folder-grid');return e.scrollWidth<=e.clientWidth+1})()`),true);await c.send('Page.bringToFront');await c.screenshot(dir+'/narrow.png');
 await js(`app.workspace.rightSplit.setSize(620);true`);await activate(mainId);await shortcut();await wait(`!${p}.mainFile`);assert.equal(await js(`document.querySelectorAll('.mdp-space-icon').length`),0);
 assert.ok(await js(`(()=>{const ids=[];app.workspace.iterateAllLeaves(l=>{ids.push(l.id)});return ${JSON.stringify([...originalIds,mainId,otherId,subId])}.every(id=>ids.includes(id))})()`));
 await shortcut();await wait(`${p}.mainFile?.path==='${base}Main.md'`);await wait(`!!document.querySelector('.mdp-display-compact')`);
 await js(`${p}.flushState();app.workspace.requestSaveLayout();true`);await pause(1200);
 await writeFile(dir+'/before-restart.json',JSON.stringify(await js(`({main:${p}.mainFile.path,mainId:${p}.mainLeaf.id,folders:${p}.foldersByMain,cards:${p}.cards,hotkeys:app.hotkeyManager.customKeys['md-palette:set-main']})`),null,2));
 assert.deepEqual(c.errors,[]);await writeFile(dir+'/ui-result.json',JSON.stringify({passed:true,version:'0.0.11',compactShape:shape,zeroThumbnailReads:true,legacyViews:6,hotkeyToggle:true,subCanvasImageRejected:true,tabsPreserved:true,drag:true,narrow:true,errors:c.errors},null,2));console.log('Revision 3 UI passed');
}finally{c.close()}
