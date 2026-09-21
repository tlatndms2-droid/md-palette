import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/revision3',p="app.plugins.plugins['md-palette']",js=s=>c.evaluate(s),hash=b=>createHash('sha256').update(b).digest('hex');
try{
 for(let i=0;i<80;i++){if(await js(`!!${p}?.mainFile&&!!document.querySelector('.mdp-display-compact')`))break;await new Promise(r=>setTimeout(r,150))}
 assert.equal(await js(`${p}.manifest.version`),'0.0.11');
 const expected=JSON.parse(await readFile(dir+'/before-restart.json','utf8'));
 const actual=await js(`({main:${p}.mainFile.path,mainId:${p}.mainLeaf.id,folders:${p}.foldersByMain,cards:${p}.cards,hotkeys:app.hotkeyManager.customKeys['md-palette:set-main']})`);assert.deepEqual(actual,expected);
 assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Main Space"]').length`),1);
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));const assets=[];
 for(const name of ['main.js','manifest.json','styles.css']){const bytes=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),bytes);assets.push({name,sha256:hash(bytes)})}
 const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));for(const f of originals)assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
 await js(`(()=>{const w=require('@electron/remote').getCurrentWindow();w.restore();w.setBounds({x:20,y:20,width:1800,height:1050});w.showInactive();return true})()`);await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Page.bringToFront');await c.screenshot(dir+'/restart.png');
 assert.equal(JSON.parse(await readFile(dir+'/ui-result.json','utf8')).passed,true);assert.deepEqual(c.errors,[]);
 const result={passed:true,version:'0.0.11',compactRestored:true,legacyPreferencesPreserved:true,mainHotkeyPreserved:true,originalFilesUnchanged:originals.length,assets,errors:c.errors};await writeFile(dir+'/restart-result.json',JSON.stringify(result,null,2));await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
