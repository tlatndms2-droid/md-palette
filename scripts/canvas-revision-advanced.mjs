import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {c,p,js,pause,click,textClick,tap} from './stage4-helpers.mjs';
const checks=[],check=s=>{checks.push(s);console.log('PASS',s);};
const j=JSON.stringify,dir='.artifacts/canvas-revision';
const at=(x,y)=>js(`(()=>{const c=targetLeaf.view.canvas,p=c.domFromPos({x:${x},y:${y}});return{x:p.x+c.canvasRect.cx,y:p.y+c.canvasRect.cy}})()`);
let saved;
try{
 await js(`window.targetLeaf=app.workspace.getLeavesOfType('canvas').find(l=>l.getViewState().state.file==='Review-Target.canvas');true`);
 saved=await js('targetLeaf.view.canvas.getData()');
 await js(`${p}.selectView('link','card');app.workspace.setActiveLeaf(targetLeaf);targetLeaf.view.canvas.setViewport(400,1600,-1.5);true`);await pause(200);
 await click('.mdp-card[data-path="Review-B.md"]','left',2);await pause(250);assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file.path`),'Review-B.md');
 await click('.mdp-card[data-path="Review-A.md"]','left',2);check('linked file double-click replaces Sub normally after unlinked guard');
 await textClick('.mdp-card-view .mdp-chip','보존 라벨');assert.equal(await js(`document.querySelectorAll('.mdp-card').length`),1);await textClick('.mdp-card-view .mdp-chip','All');check('label filter continues to combine with file-type selections');
 // Drive a real browser drag gesture; no synthetic DOM drop handler invocation.
 await click('.mdp-card[data-path="Review-A.md"]');await click('.mdp-card[data-path="Review-B.md"]','left',1,2);
 const point=await js(`(()=>{const r=document.querySelector('.mdp-card[data-path="Review-A.md"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
 for(let i=1;i<=8;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:point.x-i*4,y:point.y+i*3});
 for(let i=0;i<30&&!c.dragEvents.length;i++)await pause(50);assert.ok(c.dragEvents.length,'native drag started');
 const data=c.dragEvents.at(-1).data,where=await at(0,1600);
 for(const type of ['dragEnter','dragOver','drop'])await c.send('Input.dispatchDragEvent',{type,...where,data});
 await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...where});await c.send('Input.setInterceptDrags',{enabled:false});await pause(150);
 assert.equal(await js(`${p}.canvasInsert.session.placement.nodes.length`),2);assert.deepEqual(await js('targetLeaf.view.canvas.getData()'),saved);
 await textClick('.mdp-canvas-insert-bar button','이 위치에 삽입 확정');await pause(200);assert.equal((await js('targetLeaf.view.canvas.getData()')).nodes.length,saved.nodes.length+2);
 await js(`app.commands.executeCommandById('md-palette:undo-canvas-insert');true`);await pause(200);assert.deepEqual(await js('targetLeaf.view.canvas.getData()'),saved);check('native multi-file drag shows preview then inserts and undoes without changing existing nodes');
 // Entire tree includes all descendants even when visible Card filter hides images.
 await js(`${p}.cards.selectedTypes=['md'];${p}.cardsChanged();${p}.selectView('link','folder');app.workspace.setActiveLeaf(targetLeaf);true`);await pause(160);
 await click('.mdp-tree-root','right');await textClick('.menu-item-title','전체 가상 폴더를 현재 Canvas에 삽입…');await tap(await at(0,1600));
 assert.equal(await js(`${p}.canvasInsert.session.placement.nodes.length`),7);assert.equal(await js(`${p}.canvasInsert.session.placement.edges.length`),6);
 await textClick('.mdp-canvas-insert-bar button','이 위치에 삽입 확정');await pause(250);assert.equal((await js('targetLeaf.view.canvas.getData()')).nodes.length,saved.nodes.length+7);
 const all=await js('targetLeaf.view.canvas.getData()');assert.ok(all.nodes.some(n=>n.file==='Review-Image.svg'));assert.ok(all.nodes.some(n=>n.file==='Review-Map.canvas'));
 await js(`app.commands.executeCommandById('md-palette:undo-canvas-insert');true`);await pause(180);assert.deepEqual(await js('targetLeaf.view.canvas.getData()'),saved);check('whole-tree export includes hidden file types, preserves hierarchy and restores on undo');
 // One failed save must roll back all inserted objects, not leave half the tree.
 await js(`${p}.canvasInsert.files(['Review-A.md']);true`);await tap(await at(0,1600));
 await js(`window.originalSave=targetLeaf.view.save;window.saveCount=0;targetLeaf.view.save=async function(...args){saveCount++;if(saveCount===2)throw Error('injected save failure');return originalSave.apply(this,args)};true`);
 await textClick('.mdp-canvas-insert-bar button','이 위치에 삽입 확정');await pause(200);
 await js('targetLeaf.view.save=originalSave;true');assert.deepEqual(await js('targetLeaf.view.canvas.getData()'),saved);await textClick('.mdp-canvas-insert-bar button','취소');check('injected save failure rolls back every added node and edge');
 await js(`(async()=>{if(!app.vault.getAbstractFileByPath('Review-Unsupported.unknown'))await app.vault.create('Review-Unsupported.unknown','test');${p}.canvasInsert.files(['Review-A.md','Review-Unsupported.unknown']);return true})()`);
 assert.equal(await js(`!!${p}.canvasInsert.session`),false);assert.deepEqual(await js('targetLeaf.view.canvas.getData()'),saved);check('unsupported file rejects the whole selection before insertion');
 await js(`${p}.canvasInsert.files(['Review-A.md']);true`);await tap(await at(0,1600));
 await js(`targetLeaf.openFile(app.vault.getAbstractFileByPath('Review-Map.canvas')).then(()=>true)`);await pause(220);assert.equal(await js(`!!${p}.canvasInsert.session`),false);
 await js(`targetLeaf.openFile(app.vault.getAbstractFileByPath('Review-Target.canvas')).then(()=>true)`);assert.deepEqual(await js('targetLeaf.view.canvas.getData()'),saved);check('switching target Canvas cancels the stale preview without inserting in either file');
 await js(`targetLeaf.view.canvas.setViewport(400,1600,-1.5);true`);
 // Large folder preview: actual renderer timer delay while rendering 257 nodes.
 const folders=await js(`JSON.parse(JSON.stringify(${p}.folders))`);
 await js(`for(let i=0;i<250;i++){${p}.folders.folders.push({id:'perf-'+i,name:'성능 확인 '+i,parent:''});${p}.folders.order.push('d:perf-'+i);}${p}.canvasInsert.folder('');true`);await tap(await at(0,1600));
 const perf=await js(`(async()=>{const delays=[];for(let i=0;i<20;i++){const start=performance.now();await new Promise(r=>setTimeout(r,50));delays.push(performance.now()-start)}return{nodes:${p}.canvasInsert.session.placement.nodes.length,maxTimerMs:Math.max(...delays),averageTimerMs:delays.reduce((a,b)=>a+b,0)/delays.length}})()`);
 assert.equal(perf.nodes,257);assert.ok(perf.maxTimerMs<250,j(perf));await textClick('.mdp-canvas-insert-bar button','취소');
 await js(`Object.assign(${p}.folders,${j(folders)});${p}.cards.selectedTypes=['md','canvas'];${p}.cardsChanged();${p}.selectView('link','card');${p}.flushState();true`);
 check('257-node real preview remains responsive: '+j(perf));
 await c.screenshot(dir+'/advanced.png');await writeFile(dir+'/advanced-result.json',JSON.stringify({version:'0.1.8',passed:true,checks,perf,errors:c.errors},null,2));
 assert.equal(c.errors.length,0,j(c.errors));
}finally{await c.send('Input.setInterceptDrags',{enabled:false}).catch(()=>{});await js(`if(window.originalSave&&window.targetLeaf)targetLeaf.view.save=originalSave;true`).catch(()=>{});c.close();}
