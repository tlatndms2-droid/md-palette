import assert from 'node:assert/strict';import {readFile,writeFile,cp} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {c,p,js,pause,wait,click} from './stage4-helpers.mjs';
const dir='.artifacts/revision',mode=process.argv[2];
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 if(mode==='prepare'){
  // The old version recognizes Sub only if it contains Markdown; keep its valid old contract for the update test.
  await click('[data-surface="folder"][data-key="f:Revision-Review/자료.md"]','left',2);await wait(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file?.extension==='md'&&!${p}.busy`);
  await js(`(async()=>{${p}.flushState();await ${p}.saveChain;await app.plugins.disablePlugin('md-palette');return true})()`);
  await cp(vault+'/.obsidian/plugins/md-palette/data.json',dir+'/data-before-brat.json');
  const baseline=dir+'/backup-obsidian/plugins/md-palette';assert.equal(JSON.parse(await readFile(baseline+'/manifest.json','utf8')).version,'0.0.7');
  for(const name of ['main.js','manifest.json','styles.css'])await cp(baseline+'/'+name,vault+'/.obsidian/plugins/md-palette/'+name);
  const result=await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePlugin('md-palette');await app.plugins.enablePluginAndSave('obsidian42-brat');return {version:${p}.manifest.version,brat:app.plugins.plugins['obsidian42-brat'].manifest.version,tracked:app.plugins.plugins['obsidian42-brat'].settings.pluginList}})()`);assert.equal(result.version,'0.0.7');assert.ok(result.tracked.includes('tlatndms2-droid/md-palette'));console.log(result);
 }else{
  assert.equal(await js(`${p}.manifest.version`),'0.0.7');await js(`app.commands.executeCommandById('command-palette:open');true`);await c.send('Input.insertText',{text:'BRAT: Plugins: Check for updates to all beta plugins and UPDATE'});
  await wait(`[...document.querySelectorAll('.suggestion-item')].some(e=>e.textContent.includes('Check for updates to all beta plugins and UPDATE'))`);await c.screenshot(dir+'/brat-command.png');await click('.suggestion-item');
  for(let i=0;i<150;i++){if(await js(`${p}?.manifest.version==='0.0.8'&&!!${p}.mainGroup`))break;await pause(200)}assert.equal(await js(`${p}.manifest.version`),'0.0.8');assert.equal(await js(`app.plugins.enabledPlugins.has('md-palette')`),true);
  const old=JSON.parse(await readFile(dir+'/data-before-brat.json','utf8'));
  for(const key of ['cards','connections','foldersByMain'])assert.deepEqual(await js(`${p}.${key}`),old[key],key);assert.deepEqual(await js(`${p}.data.spaces`),old.spaces);assert.deepEqual(await js(`${p}.data.preservedFixture`),old.preservedFixture);
  const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const local=await readFile(name),installed=await readFile(vault+'/.obsidian/plugins/md-palette/'+name);if(name==='manifest.json')assert.deepEqual(JSON.parse(local),JSON.parse(installed));else assert.deepEqual(local,installed);assets.push({name,sha256:createHash('sha256').update(installed).digest('hex'),contentIdentical:true});}
  await wait(`!!document.querySelector('.mdp-folder-grid .mdp-file-title')`);await c.screenshot(dir+'/brat-updated.png');assert.deepEqual(c.errors,[]);await writeFile(dir+'/brat-verification.json',JSON.stringify({passed:true,from:'0.0.7',to:'0.0.8',newDocumentFoldersNotReset:true,priorSettingsAndRolesPreserved:true,assets,errors:c.errors},null,2));console.log('PASS BRAT 0.0.7 → 0.0.8, per-document folders, roles, labels and settings preserved');
 }
}finally{c.close()}
