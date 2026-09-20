import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,tap,key,type} from './stage4-helpers.mjs';
const dir='.artifacts/stage5',base='Stage5-Review/';
async function textClick(selector,text){await tap(await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing text '+${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
async function selectMain(name){
 await js(`(async()=>{await ${p}.unsetMain();let leaf=app.workspace.getLeavesOfType('markdown').find(l=>l.view.file?.path===${JSON.stringify(base+name)});if(!leaf){leaf=app.workspace.getLeaf('tab');await leaf.openFile(app.vault.getAbstractFileByPath(${JSON.stringify(base+name)}))}await app.workspace.revealLeaf(leaf);leaf.tabHeaderEl.dataset.stage5Main='true';return true})()`);
 await click('[data-stage5-main="true"]','right');await textClick('.menu-item-title','메인 스페이스로 지정');await js(`document.querySelectorAll('[data-stage5-main]').forEach(e=>delete e.dataset.stage5Main);true`);await wait(`${p}.mainFile?.path===${JSON.stringify(base+name)}&&!${p}.busy`);
 if(await js(`${p}.topView!=='metadata'`))await textClick('.mdp-tabs button','Metadata View');
 await wait(`!!document.querySelector('.mdp-metadata-search input')`);
}
async function search(text){await click('.mdp-metadata-search input');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});if(text)await type(text);else await key('Backspace','Backspace',8);await pause(150)}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:2300,height:1200,deviceScaleFactor:1,mobile:false});
 if(await js(`!!document.querySelector('.mdp-footnote-input')`))await textClick('.mdp-footnote-actions button','취소');
 await js(`(async()=>{const f=app.vault.getAbstractFileByPath('${base}Main.md');await app.vault.process(f,s=>s.replace('- [x] 해야 할 일','- [ ] 해야 할 일').replace(/\\n최신 원문 보호\\n/g,''));return true})()`);await pause(400);
 await js(`app.workspace.rightSplit.setSize(480);${p}.metadataCollapsed=[];true`);
 await selectMain('Main.md');await wait(`document.querySelectorAll('.mdp-meta-links').length===4`);
 assert.deepEqual(await js(`[...document.querySelectorAll('.mdp-metadata-section')].map(e=>[e.dataset.kind,e.querySelector('.mdp-metadata-count').textContent])`),[['footnotes','1'],['highlights','1'],['tasks','2'],['blocks','2'],['links','4']]);
 assert.equal(await js(`document.querySelectorAll('.mdp-metadata-duplicate').length`),2);
 await c.screenshot(dir+'/metadata.png');
 await click('[data-kind="highlights"] .mdp-metadata-toggle');assert.equal(await js(`document.querySelector('[data-kind="highlights"] .mdp-metadata-body').hidden`),true);
 await search('강조');assert.equal(await js(`document.querySelector('[data-kind="highlights"] .mdp-metadata-body').hidden`),false);
 await search('');assert.equal(await js(`document.querySelector('[data-kind="highlights"] .mdp-metadata-body').hidden`),true);
 await click('[data-kind="highlights"] .mdp-metadata-toggle');
 await click('.mdp-meta-tasks input');await wait(`document.querySelectorAll('.mdp-meta-tasks.is-complete').length===2`);
 assert.ok((await js(`app.vault.read(${p}.mainFile)`)).includes('- [x] 해야 할 일'));
 await textClick('.mdp-task-filters button','미완료 (0)');assert.equal(await js(`document.querySelectorAll('.mdp-meta-tasks').length`),0);await textClick('.mdp-task-filters button','전체 (2)');
 await click('.mdp-footnote-edit');await click('.mdp-footnote-input');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await type('수정한 각주\n두 번째 줄 보존');await textClick('.mdp-footnote-actions button','저장');
 await wait(`!document.querySelector('.mdp-footnote-input')`);assert.ok((await js(`app.vault.read(${p}.mainFile)`)).includes('[^note]: 수정한 각주\n    두 번째 줄 보존'));
 // A newer source wins over an open footnote draft.
 await click('.mdp-footnote-edit');await js(`app.vault.process(${p}.mainFile,s=>s+'\\n최신 원문 보호\\n')`);await pause(350);await textClick('.mdp-footnote-actions button','저장');await wait(`!document.querySelector('.mdp-footnote-input')`);assert.ok((await js(`app.vault.read(${p}.mainFile)`)).endsWith('최신 원문 보호\n'));assert.ok((await js(`document.body.innerText`)).includes('원문이 변경'));
 const mainId=await js(`${p}.mainLeaf.id`);const before=await js(`${p}.mainGroup.children.length`);const increment=await js(`${p}.mainGroup.children.some(l=>l.view.file?.path==='${base}자료.md')?0:1`);
 await textClick('.mdp-meta-links .mdp-metadata-text','Stage5-Review/자료.md');await wait(`app.workspace.getMostRecentLeaf().view.file?.path==='${base}자료.md'&&!${p}.busy`);
 assert.equal(await js(`${p}.mainLeaf.id`),mainId);assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');assert.equal(await js(`${p}.mainGroup.children.length`),before+increment);
 if(increment)assert.equal(await js(`${p}.mainGroup.children[${p}.mainGroup.children.indexOf(${p}.mainLeaf)+1].view.file.path`),base+'자료.md');
 await textClick('.mdp-meta-links .mdp-metadata-text','Stage5-Review/자료.md');assert.equal(await js(`${p}.mainGroup.children.length`),before+increment);
 await textClick('.mdp-meta-links .mdp-metadata-text','Stage5-Review/그림.svg');await wait(`app.workspace.getMostRecentLeaf().view.file?.extension==='svg'`);assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');
 await textClick('.mdp-meta-links .mdp-metadata-text','Stage5-Review/없는파일');assert.equal(await js(`app.vault.getAbstractFileByPath('${base}없는파일.md')`),null);
 // Native core Web Viewer opt-in, in the isolated Sandbox only.
 await js(`app.internalPlugins.plugins.webviewer.enable()`);
 const webTypes=await js(`Object.keys(app.viewRegistry.viewByType).filter(k=>/web/.test(k))`);console.log({webTypes});
 await textClick('.mdp-meta-links .mdp-metadata-text','https://example.com');await textClick('.menu-item-title','옵시디언 웹뷰어로 열기');
 await wait(`${p}.mainGroup.children.some(l=>l.getViewState().state?.url==='https://example.com/')&&!${p}.busy`);
 const webCount=await js(`${p}.mainGroup.children.length`);await textClick('.mdp-meta-links .mdp-metadata-text','https://example.com');await textClick('.menu-item-title','옵시디언 웹뷰어로 열기');assert.equal(await js(`${p}.mainGroup.children.length`),webCount);assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 // Verify native external browser dispatch without touching the user's browser session.
 await js(`window.stage5Shell=require('electron').shell;window.stage5OpenExternal=window.stage5Shell.openExternal;window.stage5External=[];window.stage5Shell.openExternal=async u=>{window.stage5External.push(u)};true`);
 try {await textClick('.mdp-meta-links .mdp-metadata-text','https://example.com');await textClick('.menu-item-title','기본 브라우저로 열기');await wait(`window.stage5External.length===1`);assert.equal(await js(`window.stage5External[0]`),'https://example.com/');}finally{await js(`window.stage5Shell.openExternal=window.stage5OpenExternal;true`)}
 await c.screenshot(dir+'/adjacent-tabs.png');
 // Source navigation activates the pinned Main, not the current adjacent tab.
 await click('.mdp-meta-blocks .mdp-metadata-text');await wait(`app.workspace.getMostRecentLeaf()===${p}.mainLeaf&&!${p}.busy`);assert.equal(await js(`${p}.mainLeaf.view.editor.getLine(${p}.mainLeaf.view.editor.getCursor().line)`),'첫 번째 블록입니다. ^same');
 await search('강조');await selectMain('Empty.md');assert.equal(await js(`document.querySelector('.mdp-metadata-search input').value`),'강조');await search('');assert.equal(await js(`document.querySelectorAll('.mdp-metadata-empty').length`),5);
 // Closing Main leaves every other tab intact and unsets the role.
 const survivors=await js(`${p}.mainGroup.children.filter(l=>l!==${p}.mainLeaf).map(l=>l.id)`);await js(`${p}.mainLeaf.tabHeaderEl.dataset.stage5Close='true';true`);await click('[data-stage5-close] .workspace-tab-header-inner-close-button');await wait(`!${p}.mainFile&&!${p}.mainGroup`);assert.equal(await js(`!!document.querySelector('.mdp-metadata-search')`),false);
 assert.ok(await js(`(()=>{const ids=[];app.workspace.iterateAllLeaves(l=>{ids.push(l.id)});return ${JSON.stringify(survivors)}.every(id=>ids.includes(id))})()`));
 await selectMain('Main.md');await search('');await click('[data-kind="highlights"] .mdp-metadata-toggle');
 await textClick('.mdp-meta-links .mdp-metadata-text','Stage5-Review/자료.md');
 await js(`${p}.flushState();app.workspace.requestSaveLayout();true`);await pause(1500);
 await writeFile(dir+'/ui-result.json',JSON.stringify({passed:true,version:'0.0.9',mainId,externalBrowserDispatchOnly:true,errors:c.errors},null,2));
 assert.deepEqual(c.errors,[]);console.log('Stage 5 UI passed');
}finally{c.close()}
