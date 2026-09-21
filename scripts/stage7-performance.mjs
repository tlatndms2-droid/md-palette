import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,type} from './stage4-helpers.mjs';
const dir='.artifacts/stage7';
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1700,height:1100,deviceScaleFactor:1,mobile:false});
 await js(`if(!window.s7PerfOriginal)window.s7PerfOriginal={main:${p}.mainLeaf,subs:${p}.subGroups.slice(),last:${p}.subGroup};true`);
 await js(`app.workspace.setActiveLeaf(s7PerfOriginal.main,{focus:true});true`);
 const generated=await js(`(async()=>{if(!app.vault.getAbstractFileByPath('Performance'))await app.vault.createFolder('Performance');for(let i=0;i<2000;i++){const path='Performance/Note'+String(i).padStart(4,'0')+'.md';if(!app.vault.getAbstractFileByPath(path))await app.vault.create(path,'# Note '+i+'\\n\\nPerformance fixture.\\n')}const path='Performance/Main.md',body='# Performance Main\\n\\n'+Array.from({length:2000},(_,i)=>'[[Performance/Note'+String(i).padStart(4,'0')+']]').join('\\n')+'\\n\\n'+Array.from({length:500},(_,i)=>'==강조 '+i+'==\\n\\n- [ ] Task '+i+'\\n\\n블록 '+i+' ^b'+i).join('\\n\\n');if(!app.vault.getAbstractFileByPath(path))await app.vault.create(path,body);const l=app.workspace.getLeaf('tab');await l.openFile(app.vault.getAbstractFileByPath(path));await ${p}.setMain(l);${p}.selectView('link','folder');return {count:2000,metadataPerType:500}})()`);await wait(`${p}.connectedFiles().length===2000`);await pause(700);
 const folder=await js(`(()=>{const t=performance.now();${p}.render();return{renderMs:performance.now()-t,rows:document.querySelectorAll('.mdp-folder-row').length,cards:document.querySelectorAll('.mdp-folder-item').length}})()`);
 await click('[aria-label="현재 폴더에서 검색"]');let t=performance.now();await type('Note1999');await wait(`!!document.querySelector('[data-key="f:Performance/Note1999.md"]')`);const searchMs=performance.now()-t;
 await js(`${p}.selectView('link','card');true`);await pause(400);const card=await js(`(()=>{const t=performance.now();${p}.render();return{renderMs:performance.now()-t,cards:document.querySelectorAll('.mdp-card').length}})()`);
 const typing={};
 for(const mode of ['card','metadata']){
  await js(`(async()=>{const p=${p};p.selectView(${JSON.stringify(mode==='card'?'link':'metadata')},'card');const l=p.mainLeaf;await l.setViewState({...l.getViewState(),state:{...l.getViewState().state,mode:'source',source:true}});await app.workspace.revealLeaf(l);l.view.editor.setCursor(0,0);l.view.editor.scrollIntoView({from:{line:0,ch:0},to:{line:0,ch:0}},true);l.view.editor.focus();return true})()`);await pause(350);
  const samples=[];for(let i=0;i<10;i++){const text=mode+'입력'+Date.now()+i+' ';const start=performance.now();await c.send('Input.insertText',{text});await wait(`${p}.mainLeaf.view.editor.getValue().includes(${JSON.stringify(text)})`);samples.push(performance.now()-start);await pause(50)}
  typing[mode]={samplesMs:samples,maxMs:Math.max(...samples),averageMs:samples.reduce((a,b)=>a+b,0)/samples.length};
 }
 await pause(350);const metadata=await js(`({items:document.querySelectorAll('.mdp-metadata-item').length,heapUsed:performance.memory?.usedJSHeapSize})`);
 await c.screenshot(dir+'/performance.png');
 await js(`(async()=>{await ${p}.mainLeaf.view.save();const old=s7PerfOriginal;await ${p}.setMain(old.main);${p}.subGroups=old.subs;${p}.subGroup=old.last;${p}.sync(false);${p}.selectView('link','folder');return true})()`);
 assert.equal(c.errors.length,0);const result={passed:true,...generated,folder,card,searchRoundTripMs:searchMs,typing,metadata,note:'CDP round-trip samples on this PC, not isolated render latency; no universal threshold claimed'};await writeFile(dir+'/performance-result.json',JSON.stringify(result,null,2));console.log(result);
}catch(e){await c.screenshot(dir+'/performance-failure.png');throw e}finally{c.close()}
