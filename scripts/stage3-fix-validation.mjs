import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/stage3-fix',mode=process.argv[2]||'ui';const p="app.plugins.plugins['md-palette']",g="app.workspace.getLeavesOfType('md-palette-sidebar')[0].view.connections.nativeGraph.view";const pause=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>c.evaluate(s);
async function wait(s){for(let i=0;i<60;i++){if(await js(s))return;await pause(150)}throw Error('Timeout '+s)}
async function point(s){return js(`(()=>{const e=document.querySelector(${JSON.stringify(s)});if(!e)throw Error('Missing '+${JSON.stringify(s)});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)}
async function tap(pt,button='left',count=1){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button,clickCount:count,...pt});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button,clickCount:count,...pt});await pause(200)}
async function click(s,button='left',count=1){await tap(await point(s),button,count)}
async function textClick(s,t){await tap(await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(s)})].find(e=>e.textContent.trim()===${JSON.stringify(t)});if(!e)throw Error('Missing '+${JSON.stringify(t)});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
async function nodePoint(name){return js(`(()=>{const v=${g},r=v.renderer,n=r.nodes.find(n=>n.id==='Connections-Review/${name}.md'),b=r.interactiveEl.getBoundingClientRect(),d=devicePixelRatio;return{x:b.x+(r.panX+n.x*r.scale)/d,y:b.y+(r.panY+n.y*r.scale)/d}})()`)}
async function drag(s,dx,dy){const pt=await point(s);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...pt});for(let i=1;i<=8;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:pt.x+dx*i/8,y:pt.y+dy*i/8});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:pt.x+dx,y:pt.y+dy});await pause(250)}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1100,deviceScaleFactor:1,mobile:false});
 if(mode==='ui'){
  await js(`app.workspace.rightSplit.setSize(500);true`);await pause(400);
  if(await js(`${p}.connections.collapsed.outgoing`))await click('[data-section=outgoing] .mdp-connection-header');
  assert.deepEqual(await js(`[...document.querySelectorAll('[data-section=outgoing] .mdp-connection-row')].map(e=>e.dataset.path.split('/').pop()).sort()`),['Body.md','Both.md','Child.md','Linked.md','Parent.md']);
  await textClick('.mdp-tab','Card');await wait(`document.querySelectorAll('.mdp-card').length>0`);const cards=await js(`[...document.querySelectorAll('.mdp-card')].map(e=>e.dataset.path).filter(p=>p.endsWith('.md')).sort()`);await textClick('.mdp-tab','Connections');await wait(`!!${g}?.renderer.px`);assert.deepEqual(await js(`[...new Set([...document.querySelectorAll('.mdp-connection-row')].map(e=>e.dataset.path))].sort()`),cards);
  // Native settings, not replacement controls.
  if(await js(`${g}.engine.controlsEl.classList.contains('is-close')`))await click('.mdp-native-graph .graph-controls-button.mod-open');
  await click('.mdp-native-graph .mod-display .tree-item-self');await c.screenshot(dir+'/native-settings.png');
  console.log('display controls',await js(`document.querySelector('.mdp-native-graph .mod-display').innerText`));
  const toggles=await js(`document.querySelectorAll('.mdp-native-graph .mod-display .checkbox-container').length`);assert.ok(toggles>0);
  await click('.mdp-native-graph .mod-display .checkbox-container');await pause(500);assert.equal(await js(`${p}.connections.graphOptions.showArrow`),true);
  await click('.mdp-native-graph .graph-controls-button.mod-close');
  const center=await point('.mdp-native-graph canvas');const beforeScale=await js(`${g}.renderer.targetScale`);await c.send('Input.dispatchMouseEvent',{type:'mouseWheel',...center,deltaY:300,deltaX:0});await pause(900);assert.notEqual(await js(`${g}.renderer.targetScale`),beforeScale);
  await tap(await nodePoint('Child'));await wait(`${p}.subGroup?.children.some(l=>l.view.file?.basename==='Child')`);assert.equal(await js(`${g}.file.path`),'Connections-Review/Main.md');
  await tap(await nodePoint('Parent'),'right');await textClick('.menu-item-title','Reference Space에서 열기');await wait(`${p}.referenceGroup?.children.some(l=>l.view.file?.basename==='Parent')`);assert.equal(await js(`${g}.engine.options.localFile`),'Connections-Review/Main.md');
  await click('[data-section=outgoing] [data-path="Connections-Review/Both.md"]','left',2);await wait(`${p}.subGroup?.children.some(l=>l.view.file?.basename==='Both')`);
  // A separate real native view must retain its own file and options.
  await js(`(async()=>{const leaf=app.workspace.getLeaf('split');leaf.setPinned(true);await leaf.setViewState({type:'localgraph',state:{file:'Connections-Review/Other.md',options:{showArrow:false,close:true}}});window.ordinaryGraphId=leaf.id;return true})()`);await pause(500);
  assert.equal(await js(`${g}.constructor===app.workspace.getLeafById(ordinaryGraphId).view.constructor`),true);
  assert.equal(await js(`${g}.file.path`),'Connections-Review/Main.md');assert.equal(await js(`app.workspace.getLeafById(ordinaryGraphId).view.file.path`),'Connections-Review/Other.md');assert.equal(await js(`app.workspace.getLeafById(ordinaryGraphId).view.engine.getOptions().showArrow`),false);
  const height=await js(`JSON.stringify(${p}.connections.heights)`);await drag('.mdp-connection-divider[data-after=backlinks]',0,-35);assert.notEqual(await js(`JSON.stringify(${p}.connections.heights)`),height);
  await click('[data-section=graph] .mdp-connection-header');await click('[data-section=graph] .mdp-connection-header');await wait(`${g}.renderer.height>0`);
  await js(`window.keptNative=${g};true`);await js(`${p}.render();true`);assert.equal(await js(`${g}===keptNative`),true);
  // Main context changes, including empty and non-Markdown, must not follow Sub.
  await js(`(async()=>{await ${p}.mainGroup.children[${p}.mainGroup.currentTab].openFile(app.vault.getAbstractFileByPath('Connections-Review/Other.md'));return true})()`);await wait(`${g}.file.path==='Connections-Review/Other.md' && document.querySelectorAll('[data-section=outgoing] .mdp-connection-row').length===1`);
  await js(`(async()=>{await ${p}.mainGroup.children[${p}.mainGroup.currentTab].openFile(app.vault.getAbstractFileByPath('Connections-Review/Main.md'));return true})()`);await wait(`document.querySelectorAll('[data-section=outgoing] .mdp-connection-row').length===5`);
  await js(`app.workspace.getLeafById(ordinaryGraphId).detach();delete window.ordinaryGraphId;true`);
  await js(`app.vault.setConfig('theme','obsidian');app.updateTheme();true`);await pause(500);await c.screenshot(dir+'/dark.png');
  await js(`app.workspace.rightSplit.setSize(240);true`);await pause(500);const bounds=await js(`(()=>{const e=document.querySelector('.mdp-sidebar');return{width:e.clientWidth,scroll:e.scrollWidth}})()`);assert.equal(bounds.width,bounds.scroll);await c.screenshot(dir+'/narrow.png');await js(`app.workspace.rightSplit.setSize(500);true`);
  const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));for(const f of originals)assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath(${JSON.stringify(f.path)}))`),f.text);
  assert.deepEqual(c.errors,[]);await writeFile(dir+'/ui-result.json',JSON.stringify({passed:true,nativeConstructorMatch:true,childParentBodyLinkNote:true,mainPinned:true,ordinaryGraphUnchanged:true,sourceFilesUnchanged:true,bounds,errors:c.errors},null,2));console.log('PASS native graph UI, property links, Main isolation, settings, normal graph, safety');
 }
 if(mode==='snapshot'){
  await pause(2500);await js(`${p}.flushState();${p}.saveChain.then(()=>true)`);await js('app.workspace.requestSaveLayout();true');await pause(1300);await writeFile(dir+'/before-restart.json',JSON.stringify(await js(`({connections:${p}.connections,cards:${p}.cards,spaces:${p}.data.spaces})`),null,2));await c.screenshot(dir+'/review.png');console.log('Saved final restart baseline');
 }
 if(mode==='restart'){
  const saved=JSON.parse(await readFile(dir+'/before-restart.json','utf8'));await wait(`${g}?.renderer.nodes.length>=8`);assert.equal(await js(`${p}.manifest.version`),'0.0.6');assert.deepEqual(await js(`${p}.connections`),saved.connections);assert.deepEqual(await js(`${p}.cards`),saved.cards);assert.deepEqual(await js(`${p}.data.spaces`),saved.spaces);assert.equal(await js(`${g}.engine.getOptions().showArrow`),true);assert.deepEqual(c.errors,[]);await c.screenshot(dir+'/restart.png');await writeFile(dir+'/restart-result.json',JSON.stringify({passed:true,version:'0.0.6',errors:c.errors},null,2));console.log('PASS native settings, layout and spaces after process restart');
 }
}finally{c.close()}
