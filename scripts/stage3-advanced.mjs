import {connect} from './cdp.mjs';import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const c=await connect(),dir='.artifacts/stage3',p="app.plugins.plugins['md-palette']";const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await c.evaluate(`app.vault.setConfig('theme','obsidian');app.updateTheme();true`);await pause(400);assert.equal(await c.evaluate(`document.body.classList.contains('theme-dark')`),true);
 await c.screenshot(dir+'/dark.png');
 await c.evaluate(`app.vault.setConfig('theme','moonstone');app.updateTheme();true`);await pause(400);assert.equal(await c.evaluate(`document.body.classList.contains('theme-light')`),true);await c.screenshot(dir+'/light.png');
 await c.evaluate(`app.vault.setConfig('theme','obsidian');app.updateTheme();true`);
 const originals=JSON.parse(await readFile(dir+'/originals.json','utf8')),main=originals.find(f=>f.path.endsWith('/Main.md'));
 await c.evaluate(`app.vault.modify(app.vault.getAbstractFileByPath(${JSON.stringify(main.path)}),${JSON.stringify(main.text)}).then(()=>true)`);await pause(400);
 await c.evaluate(`(async()=>{const p=${p};await p.addConnection(p.mainFile,app.vault.getAbstractFileByPath('Stage3-Fixtures/Extra.md'));return true})()`);await pause(400);
 const after=await c.evaluate(`app.vault.read(${p}.mainFile)`);const body=s=>s.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');assert.equal(body(after),body(main.text));
 for(const file of originals.filter(f=>f!==main))assert.equal(await c.evaluate(`app.vault.read(app.vault.getAbstractFileByPath(${JSON.stringify(file.path)}))`),file.text,file.path);
 await c.evaluate(`(async()=>{const p=${p};await p.addConnection(p.mainFile,app.vault.getAbstractFileByPath('Stage3-Fixtures/Extra.md'));return true})()`);assert.equal(await c.evaluate(`app.vault.read(${p}.mainFile)`),after);
 await c.evaluate(`app.fileManager.processFrontMatter(${p}.mainFile,f=>{f.unrelated='[[Stage3-Fixtures/Empty]]'}).then(()=>true)`);await pause(700);
 assert.equal(await c.evaluate(`document.querySelectorAll('[data-section=outgoing] [data-path="Stage3-Fixtures/Empty.md"]').length`),0);
 await c.evaluate(`app.vault.modify(${p}.mainFile,${JSON.stringify(after)}).then(()=>true)`);await pause(500);
 // Pan by native mouse on blank graph area, then return to fit with a blank double click.
 const b=await c.evaluate(`(()=>{const r=document.querySelector('.mdp-local-graph').getBoundingClientRect();return{x:r.x+25,y:r.y+25}})()`);
 const before=await c.evaluate(`document.querySelector('.mdp-local-graph svg > g').getAttribute('transform')`);
 await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...b});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:b.x+30,y:b.y+20});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:b.x+30,y:b.y+20});assert.notEqual(await c.evaluate(`document.querySelector('.mdp-local-graph svg > g').getAttribute('transform')`),before);
 await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:2,...b});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:2,...b});assert.equal(await c.evaluate(`document.querySelector('.mdp-local-graph svg > g').getAttribute('transform')`),before);
 await c.evaluate(`${p}.flushState();${p}.saveChain.then(()=>true)`);await c.evaluate(`app.workspace.requestSaveLayout();true`);await pause(1500);
 await writeFile(dir+'/before-restart.json',JSON.stringify(await c.evaluate(`({connections:${p}.connections,cards:${p}.cards,spaces:${p}.data.spaces,main:${p}.mainFile.path})`),null,2));
 assert.deepEqual(c.errors,[]);await writeFile(dir+'/advanced-result.json',JSON.stringify({passed:true,darkAndLight:true,mainBodyUnchanged:true,otherFilesUnchanged:true,duplicateUnchanged:true,graphPanAndFit:true,errors:c.errors},null,2));console.log('PASS themes, source preservation, duplicate, graph pan/fit');
}finally{c.close()}
