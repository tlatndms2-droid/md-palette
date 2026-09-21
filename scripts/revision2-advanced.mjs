import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {c,p,js,pause,wait,click,tap,key} from './stage4-helpers.mjs';
const dir='.artifacts/revision2',base='Revision2-Review/';
async function textClick(selector,text){await tap(await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing '+${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
async function preview(selector,expected=true){
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:30,y:200});await key('Escape','Escape',27);await pause(200);
 const pt=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+Math.min(30,r.width/2),y:r.y+Math.min(18,r.height/2)}})()`);
 await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Control',code:'ControlLeft',modifiers:2,windowsVirtualKeyCode:17});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt,modifiers:2});
 if(expected){await wait(`!!document.querySelector('.hover-popover')`);await pause(250);assert.ok((await js(`document.querySelector('.hover-popover').innerText`)).includes('Body 참고'))}else{await pause(450);assert.equal(await js(`!!document.querySelector('.hover-popover')`),false)}
 await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Control',code:'ControlLeft',modifiers:0,windowsVirtualKeyCode:17});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:30,y:200});await key('Escape','Escape',27);await pause(200);
}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 const mainId=await js(`${p}.mainLeaf.id`);
 if(await js(`${p}.topView!=='link'`))await textClick('.mdp-tabs button','Link View');
 await textClick('.mdp-tabs button','Connections');
 if(await js(`${p}.connections.collapsed.outgoing`))await click('[data-section="outgoing"] .mdp-connection-header');
 await preview('.mdp-connection-row[data-path="Revision2-Review/Body.md"]');
 await textClick('.mdp-tabs button','Card');
 for(const mode of ['large','medium','small','list','details','tiles']){
  await js(`(()=>{const e=document.querySelector('.mdp-card-controls select');e.focus();return true})()`);
  await key('Home','Home',36);for(let i=0;i<['large','medium','small','list','details','tiles'].indexOf(mode);i++){await js("document.querySelector('.mdp-card-controls select').focus();true");await key('ArrowDown','ArrowDown',40);}await key('Enter','Enter',13);
  await wait(`${p}.cards.display==='${mode}'`);await preview('.mdp-card[data-path="Revision2-Review/Body.md"]');
 }
 await preview('.mdp-card[data-path="Revision2-Review/Body.md"] .mdp-card-more',false);
 await textClick('.mdp-tabs button','Folder');
 await js(`(async()=>{await ${p}.changeFolders(s=>{delete s.view;s.mode='composite';if(!s.folders.some(f=>f.id==='r2-folder'))s.folders.push({id:'r2-folder',name:'가상 폴더 제외',parent:''})});return true})()`);
 console.log('folder state',await js(`${p}.folders`));
 await preview('[data-surface="tree"][data-key="f:Revision2-Review/Body.md"]');
 await preview('[data-surface="tree"][data-key="d:r2-folder"]',false);
 // Native Live Preview Ctrl-click and properties while Sub was active.
 await js(`(async()=>{const l=${p}.mainLeaf;await app.workspace.revealLeaf(l);await l.setViewState({...l.getViewState(),state:{...l.getViewState().state,mode:'source',source:false}});l.containerEl.dataset.revisionMain='true';return true})()`);await pause(400);
 console.log('live links',await js(`[...${p}.mainLeaf.view.containerEl.querySelectorAll('.cm-hmd-internal-link')].map(e=>e.textContent)`));
 await click('.workspace-leaf[data-revision-main] .cm-hmd-internal-link','left',1,2);
 await wait(`app.workspace.getMostRecentLeaf().view.file?.path==='${base}Body.md'`);
 assert.equal(await js(`${p}.mainLeaf.id`),mainId);
 await click('.workspace-leaf[data-revision-main] .metadata-container .internal-link[data-href="Revision2-Review/Property.md"]','left',1,2);
 await wait(`app.workspace.getMostRecentLeaf().view.file?.path==='${base}Property.md'`);
 assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');
 // Ordinary document links preserve Obsidian's original destination.
 await js(`(async()=>{const l=app.workspace.getLeaf('tab');await l.openFile(app.vault.getAbstractFileByPath('${base}Other.md'));await l.setViewState({...l.getViewState(),state:{...l.getViewState().state,mode:'preview'}});l.containerEl.dataset.revisionOrdinary='true';window.revisionOrdinaryId=l.id;return true})()`);await pause(300);
 await click('[data-revision-ordinary] .markdown-preview-view .internal-link');
 assert.equal(await js(`app.workspace.getMostRecentLeaf().id`),await js('window.revisionOrdinaryId'));assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');
 // Native browser menu dispatch, without opening the user's browser during testing.
 await textClick('.mdp-tabs button','Metadata View');await wait(`document.querySelectorAll('.mdp-meta-links').length===1`);
 await js(`window.r2Shell=require('electron').shell;window.r2Original=window.r2Shell.openExternal;window.r2Urls=[];window.r2Shell.openExternal=async u=>{window.r2Urls.push(u)};true`);
 try{await textClick('.mdp-meta-links .mdp-metadata-text','https://example.com');await textClick('.menu-item-title','기본 브라우저로 열기');await wait(`window.r2Urls.length===1`);assert.equal(await js('window.r2Urls[0]'),'https://example.com/')}finally{await js('window.r2Shell.openExternal=window.r2Original;true')}
 // Leave a web-only Sub to verify its role and icon after process restart.
 await js(`(()=>{for(const l of [...${p}.subGroup.children])if(l.getViewState().type!=='webviewer')l.detach();app.workspace.revealLeaf(${p}.subGroup.children[0]);${p}.flushState();app.workspace.requestSaveLayout();return true})()`);await pause(1300);
 const snapshot=await js(`({main:${p}.mainFile.path,mainId:${p}.mainLeaf.id,subId:${p}.subGroup.id,subTypes:${p}.subGroup.children.map(l=>l.getViewState().type),cards:${p}.cards,folders:${p}.foldersByMain,connections:${p}.connections})`);
 assert.deepEqual(snapshot.subTypes,['webviewer']);await writeFile(dir+'/before-restart.json',JSON.stringify(snapshot,null,2));
 const vault=await js('app.vault.adapter.getBasePath()'),fixtures=[];
 for(const name of ['Main.md','Body.md','Property.md','Other.md','Board.canvas','Picture.svg'])fixtures.push({path:base+name,sha256:createHash('sha256').update(await readFile(vault+'/'+base+name)).digest('hex')});
 await writeFile(dir+'/fixtures.json',JSON.stringify(fixtures));assert.deepEqual(c.errors,[]);
 await writeFile(dir+'/ui-result.json',JSON.stringify({passed:true,version:'0.0.10',nativePreviewModes:6,mainBodyProperties:true,livePreview:true,ordinaryUnchanged:true,labelDeletePreservesFiles:true,urlOnly:true,webSub:true,externalBrowserDispatchOnly:true,errors:c.errors},null,2));console.log('Revision 2 advanced UI passed');
}finally{c.close()}
