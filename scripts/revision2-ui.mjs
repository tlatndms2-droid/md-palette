import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,tap,key} from './stage4-helpers.mjs';
const dir='.artifacts/revision2',base='Revision2-Review/';
async function textClick(selector,text){await tap(await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing text '+${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
c.screenshot=async path=>{await c.send('Page.bringToFront');const r=await c.send('Page.captureScreenshot',{format:'png',fromSurface:false});await writeFile(path,Buffer.from(r.data,'base64'))};
const mainSelector='.workspace-leaf[data-revision-main]';
async function showMain(mode='preview'){
 await js(`(async()=>{const l=${p}.mainLeaf;await app.workspace.revealLeaf(l);await l.setViewState({...l.getViewState(),state:{...l.getViewState().state,mode:${JSON.stringify(mode)},source:false}});l.containerEl.dataset.revisionMain='true';return true})()`);await pause(300);
}
async function hover(selector,name){
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:10,y:100});await key('Escape','Escape',27);await pause(150);
 const pt=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing hover target');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+Math.min(35,r.width/2),y:r.y+r.height/2}})()`);
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt});await pause(400);
 assert.equal(await js(`!!document.querySelector('.hover-popover')`),false,'no preview without Ctrl');
 await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Control',code:'ControlLeft',modifiers:2,windowsVirtualKeyCode:17});
 await wait(`!!document.querySelector('.hover-popover')`);await pause(450);assert.ok((await js(`document.querySelector('.hover-popover').innerText`)).includes('Body 참고'));
 await c.screenshot(dir+'/'+name+'.png');
 await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Control',code:'ControlLeft',modifiers:0,windowsVirtualKeyCode:17});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:10,y:100});await key('Escape','Escape',27);await pause(400);
}
try {
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Page.bringToFront');await c.send('Emulation.clearDeviceMetricsOverride');
 await js(`(async()=>{await ${p}.unsetMain();let leaf=app.workspace.getLeavesOfType('markdown').find(l=>l.view.file?.path==='${base}Main.md');if(!leaf){leaf=app.workspace.getLeaf('tab');await leaf.openFile(app.vault.getAbstractFileByPath('${base}Main.md'))}await app.workspace.revealLeaf(leaf);leaf.tabHeaderEl.dataset.revisionSetMain='true';return true})()`);
 await click('[data-revision-set-main]','right');await textClick('.menu-item-title','메인 스페이스로 지정');await wait(`${p}.mainFile?.path==='${base}Main.md'&&!${p}.busy`);
 await js(`app.workspace.rightSplit.setSize(490);${p}.metadataCollapsed=[];true`);
 if(await js(`${p}.topView!=='metadata'`))await textClick('.mdp-tabs button','Metadata View');
 await wait(`document.querySelectorAll('.mdp-meta-links').length===1`);
 assert.equal(await js(`document.querySelector('.mdp-meta-links').innerText.includes('웹 링크')`),true);
 assert.equal(await js(`document.querySelector('[data-kind="highlights"] .mdp-metadata-count').textContent`),'1');
 await c.screenshot(dir+'/url-only.png');
 const mainId=await js(`${p}.mainLeaf.id`);
 await showMain();
 await click(mainSelector+' .markdown-preview-view a[data-href="Revision2-Review/Body.md#Target"]');
 await wait(`${p}.subGroup?.children.some(l=>l.view.file?.path==='${base}Body.md')`);
 assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 const bodyId=await js(`${p}.subGroup.children.find(l=>l.view.file?.path==='${base}Body.md').id`);
 await showMain();await click(mainSelector+' .markdown-preview-view a[data-href="Revision2-Review/Body.md#Target"]');
 assert.equal(await js(`${p}.subGroup.children.filter(l=>l.view.file?.path==='${base}Body.md').length`),1);
 assert.equal(await js(`app.workspace.getMostRecentLeaf().id`),bodyId);
 await showMain();
 await click(mainSelector+' .metadata-container .internal-link[data-href="Revision2-Review/Property.md"]');
 await wait(`${p}.subGroup?.children.some(l=>l.view.file?.path==='${base}Property.md')`);
 assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');
 await showMain();await click(mainSelector+' .markdown-preview-view a[data-href="Revision2-Review/Board.canvas"]');
 await wait(`app.workspace.getMostRecentLeaf().getViewState().type==='canvas'`);assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');
 await c.screenshot(dir+'/main-links-sub.png');
 // A web-only Sub must also remain a managed Sub across persistence/restart.
 await js(`app.internalPlugins.plugins.webviewer.enable()`);
 await textClick('.mdp-meta-links .mdp-metadata-text','https://example.com');await textClick('.menu-item-title','옵시디언 웹뷰어로 열기');
 await wait(`${p}.subGroup.children.some(l=>l.getViewState().state?.url==='https://example.com/')&&!${p}.busy`);
 const subCount=await js(`${p}.subGroup.children.length`);
 await textClick('.mdp-meta-links .mdp-metadata-text','https://example.com');await textClick('.menu-item-title','옵시디언 웹뷰어로 열기');
 assert.equal(await js(`${p}.subGroup.children.length`),subCount);assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 await textClick('.mdp-tabs button','Link View');await textClick('.mdp-tabs button','Card');
 // Seed label fixtures only; membership/deletion are verified with native UI input.
 await js(`${p}.cards.labels=${p}.cards.labels.filter(l=>!l.id.startsWith('r2-'));${p}.cards.labels.push({id:'r2-keep',name:'유지 라벨',color:'#70aa90'},{id:'r2-delete',name:'삭제 테스트',color:'#aa70aa'});Object.assign(${p}.cards.assignments,{'${base}Main.md':'r2-delete','${base}Body.md':'r2-delete','${base}Other.md':'r2-delete','${base}Property.md':'r2-keep'});${p}.cards.labelFilter=['r2-delete'];${p}.cards.display='list';${p}.cardsChanged();true`);
 await textClick('.mdp-card-view button','라벨 관리…');
 await textClick('.mdp-label-list button','삭제 테스트 (3)');
 assert.equal(await js(`document.querySelectorAll('.mdp-label-member').length`),3);assert.ok((await js(`document.querySelector('.mdp-label-members').innerText`)).includes('Other.md'));
 await c.screenshot(dir+'/labels.png');
 await textClick('.modal button','라벨 삭제');await textClick('.mdp-label-delete-confirm button','취소');assert.equal(await js(`${p}.cards.labels.some(l=>l.id==='r2-delete')`),true);
 await textClick('.modal button','라벨 삭제');await textClick('.mdp-label-delete-confirm button','라벨만 삭제');
 assert.equal(await js(`Object.values(${p}.cards.assignments).includes('r2-delete')`),false);assert.equal(await js(`${p}.cards.labelFilter.includes('r2-delete')`),false);
 assert.equal(await js(`${p}.cards.assignments['${base}Property.md']`),'r2-keep');assert.equal(await js(`['Main.md','Body.md','Other.md'].every(n=>!!app.vault.getAbstractFileByPath('${base}'+n))`),true);
 await key('Escape','Escape',27);
 await hover('.mdp-card[data-path="Revision2-Review/Body.md"]','card-preview');
 await textClick('.mdp-tabs button','Folder');
 await hover('[data-surface="folder"][data-key="f:Revision2-Review/Body.md"]','folder-preview');
 await textClick('.mdp-tabs button','Connections');
 console.log('Connections rows',await js(`[...document.querySelectorAll('.mdp-connections [data-path]')].map(e=>[e.className,e.dataset.path])`));
 await writeFile(dir+'/ui-partial.json',JSON.stringify({mainId,bodyId,subCount,errors:c.errors},null,2));
 assert.deepEqual(c.errors,[]);console.log('Revision 2 UI primary flows passed');
} finally {c.close()}
