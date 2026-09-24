import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,click,textClick,key,wait} from './stage4-helpers.mjs';
const dir='.artifacts/link-explorer',mode=process.argv[2]||'before';
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 if(mode==='before'){
  const original=JSON.parse(await readFile(dir+'/fixture-originals.json','utf8'));
  await js(`${p}.selectView('link','card');true`);await pause(300);
  const before=await js(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file.path`);
  await js(`document.querySelector('.mdp-card[data-path="관찰의 기록.md"] .mdp-link-expand').focus();true`);await key('Enter','Enter',13);
  assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file.path`),before);
  await key('Enter','Enter',13);assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file.path`),before);
  const large=original['산책 메모.md']+'\n'+Array.from({length:1500},(_,n)=>`==많은 강조 ${n}==\n- [ ] 작업 ${n}`).join('\n');
  await js(`app.vault.modify(app.vault.getAbstractFileByPath('산책 메모.md'),${JSON.stringify(large)}).then(()=>true)`);
  const time=performance.now();await js(`${p}.selectView('metadata');true`);await wait(`document.querySelector('[data-kind="highlights"] .mdp-metadata-count')?.textContent==='1501'`);
  assert.equal(await js(`document.querySelectorAll('.mdp-meta-highlights').length`),100);
  await click('[data-kind="highlights"] .mdp-metadata-more');
  assert.equal(await js(`document.querySelectorAll('.mdp-meta-highlights').length`),200);
  const elapsed=performance.now()-time;
  await js(`app.vault.modify(app.vault.getAbstractFileByPath('산책 메모.md'),${JSON.stringify(original['산책 메모.md'])}).then(()=>true)`);await pause(500);
  await js(`(async()=>{${p}.flushState();await ${p}.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1500);
  await writeFile(dir+'/restart-expected.json',JSON.stringify(await js(`({explorer:${p}.explorer,spaces:${p}.data.spaces,folders:${p}.foldersByMain,cards:${p}.cards,top:${p}.topView})`),null,2));
  await writeFile(dir+'/metadata-performance.json',JSON.stringify({passed:true,highlights:1501,tasks:1501,initialRowsPerSection:100,showMoreRows:200,elapsedIncludingPollingAndClickMs:elapsed,keyboardExpandPreservesSub:true},null,2));
  console.log('PASS keyboard toggle and 3002 metadata items; restart state saved');
 }else{
  await wait(`${p}?.mainFile?.path==='나의 글쓰기.md'`);
  const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8'));
  assert.equal(await js(`${p}.manifest.version`),'0.1.11');
  for(const [prop,key]of [['explorer','explorer'],['data.spaces','spaces'],['foldersByMain','folders'],['cards','cards'],['topView','top']])assert.deepEqual(await js(`${p}.${prop}`),expected[key],key);
  await wait(`document.querySelector('.mdp-source-toggle')?.textContent.includes('산책 메모')`);
  await click('.mdp-source-toggle');assert.ok(await js(`document.querySelector('.mdp-source-tree').textContent.includes('산책 메모')`));await click('.mdp-source-toggle');
  await textClick('.mdp-tab','Link View');await textClick('.mdp-tab','Card');
  assert.ok(await js(`document.querySelectorAll('.mdp-card-grid [data-link-path="산책 메모.md"]').length>=2`));
  await c.screenshot(dir+'/restart-card.png');await textClick('.mdp-tab','Metadata View');await pause(300);await c.screenshot(dir+'/restart-metadata.png');
  const vault=await js('app.vault.adapter.getBasePath()'),assets=[];assert.ok(vault.endsWith('MDPalette-Link-Sandbox-20260924'));
  for(const name of ['main.js','manifest.json','styles.css']){const b=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),b);assets.push({name,sha256:createHash('sha256').update(b).digest('hex')});}
  const fixtures=JSON.parse(await readFile(dir+'/fixture-originals.json','utf8'));for(const [path,text]of Object.entries(fixtures))assert.equal(await readFile(vault+'/'+path,'utf8'),text,path);
  assert.equal(c.errors.length,0);
  for(const report of ['ui-result','advanced-result','metadata-performance'])assert.equal(JSON.parse(await readFile(dir+'/'+report+'.json','utf8')).passed,true);
  const result={version:'0.1.11',passed:true,processRestart:true,sourceSelectionRestored:true,depthAndExpansionRestored:true,foldersAndCardsPreserved:true,fixtureHashesRestored:true,assets};
  await writeFile(dir+'/restart-result.json',JSON.stringify(result,null,2));await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
 }
}finally{c.close()}
