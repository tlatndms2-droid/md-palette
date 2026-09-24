import assert from 'node:assert/strict';
import {readFile,writeFile,rmdir,readdir} from 'node:fs/promises';
import {c,p,js,pause,click,textClick,key,wait,point,tap} from './stage4-helpers.mjs';
const dir='.artifacts/link-explorer',checks=[];const pass=s=>{checks.push(s);console.log('PASS',s)};
const original=JSON.parse(await readFile(dir+'/fixture-originals.json','utf8'));
async function startDrag(selector){
 await js('window.getSelection().removeAllRanges();true');
 const from=await point(selector);await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...from});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...from});
 for(let n=1;n<=12;n++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:from.x-n*4,y:from.y+n*2});
 for(let n=0;n<20&&!c.dragEvents.length;n++)await pause(50);
 assert.ok(c.dragEvents.length,'Native drag started');return c.dragEvents.at(-1).data;
}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await js(`app.vault.modify(app.vault.getAbstractFileByPath('나의 글쓰기.md'),${JSON.stringify(original['나의 글쓰기.md'])}).then(()=>true)`);
 await wait(`!${p}.linkedPaths().has('Link-Perf/부모.md')`);
 await js(`(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath('초안.md'));window.dropLeaf=${p}.subGroup.children[${p}.subGroup.currentTab];await dropLeaf.setViewState({...dropLeaf.getViewState(),state:{...dropLeaf.getViewState().state,mode:'source',source:true}});${p}.explorer.sources[${p}.mainFile.path]='산책 메모.md';${p}.selectView('metadata');return true})()`);
 await wait(`!!document.querySelector('.mdp-meta-highlights')`);
 const target=await js(`(()=>{const e=dropLeaf.view.editor;const r=e.cm.coordsAtPos(0);return{x:r.left+2,y:(r.top+r.bottom)/2}})()`);
 const data=await startDrag('.mdp-meta-highlights .mdp-metadata-text');
 for(const type of ['dragEnter','dragOver','drop'])await c.send('Input.dispatchDragEvent',{type,...target,data});
 await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...target});await c.send('Input.setInterceptDrags',{enabled:false});
 await wait(`!!document.querySelector('.menu-item-title')`);console.log('DROP',await js(`({menu:[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent),source:${p}.reuseDrag.source?.kind,target:${p}.reuseDrag.markedTarget?.path})`));await textClick('.menu-item-title','텍스트 삽입');await pause(350);
 assert.ok((await js('dropLeaf.view.editor.getValue()')).includes('같은 길도'));
 await js(`dropLeaf.view.editor.setValue(${JSON.stringify(original['초안.md'])});dropLeaf.view.save().then(()=>true)`);
 pass('Native drag reuses selected descendant highlight in Sub and restores target');
 // Live source refresh, stale-edit rejection, and source deletion fallback.
 await js(`app.vault.modify(app.vault.getAbstractFileByPath('산책 메모.md'),${JSON.stringify(original['산책 메모.md']+'\n==새로 추가한 강조==\n')}).then(()=>true)`);
 await wait(`document.querySelector('.mdp-meta-highlights')?.parentElement.textContent.includes('새로 추가한 강조')`);
 const rejected=await js(`(async()=>{try{await ${p}.patchMain(app.vault.getAbstractFileByPath('산책 메모.md'),${JSON.stringify(original['산책 메모.md'])},0,1,'X');return false}catch{return true}})()`);assert.equal(rejected,true);
 await js(`app.vault.modify(app.vault.getAbstractFileByPath('산책 메모.md'),${JSON.stringify(original['산책 메모.md'])}).then(()=>true)`);
 pass('External edits refresh selected descendant and stale writes are rejected');
 // Cycle guard through real expansion controls at depth 5.
 await js(`${p}.explorer.depth=5;${p}.selectView('link','card');true`);await pause(250);
 for(let n=0;n<12;n++){
  const selector='.mdp-card-grid .mdp-link-expand[aria-expanded="false"]';
  if(!await js(`!!document.querySelector(${JSON.stringify(selector)})`))break;await click(selector);
 }
 const paths=await js(`[...document.querySelectorAll('.mdp-card-grid [data-link-path]')].map(e=>e.dataset.linkPath)`);
 assert.ok(paths.length<40);assert.ok(!paths.includes('나의 글쓰기.md'));
 await c.screenshot(dir+'/cycle-depth5.png');pass('Five-level exploration stops ancestry cycles without losing cross-parent occurrences');
 // Actual Canvas placement through a descendant's menu.
 await js(`(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath('자료.canvas'),'','normal-group');window.canvasLeaf=app.workspace.getLeavesOfType('canvas').find(l=>l.view.file.path==='자료.canvas');${p}.explorer.depth=2;${p}.selectView('link','card');return true})()`);
 await js(`(async()=>{canvasLeaf.view.canvas.setData({nodes:[],edges:[]});await canvasLeaf.view.save();return true})()`);await pause(400);
 await click('.mdp-card[data-path="관찰의 기록.md"] + .mdp-link-branch > [data-link-path="산책 메모.md"] .mdp-linked-name','right');await textClick('.menu-item-title','현재 Canvas에 삽입…');
 await wait(`!!document.querySelector('.mdp-canvas-insert-bar')`);
 const center=await js(`(()=>{const r=canvasLeaf.view.canvas.wrapperEl.getBoundingClientRect();return{x:r.x+r.width*.5,y:r.y+r.height*.65}})()`);await tap(center);await pause(350);
 assert.equal(await js(`canvasLeaf.view.canvas.getData().nodes[0]?.file`),'산책 메모.md');
 await js(`(async()=>{canvasLeaf.view.canvas.setData({nodes:[],edges:[]});await canvasLeaf.view.save();await app.vault.modify(canvasLeaf.view.file,${JSON.stringify(original['자료.canvas'])});return true})()`);
 pass('Descendant context menu places the original file on Canvas; Canvas restored');
 // Isolated temporary fanout. No synthetic graph injection: real files and metadata cache.
 await js(`(async()=>{if(!app.vault.getAbstractFileByPath('Link-Perf'))await app.vault.createFolder('Link-Perf');return true})()`);
 for(let batch=0;batch<6;batch++)await js(`(async()=>{for(let n=${batch*50};n<${(batch+1)*50};n++){const path='Link-Perf/자료'+n+'.md',text='# 자료 '+n+'\\n==성능 자료 '+n+'==\\n',f=app.vault.getAbstractFileByPath(path);if(f){if(await app.vault.read(f)!==text)throw Error('Changed fixture')}else await app.vault.create(path,text)}return true})()`);
 const rootText='# 대량 연결\n'+Array.from({length:300},(_,n)=>'[[Link-Perf/자료'+n+']]').join('\n');
 await js(`(async()=>{if(!app.vault.getAbstractFileByPath('Link-Perf/부모.md'))await app.vault.create('Link-Perf/부모.md',${JSON.stringify(rootText)});await app.vault.modify(app.vault.getAbstractFileByPath('나의 글쓰기.md'),${JSON.stringify(original['나의 글쓰기.md']+'\n[[Link-Perf/부모]]\n')});return true})()`);
 await wait(`${p}.linkedPaths().has('Link-Perf/자료299.md')`);
 await js(`${p}.explorer.expanded=${p}.explorer.expanded.filter(k=>!k.includes('Link-Perf/'));${p}.selectView('link','card');true`);await pause(200);
 const start=performance.now();await click('.mdp-card[data-path="Link-Perf/부모.md"] .mdp-link-expand');
 const elapsed=performance.now()-start;
 assert.equal(await js(`document.querySelector('.mdp-card[data-path="Link-Perf/부모.md"]').nextElementSibling.querySelectorAll('.mdp-linked-occurrence').length`),50);
 await click('.mdp-card[data-path="Link-Perf/부모.md"] + .mdp-link-branch .mdp-links-more');
 assert.equal(await js(`document.querySelector('.mdp-card[data-path="Link-Perf/부모.md"]').nextElementSibling.querySelectorAll('.mdp-linked-occurrence').length`),100);
 const responsiveness=await js(`new Promise(resolve=>{const start=performance.now();requestAnimationFrame(()=>resolve(performance.now()-start))})`);
 // Actual editor typing while graph is populated.
 await js(`app.workspace.setActiveLeaf(dropLeaf,{focus:false});dropLeaf.view.editor.focus();true`);await c.send('Input.insertText',{text:'반응 확인'});await pause(100);
 assert.ok((await js('dropLeaf.view.editor.getValue()')).includes('반응 확인'));
 await js(`dropLeaf.view.editor.setValue(${JSON.stringify(original['초안.md'])});dropLeaf.view.save().then(()=>true)`);
 await js(`app.vault.modify(app.vault.getAbstractFileByPath('나의 글쓰기.md'),${JSON.stringify(original['나의 글쓰기.md'])}).then(()=>true)`);
 for(let batch=0;batch<6;batch++)await js(`(async()=>{for(let n=${batch*50};n<${(batch+1)*50};n++){const f=app.vault.getAbstractFileByPath('Link-Perf/자료'+n+'.md');if(f)await app.vault.delete(f)}return true})()`);
 await js(`(async()=>{await app.vault.delete(app.vault.getAbstractFileByPath('Link-Perf/부모.md'));return true})()`);
 const sandbox=await js('app.vault.adapter.getBasePath()');assert.ok(sandbox.endsWith('MDPalette-Link-Sandbox-20260924'));
 assert.deepEqual(await readdir(sandbox+'/Link-Perf'),[]);await rmdir(sandbox+'/Link-Perf');
 pass('300-child fanout renders 50 at a time; more button and editor typing work; temporary fixtures removed');
 await js(`${p}.explorer.expanded=${p}.explorer.expanded.filter(k=>!k.includes('Link-Perf/'));${p}.explorer.depth=2;${p}.explorer.sources[${p}.mainFile.path]='산책 메모.md';${p}.selectView('metadata');${p}.flushState();true`);await pause(400);
 for(const [path,text] of Object.entries(original)){const actual=await js(`app.vault.read(app.vault.getAbstractFileByPath(${JSON.stringify(path)}))`);if(path.endsWith('.canvas'))assert.deepEqual(JSON.parse(actual),JSON.parse(text));else assert.equal(actual,text,path);}
 assert.equal(c.errors.length,0);
 await writeFile(dir+'/advanced-result.json',JSON.stringify({version:'0.1.11',passed:true,checks,fanout:300,firstExpandIncluding180msClickWait:elapsed,nextAnimationFrameMs:responsiveness},null,2));
}finally{await c.send('Input.setInterceptDrags',{enabled:false}).catch(()=>{});c.close()}
