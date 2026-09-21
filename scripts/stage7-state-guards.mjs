import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {c,p,js,pause,wait} from './stage4-helpers.mjs';
const dir='.artifacts/stage7';
try{
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage7-Sandbox-20260922'));
 await js(`(async()=>{${p}.flushState();await ${p}.saveChain;return true})()`);const path=vault+'/.obsidian/plugins/md-palette/data.json',good=await readFile(path);await writeFile(dir+'/state-guard-original.json',good);
 const source=await readFile(vault+'/Review/Main.md');const tabs=await js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{if(l.getViewState().type!=='md-palette-sidebar')a.push(l.id)});return a.sort()})()`);
 try{
  await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);await writeFile(path,'[]');await js(`app.plugins.enablePlugin('md-palette').then(()=>true)`);await pause(500);assert.equal(await js(`${p}.saveAllowed`),false);assert.equal(await readFile(path,'utf8'),'[]');assert.deepEqual(await readFile(vault+'/Review/Main.md'),source);
  await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);const missing=JSON.parse(good.toString());missing.spaces.main.groupId='missing-stage7-main';await writeFile(path,JSON.stringify(missing));await js(`app.plugins.enablePlugin('md-palette').then(()=>true)`);await pause(350);assert.equal(await js(`!!${p}.mainFile`),false);assert.equal(await js(`${p}.subGroups.length`),0);
  const now=await js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{if(l.getViewState().type!=='md-palette-sidebar')a.push(l.id)});return a.sort()})()`);assert.deepEqual(now,tabs);
 }finally{await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);await writeFile(path,good);await js(`app.plugins.enablePlugin('md-palette').then(()=>true)`)}
 await wait(`${p}.mainFile?.path==='Review/Main.md'`);assert.deepEqual(await readFile(vault+'/Review/Main.md'),source);
 await writeFile(dir+'/state-guards-result.json',JSON.stringify({passed:true,corruptDataPreserved:true,sourcePreserved:true,missingMainDoesNotRestoreSubs:true,restoredOriginalData:true},null,2));console.log('PASS corrupt data protection, missing Main restoration guard, original state restored');
}finally{c.close()}
