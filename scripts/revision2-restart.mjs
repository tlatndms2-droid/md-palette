import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/revision2',p="app.plugins.plugins['md-palette']",js=s=>c.evaluate(s),hash=b=>createHash('sha256').update(b).digest('hex');
try{
 for(let i=0;i<80;i++){if(await js(`!!${p}?.mainFile&&!!document.querySelector('.mdp-meta-links')`))break;await new Promise(r=>setTimeout(r,150))}
 const expected=JSON.parse(await readFile(dir+'/before-restart.json','utf8'));
 const actual=await js(`({main:${p}.mainFile.path,mainId:${p}.mainLeaf.id,subId:${p}.subGroup.id,subTypes:${p}.subGroup.children.map(l=>l.getViewState().type),cards:${p}.cards,folders:${p}.foldersByMain,connections:${p}.connections})`);assert.deepEqual(actual,expected);
 assert.equal(await js(`${p}.manifest.version`),'0.0.10');assert.equal(await js(`document.querySelectorAll('.mdp-meta-links').length`),1);
 assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Main Space"]').length`),1);assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Sub Space"]').length`),1);
 assert.equal(await js(`${p}.cards.labels.some(l=>l.id==='r2-delete')`),false);assert.equal(await js(`${p}.cards.assignments['Revision2-Review/Property.md']`),'r2-keep');
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));const assets=[];
 for(const name of ['main.js','manifest.json','styles.css']){const bytes=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),bytes);assets.push({name,sha256:hash(bytes)})}
 const originals=JSON.parse(await readFile(dir+'/originals.json','utf8')),fixtures=JSON.parse(await readFile(dir+'/fixtures.json','utf8'));
 for(const f of [...originals,...fixtures])assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await js(`(()=>{const w=require('@electron/remote').getCurrentWindow();w.restore();w.setBounds({x:20,y:20,width:1800,height:1050});w.showInactive();return true})()`);await c.send('Page.bringToFront');await c.screenshot(dir+'/restart.png');
 assert.equal(JSON.parse(await readFile(dir+'/ui-result.json','utf8')).passed,true);assert.deepEqual(c.errors,[]);
 const result={passed:true,version:'0.0.10',webOnlySubRestored:true,labelsRestored:true,urlOnly:true,originalFilesUnchanged:originals.length,fixturesUnchanged:fixtures.length,assets,errors:c.errors};
 await writeFile(dir+'/restart-result.json',JSON.stringify(result,null,2));await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
