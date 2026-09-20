import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/stage5',p="app.plugins.plugins['md-palette']",js=s=>c.evaluate(s),hash=b=>createHash('sha256').update(b).digest('hex');
try{
 for(let i=0;i<80;i++){if(await js(`!!${p}?.mainFile&&!!document.querySelector('.mdp-metadata-search')`))break;await new Promise(r=>setTimeout(r,150))}
 const expected=JSON.parse(await readFile(dir+'/before-restart.json','utf8'));
 const actual=await js(`({main:${p}.mainFile?.path,mainId:${p}.mainLeaf?.id,active:app.workspace.getMostRecentLeaf().view.file?.path,collapsed:${p}.metadataCollapsed,folders:${p}.foldersByMain,cards:${p}.cards,connections:${p}.connections,spaces:${p}.data.spaces})`);assert.deepEqual(actual,expected);
 assert.equal(await js(`${p}.manifest.version`),'0.0.9');assert.equal(await js(`document.querySelector('.mdp-metadata-search input').value`),'');assert.equal(await js(`document.querySelector('[data-kind="highlights"] .mdp-metadata-body').hidden`),true);
 assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Main Space"]').length`),1);assert.equal(await js(`document.querySelector('.mdp-space-icon[aria-label="Main Space"]').closest('.workspace-tab-header')===${p}.mainLeaf.tabHeaderEl`),true);
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));const assets=[];
 for(const name of ['main.js','manifest.json','styles.css']){const bytes=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),bytes);assets.push({name,sha256:hash(bytes)})}
 const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));for(let i=0;i<originals.length;i+=32)await Promise.all(originals.slice(i,i+32).map(async f=>assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path)));
 await c.send('Emulation.setDeviceMetricsOverride',{width:1800,height:1100,deviceScaleFactor:1,mobile:false});await c.screenshot(dir+'/restart.png');
 const r=await js(`document.querySelector('.mdp-sidebar').getBoundingClientRect().toJSON()`);const shot=await c.send('Page.captureScreenshot',{format:'png',clip:{x:r.x,y:r.y,width:r.width,height:r.height,scale:1}});await writeFile(dir+'/sidebar.png',Buffer.from(shot.data,'base64'));
 for(const file of ['ui-result','advanced-result'])assert.equal(JSON.parse(await readFile(dir+'/'+file+'.json','utf8')).passed,true);
 assert.deepEqual(c.errors,[]);const result={passed:true,version:'0.0.9',mainPinnedAcrossRestart:true,adjacentActiveTabPreserved:true,collapseRestored:true,searchCleared:true,originalFilesUnchanged:originals.length,assets,errors:c.errors};
 await writeFile(dir+'/restart-result.json',JSON.stringify(result,null,2));await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
