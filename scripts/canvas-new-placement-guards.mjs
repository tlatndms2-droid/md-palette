import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {c,p,js,pause,wait,textClick,click,type,key,tap} from './stage4-helpers.mjs';
const dir='.artifacts/canvas-new-placement',j=JSON.stringify,checks=[];
const prefix='CanvasPlacement015-'+(process.env.PLACEMENT_TEST_SUFFIX||'');
const pass=s=>{checks.push(s);console.log('PASS',s)};
async function create(name,folder=false){
 await textClick('.mdp-tabs button',folder?'Folder':'Card');
 if(folder){if(!await js(`!!document.querySelector('.mdp-tree-root')`)){await pause(500);await textClick('.mdp-tabs button','Folder');}await wait(`!!document.querySelector('.mdp-tree-root')`);await click('.mdp-tree-root','right');await textClick('.menu-item-title','새 링크 파일 추가');}else await textClick('button','+ 새 링크 파일 추가');
 await click('[aria-label="새 링크 파일 형식"]');await key('End','End',35);await key('Enter','Enter',13);
 await click('[aria-label="새 링크 파일 이름"]');await type(prefix+name);await textClick('.modal button','만들고 위치 선택');await wait(`!document.querySelector('.modal')`);await wait(`!!document.querySelector('.mdp-canvas-ghost')`);
 return prefix+name+'.canvas';
}
async function point(){const pt=await js(`(()=>{const r=${p}.mainLeaf.view.canvas.wrapperEl.getBoundingClientRect();return{x:r.x+r.width*.6,y:r.y+r.height*.62}})()`);await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt});await pause(100);return pt;}
const data=()=>js(`${p}.mainLeaf.view.canvas.getData()`);
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1800,height:1050,deviceScaleFactor:1,mobile:false});
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
 const before=await data();
 await create('SaveFailure');
 await js(`window.guardView=${p}.mainLeaf.view;window.guardSave=guardView.save;window.guardCount=0;guardView.save=async function(){if(++guardCount===2)throw Error('Injected save failure');return guardSave.call(this)};true`);
 await tap(await point());await pause(300);assert.deepEqual(await data(),before);assert.ok(await js(`!!document.querySelector('.mdp-canvas-preview')`));
 await js(`guardView.save=guardSave;true`);await textClick('.mdp-canvas-insert-bar button','취소');assert.deepEqual(await data(),before);pass('save failure restores Main, preview remains retryable; Cancel button abandons placement');
 const folder=await create('FolderFailure',true),folders=await js(`${p}.folders`);
 await js(`window.guardFolders=${p}.changeFolders;${p}.changeFolders=async()=>{throw Error('Injected folder save failure')};true`);
 await tap(await point());await pause(300);assert.deepEqual(await data(),before);assert.deepEqual(await js(`${p}.folders`),folders);
 await js(`${p}.changeFolders=guardFolders;true`);await key('Escape','Escape',27);pass('folder persistence failure rolls card back and preserves folder state');
 const undo=await create('Undo');await tap(await point());await wait(`!document.querySelector('.mdp-canvas-preview')`);assert.equal((await data()).nodes.length,before.nodes.length+1);
 await js(`app.commands.executeCommandById('md-palette:undo-canvas-insert');true`);await pause(350);assert.deepEqual(await data(),before);pass('existing undo command removes only placed B card, preserving empty B file');
 const stale=await create('Stale');const original=await js(`${p}.mainLeaf.id`);
 await js(`(async()=>{window.guardMain=${p}.mainLeaf;const leaf=app.workspace.getLeavesOfType('markdown').find(l=>l.getViewState().state.file==='Swap-Review/A.md');await ${p}.setMain(leaf);return true})()`);await wait(`!document.querySelector('.mdp-canvas-preview')`);
 await js(`${p}.setMain(guardMain).then(()=>true)`);assert.equal(await js(`${p}.mainLeaf.id`),original);assert.deepEqual(await data(),before);pass('changing Main cancels pending placement instead of writing to a different Canvas');
 for(const name of ['SaveFailure','FolderFailure','Undo','Stale'])assert.deepEqual(JSON.parse(await readFile(`${vault}/${prefix}${name}.canvas`,'utf8')),{nodes:[],edges:[]});
 await js(`(async()=>{${p}.selectView('link','card');${p}.flushState();await ${p}.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1600);
 const expected=JSON.parse(await readFile(`${dir}/expected.json`,'utf8'));expected.folders=await js(`${p}.folders`);await writeFile(`${dir}/expected.json`,j(expected));
 assert.deepEqual(c.errors,[]);await writeFile(`${dir}/guards.json`,j({passed:true,version:'0.1.15',checks,errors:c.errors}));
}finally{
 await js(`if(window.guardView&&window.guardSave)guardView.save=guardSave;if(window.guardFolders)${p}.changeFolders=guardFolders;true`).catch(()=>{});c.close();
}
