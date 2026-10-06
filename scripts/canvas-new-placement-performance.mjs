import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { c,p,js,pause,wait } from './stage4-helpers.mjs';
const root='CanvasMain-Review/Performance-015',j=JSON.stringify;
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 assert.ok((await js('app.vault.adapter.getBasePath()')).endsWith('MDPalette-Swap-Sandbox-20261006'));
 await js(`window.cmPerfBaseline={main:${p}.mainLeaf,sub:${p}.subGroup,folders:structuredClone(${p}.foldersByMain),cards:structuredClone(${p}.cards),explorer:structuredClone(${p}.explorer),top:${p}.topView,link:${p}.linkView};true`);
 const notes=Array.from({length:250},(_,i)=>[`${root}/Note-${i}.md`,`---\nlink note: "[[${root}/Large.canvas]]"\n---\n# Note ${i}\n${Array.from({length:40},(_,n)=>'- [ ] Task '+n).join('\n')}`]);
 await js(`(async()=>{await app.vault.createFolder(${j(root)});await app.vault.create(${j(root+'/Large.canvas')},JSON.stringify({nodes:[],edges:[]}));for(const[path,body]of ${j(notes)})await app.vault.create(path,body);return true})()`);
 await wait(`Object.values(app.metadataCache.resolvedLinks).filter(v=>v[${j(root+'/Large.canvas')}]).length===250`);
 const result=await js(`(async()=>{window.cmPerfLeaf=app.workspace.createLeafBySplit(${p}.mainLeaf,'horizontal');await cmPerfLeaf.openFile(app.vault.getAbstractFileByPath(${j(root+'/Large.canvas')}));const start=performance.now();await ${p}.setMain(cmPerfLeaf);${p}.selectView('link','card');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const firstPaintMs=performance.now()-start;let last=performance.now(),maxFrameGapMs=0;await new Promise(resolve=>{const end=last+900;const tick=now=>{maxFrameGapMs=Math.max(maxFrameGapMs,now-last);last=now;if(now>=end)resolve();else requestAnimationFrame(tick)};requestAnimationFrame(tick)});${p}.explorer.sources[${j(root+'/Large.canvas')}]=${j(root+'/Note-0.md')};${p}.selectView('metadata');return{firstPaintMs,maxFrameGapMs,linked:${p}.connectedFiles().length}})()`);
 await js(`(()=>{const input=document.querySelector('.mdp-metadata-search input');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
 await wait(`document.querySelectorAll('.mdp-metadata-section[data-kind="tasks"] input[type="checkbox"]').length===40`);
 const input=await js(`(()=>{const e=document.querySelector('.mdp-metadata-search input');const r=e.getBoundingClientRect();return{x:r.x+20,y:r.y+r.height/2}})()`);
 await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...input});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...input});
 await c.send('Input.insertText',{text:'Task 12'});await pause(200);assert.equal(await js(`document.querySelector('.mdp-metadata-search input').value`),'Task 12');
 assert.equal(await js(`document.querySelectorAll('.mdp-metadata-section[data-kind="tasks"] input[type="checkbox"]').length`),1);
 assert.equal(result.linked,250);assert.ok(result.firstPaintMs<2000);assert.ok(result.maxFrameGapMs<1000);
 await js(`(async()=>{await ${p}.setMain(cmPerfBaseline.main);${p}.assignSub(cmPerfBaseline.sub);cmPerfLeaf.detach();${p}.foldersByMain=cmPerfBaseline.folders;${p}.cards=cmPerfBaseline.cards;${p}.explorer=cmPerfBaseline.explorer;${p}.selectView(cmPerfBaseline.top,cmPerfBaseline.link);await app.vault.delete(app.vault.getAbstractFileByPath(${j(root)}),true);return true})()`);
 assert.deepEqual(c.errors,[]);await writeFile('.artifacts/canvas-new-placement/performance.json',JSON.stringify({passed:true,version:'0.1.15',notes:250,tasksPerNote:40,typingFilterPassed:true,...result,errors:c.errors},null,2));console.log(result);
}finally{c.close()}
