import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,textClick,key,type,view,sort,tap} from './stage4-helpers.mjs';
const dir='.artifacts/revision',base='Revision-Review/',g="app.workspace.getLeavesOfType('md-palette-sidebar')[0].view.connections.nativeGraph.view";
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await textClick('.mdp-link-tabs button','Folder');
 const order=await js(`${p}.folders.order`);
 for(const name of ['이름','유형','수정 날짜','크기','내림차순','오름차순','사용자 지정'])await sort(name);
 assert.deepEqual(await js(`${p}.folders.order`),order);
 for(const name of ['큰 아이콘','중간 아이콘','작은 아이콘','목록','자세히','타일']){
  await view(name);assert.equal(await js(`document.querySelectorAll('.mdp-folder-grid .mdp-file-title').length`),1);
  const fit=await js(`(()=>{const e=document.querySelector('.mdp-folder-grid .mdp-file-card'),t=e.querySelector('.mdp-file-title'),a=e.getBoundingClientRect(),b=t.getBoundingClientRect();return b.x>=a.x&&b.right<=a.right+1&&b.y>=a.y})()`);assert.ok(fit,name);
 }
 await view('중간 아이콘');
 // Stale modal must not create a folder in the next Main.
 await click('.mdp-tree-root','right');await textClick('.menu-item-title','새 가상 폴더 만들기');await type('잘못된 문서에 저장 금지');
 await js(`(async()=>{const p=${p};await p.mainGroup.children[p.mainGroup.currentTab].openFile(app.vault.getAbstractFileByPath('${base}Main-B.md'));return true})()`);
 const before=await js(`JSON.stringify(${p}.foldersByMain)`);await textClick('.modal button','저장');await pause(300);assert.equal(await js(`JSON.stringify(${p}.foldersByMain)`),before);await key('Escape','Escape',27);
 await js(`(async()=>{const p=${p};await p.mainGroup.children[p.mainGroup.currentTab].openFile(app.vault.getAbstractFileByPath('${base}Main-A.md'));return true})()`);await pause(300);
 // File and Main renames update every document's organization.
 const ids=JSON.parse(await readFile(dir+'/ui-result.json','utf8')).ids;
 await js(`app.vault.rename(app.vault.getAbstractFileByPath('${base}자료.md'),'${base}자료-renamed.md').then(()=>true)`);
 for(const [main,id]of [['Main-A.md',ids.a],['Main-B.md',ids.b]])assert.equal(await js(`${p}.foldersByMain['${base+main}'].positions['${base}자료-renamed.md']`),id);
 await js(`app.vault.rename(app.vault.getAbstractFileByPath('${base}자료-renamed.md'),'${base}자료.md').then(()=>true)`);
 await js(`app.vault.rename(app.vault.getAbstractFileByPath('${base}Main-A.md'),'${base}Main-A-renamed.md').then(()=>true)`);assert.equal(await js(`${p}.folders.positions['${base}자료.md']`),ids.a);assert.equal(await js(`!!${p}.foldersByMain['${base}Main-A.md']`),false);
 await js(`app.vault.rename(app.vault.getAbstractFileByPath('${base}Main-A-renamed.md'),'${base}Main-A.md').then(()=>true)`);
 // Expected injected failures are caught here, never sent to the user as real failures.
 const transactions=await js(`(async()=>{const p=${p},main=p.mainFile,originalSave=p.saveData,originalAdd=p.addConnection;const before=JSON.stringify(p.foldersByMain);let saveFailed=false,linkFailed=false,mainChanged=false;
 try{p.saveData=async()=>{throw Error('expected storage failure')};try{await p.changeFolders(s=>s.folders.push({id:'fail',name:'fail',parent:''}))}catch{saveFailed=true}}finally{p.saveData=originalSave}if(JSON.stringify(p.foldersByMain)!==before)throw Error('save failure changed organization');
 const spare=app.vault.getAbstractFileByPath('Folder-Review/Gamma.md');try{p.addConnection=async()=>{throw Error('expected link failure')};try{await p.addFolderConnection(main,spare,'${ids.a}')}catch{linkFailed=true}}finally{p.addConnection=originalAdd}if(JSON.stringify(p.foldersByMain)!==before)throw Error('link failure left placement');
 let first=true;try{p.saveData=async data=>{await originalSave.call(p,data);if(first){first=false;await p.mainGroup.children[p.mainGroup.currentTab].openFile(app.vault.getAbstractFileByPath('${base}Main-B.md'))}};try{await p.addFolderConnection(main,spare,'${ids.a}')}catch{mainChanged=true}}finally{p.saveData=originalSave;await p.mainGroup.children[p.mainGroup.currentTab].openFile(main)}if(JSON.stringify(p.foldersByMain)!==before)throw Error('Main change contaminated organization');return {saveFailed,linkFailed,mainChanged}})()`);assert.deepEqual(transactions,{saveFailed:true,linkFailed:true,mainChanged:true});
 await pause(500);await textClick('.mdp-link-tabs button','Connections');await wait(`!!${g}?.renderer.px`);
 if(await js(`${p}.connections.collapsed.outgoing`))await click('[data-section=outgoing] .mdp-connection-header');
 await click('[data-section=outgoing] [data-path="Revision-Review/자료.md"]','right');assert.deepEqual(await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`),['Sub Space에서 열기']);await textClick('.menu-item-title','Sub Space에서 열기');await wait(`${p}.subGroup.children.some(l=>l.view.file?.path==='${base}자료.md')`);
 // Obsidian native graph: click the actual Canvas node, not the wrapped handler.
 await js(`${g}.engine.setOptions({ ...${g}.engine.getOptions(), showAttachments:true });true`);await pause(1200);
 await wait(`${g}.renderer.nodes.some(n=>n.id==='${base}정리.canvas')`);
 const pt=await js(`(()=>{const r=${g}.renderer,n=r.nodes.find(n=>n.id==='${base}정리.canvas'),b=r.interactiveEl.getBoundingClientRect();return{x:b.x+(r.panX+n.x*r.scale)/devicePixelRatio,y:b.y+(r.panY+n.y*r.scale)/devicePixelRatio}})()`);
 await tap(pt);await wait(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file?.path==='${base}정리.canvas'`);
 await tap(pt,'right');assert.deepEqual(await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`),['Sub Space에서 열기']);await key('Escape','Escape',27);
 // Picker and native tab context menu both accept image/Canvas files.
 await js(`app.commands.executeCommandById('md-palette:open-sub');true`);await type('Revision-Review/사진.png');await wait(`!!document.querySelector('.suggestion-item')`);await click('.suggestion-item');await wait(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file?.path==='${base}사진.png'`);
 await js(`${p}.subGroup.children[${p}.subGroup.currentTab].tabHeaderEl.dataset.nativeTarget='true';true`);await click('[data-native-target="true"]','right');const titles=await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`);assert.ok(titles.includes('Sub Space에서 열기')&&!titles.some(t=>t.includes('Reference')||t.includes('메인 / 서브')));await key('Escape','Escape',27);
 await textClick('.mdp-link-tabs button','Folder');
 assert.deepEqual(c.errors,[]);await writeFile(dir+'/checks-result.json',JSON.stringify({passed:true,allSortOptions:true,allDisplayModes:true,staleModalProtected:true,renamePreserved:true,transactions,connectionsAndNativeGraph:true,pickerAndNativeMenu:true,errors:c.errors},null,2));console.log('PASS display modes, sorts, stale modal, rename, rollback, Connections/native graph and file picker');
}finally{c.close()}
