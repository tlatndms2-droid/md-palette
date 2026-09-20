import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/revision',p="app.plugins.plugins['md-palette']",js=s=>c.evaluate(s),pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot=()=>js(`({version:${p}.manifest.version,foldersByMain:${p}.foldersByMain,cards:${p}.cards,connections:${p}.connections,spaces:${p}.data.spaces,subFiles:${p}.subGroup.children.map(l=>l.getViewState().state.file),unknown:${p}.data.preservedFixture})`);
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 if(process.argv[2]==='snapshot'){
  await js(`(async()=>{const file=app.vault.getAbstractFileByPath('Revision-Review/Performance.md');const paths=app.vault.getMarkdownFiles().filter(f=>f.path.startsWith('Stage3-Large/')).slice(0,2000).map(f=>f.path);await app.vault.modify(file,'# Performance\\n\\n'+paths.map(p=>'[['+p+']]').join('\\n'));${p}.flushState();await ${p}.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1500);
  const expected=await snapshot();assert.ok(expected.subFiles.length&&!expected.subFiles.some(f=>f.endsWith('.md')));await writeFile(dir+'/before-restart.json',JSON.stringify(expected,null,2));console.log('Saved final state: non-Markdown Sub and independent Main folders');
 }else{
  for(let i=0;i<60;i++){if(await js(`!!${p}?.subGroup&&!!document.querySelector('.mdp-folder-grid')`))break;await pause(150)}
  const actual=await snapshot(),expected=JSON.parse(await readFile(dir+'/before-restart.json','utf8'));assert.deepEqual(actual,expected);assert.equal(actual.version,'0.0.8');assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Sub Space"]').length`),1);assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Main Space"]').length`),1);
  const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));const assets=[];
  for(const name of ['main.js','manifest.json','styles.css']){const bytes=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),bytes);assets.push({name,sha256:createHash('sha256').update(bytes).digest('hex')});}
  const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));for(let i=0;i<originals.length;i+=32)await Promise.all(originals.slice(i,i+32).map(async f=>assert.equal(createHash('sha256').update(await readFile(vault+'/'+f.path)).digest('hex'),f.sha256,f.path)));
  const persisted=JSON.parse(await readFile(vault+'/.obsidian/plugins/md-palette/data.json','utf8'));assert.equal(persisted.folders,undefined);assert.deepEqual(persisted.foldersByMain,expected.foldersByMain);
  const rect=await js(`document.querySelector('.mdp-sidebar').getBoundingClientRect().toJSON()`);const shot=await c.send('Page.captureScreenshot',{format:'png',clip:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,scale:1}});await writeFile(dir+'/folder-sidebar.png',Buffer.from(shot.data,'base64'));
  await c.screenshot(dir+'/restart.png');assert.deepEqual(c.errors,[]);
  for(const name of ['migration','ui-result','checks-result','performance-result','cards-result'])assert.equal(JSON.parse(await readFile(dir+'/'+name+'.json','utf8')).passed,true,name);
  const result={passed:true,version:'0.0.8',nonMarkdownSubRestored:true,perDocumentFoldersRestored:true,originalFilesUnchanged:originals.length,assets,errors:c.errors};await writeFile(dir+'/restart-result.json',JSON.stringify(result,null,2));await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
 }
}finally{c.close()}
