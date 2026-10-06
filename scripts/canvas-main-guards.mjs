import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { c,p,js,pause,wait,textClick } from './stage4-helpers.mjs';
const dir='.artifacts/canvas-main',root='CanvasMain-Review',j=JSON.stringify,checks=[];
const pass=s=>{checks.push(s);console.log('PASS',s)};
try{
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
 assert.equal(await js(`${p}.mainFile.path`),root+'/Board.canvas');
 const canvas=await readFile(vault+'/'+root+'/Board.canvas','utf8');
 const note=root+'/Cancel.md',before=await readFile(vault+'/'+note,'utf8');
 const folders=await js(`JSON.parse(JSON.stringify(${p}.folders))`);
 await js('window.cmOriginalFM=app.fileManager.processFrontMatter;true');
 try{
  await js('app.fileManager.processFrontMatter=async()=>{throw Error("test-save-failure")};true');
  const error=await js(`${p}.addFolderConnection(${p}.mainFile,app.vault.getAbstractFileByPath(${j(note)}),'canvas-folder').then(()=>null).catch(e=>e.message)`);
  assert.equal(error,'test-save-failure');assert.deepEqual(await js(`JSON.parse(JSON.stringify(${p}.folders))`),folders);assert.equal(await readFile(vault+'/'+note,'utf8'),before);
 }finally{await js('app.fileManager.processFrontMatter=cmOriginalFM;true')}
 pass('failed reverse-link write rolls back folder placement and leaves note and Canvas unchanged');
 const sub=await js(`${p}.subGroup.id`);
 await js(`(async()=>{window.cmStale=app.workspace.createLeafBySplit(${p}.mainLeaf,'horizontal');await cmStale.openFile(app.vault.getAbstractFileByPath(${j(note)}));await ${p}.toggleSub(cmStale);return true})()`);
 await wait(`!!document.querySelector('.mdp-sub-designation')`);
 try{
  await js(`window.cmFirst=true;app.fileManager.processFrontMatter=async function(...args){const r=await cmOriginalFM.apply(this,args);if(cmFirst){cmFirst=false;await cmStale.openFile(app.vault.getAbstractFileByPath(${j(root+'/Node.md')}))}return r};true`);
  await textClick('.modal button','연결하고 Sub로 지정');await wait(`document.querySelector('.mdp-sub-designation [role="alert"]')?.textContent.includes('취소')`);
 }finally{await js('app.fileManager.processFrontMatter=cmOriginalFM;true')}
 await textClick('.modal button','취소');assert.equal(await js(`${p}.subGroup.id`),sub);
 const after=await readFile(vault+'/'+note,'utf8');
 await writeFile(dir+'/stale-rollback.json',JSON.stringify({before,after,byteIdentical:before===after},null,2));
 assert.equal(after,before);assert.equal(await readFile(vault+'/'+root+'/Board.canvas','utf8'),canvas);
 await js('cmStale.detach();delete window.cmStale;delete window.cmOriginalFM;true');
 pass('stale Sub designation removes its own reverse link and preserves original note bytes and existing Sub');
 assert.deepEqual(c.errors,[]);await writeFile(dir+'/guards.json',JSON.stringify({passed:true,version:'0.1.14',checks,errors:c.errors},null,2));
}finally{c.close()}
