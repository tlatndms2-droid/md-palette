import assert from 'node:assert/strict';
import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect} from './cdp.mjs';
const c=await connect(),js=s=>c.evaluate(s),p="app.plugins.plugins['md-palette']";
const dir='.artifacts/metadata-font',mode=process.argv[2]??'ui';
const checks=[],pause=ms=>new Promise(r=>setTimeout(r,ms)),hash=b=>createHash('sha256').update(b).digest('hex');
const check=s=>{checks.push(s);console.log('PASS',s)};
async function wait(s){for(let i=0;i<70;i++){if(await js(s))return;await pause(100)}throw Error('Timeout: '+s)}
async function point(s){return js(`(()=>{const e=document.querySelector(${JSON.stringify(s)});if(!e)throw Error('Missing '+${JSON.stringify(s)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)}
async function tap(q){for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,button:'left',clickCount:1,...q});await pause(100)}
async function click(s){await tap(await point(s))}
async function tab(text){await tap(await js(`(()=>{const e=[...document.querySelectorAll('.mdp-tabs button')].find(e=>e.textContent===${JSON.stringify(text)}),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
async function wheel(s,deltaY,ctrl=true){const q=await point(s);await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...q});await c.send('Input.dispatchMouseEvent',{type:'mouseWheel',...q,deltaX:0,deltaY,modifiers:ctrl?2:0});await pause(65)}
async function size(){return js(`parseFloat(getComputedStyle(document.querySelector('.mdp-metadata-text')).fontSize)`)}
async function toSize(n){for(let i=0;i<35;i++){const v=await size();if(v===n)return;await wheel('.mdp-footnote-context',v<n?-100:100)}throw Error('Could not set font')}
async function state(){return js(`({font:parseFloat(getComputedStyle(document.querySelector('.mdp-metadata-text')).fontSize),context:parseFloat(getComputedStyle(document.querySelector('.mdp-footnote-context')).fontSize),heading:getComputedStyle(document.querySelector('.mdp-heading')).fontSize,editor:getComputedStyle(${p}.mainLeaf.view.containerEl.querySelector('.cm-content')).fontSize,zoom:require('@electron/remote').getCurrentWindow().webContents.getZoomFactor(),saved:${p}.metadataFontSize,scroll:document.querySelector('.mdp-metadata').closest('.view-content').scrollTop})`)}
try{
 await mkdir(dir,{recursive:true});
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Metadata-Sandbox-20260922'));
 if(mode==='install'){
  const backup=dir+'/backup-'+Date.now();await cp(vault+'/.obsidian',backup+'/.obsidian',{recursive:true});
  const files=await js('app.vault.getFiles().map(f=>f.path)');const originals=[];
  for(const path of files)originals.push({path,sha256:hash(await readFile(vault+'/'+path))});
  await writeFile(dir+'/backup.json',JSON.stringify({backup,originals},null,2));
  await js(`app.plugins.unloadPlugin('md-palette').then(()=>true)`);
  for(const n of ['main.js','manifest.json','styles.css']){await cp(n,vault+'/.obsidian/plugins/md-palette/'+n);assert.equal(hash(await readFile(n)),hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+n)))}
  await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');if(!${p})await app.plugins.loadPlugin('md-palette');return true})()`);
 }
 await wait(`${p}?.mainFile?.path==='Metadata Review.md'`);assert.equal(await js(`${p}.manifest.version`),'0.1.4');
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1100,deviceScaleFactor:1,mobile:false});
 await wait(`!!document.querySelector('.mdp-footnote-context strong')`);
 if(mode==='restart'){
  const expected=JSON.parse(await readFile(dir+'/expected.json','utf8'));assert.equal(await size(),expected.font);assert.equal(await js(`${p}.metadataFontSize`),expected.font);check('font size automatically restored after full process restart');
  await wheel('.mdp-footnote-context',-100);assert.equal(await size(),expected.font+1);await wheel('.mdp-footnote-context',100);assert.equal(await size(),expected.font);check('Ctrl+wheel remains active after restart');
 }else{
  const before=await state();await writeFile(dir+'/before.json',JSON.stringify(before,null,2));await c.screenshot(dir+'/before.png');
  // Native mouse-wheel input, not a synthetic DOM WheelEvent.
  await wheel('.mdp-footnote-context',-100);const up=await state();assert.equal(up.font,before.font+1);assert.equal(up.context,up.font);assert.equal(up.zoom,before.zoom);assert.equal(up.editor,before.editor);assert.equal(up.heading,before.heading);check('Ctrl+wheel up enlarges metadata only, without app/editor zoom');
  await wheel('.mdp-footnote-context',100);assert.equal(await size(),before.font);check('Ctrl+wheel down reduces metadata');
  await js(`document.querySelector('.mdp-metadata').closest('.view-content').scrollTop=0;true`);
  const q=await point('.mdp-footnote-context');const scrollBefore=await js(`document.querySelector('.mdp-metadata').closest('.view-content').scrollTop`);
  await c.send('Input.dispatchMouseEvent',{type:'mouseWheel',...q,deltaX:0,deltaY:180,modifiers:0});await pause(300);
  assert.ok(await js(`document.querySelector('.mdp-metadata').closest('.view-content').scrollTop`)>scrollBefore);assert.equal(await size(),before.font);check('ordinary wheel still scrolls without resizing');
  await toSize(32);await wheel('.mdp-footnote-context',-100);assert.equal(await size(),32);assert.equal((await state()).zoom,before.zoom);
  await toSize(10);await wheel('.mdp-footnote-context',100);assert.equal(await size(),10);assert.equal((await state()).zoom,before.zoom);check('10px and 32px limits consume Ctrl+wheel without leaking zoom');
  await toSize(18);await click('.mdp-footnote-edit');
  await c.send('Input.insertText',{text:'임시 편집 유지 '});
  const draft=await js(`(()=>{const e=document.querySelector('.mdp-footnote-input');window.fontDraft=e;return{value:e.value,start:e.selectionStart,end:e.selectionEnd}})()`);
  await wheel('.mdp-footnote-input',-100);
  const afterDraft=await js(`(()=>{const e=document.querySelector('.mdp-footnote-input');return{same:e===window.fontDraft,value:e.value,start:e.selectionStart,end:e.selectionEnd,size:parseFloat(getComputedStyle(e).fontSize)}})()`);
  assert.equal(afterDraft.same,true);assert.equal(afterDraft.value,draft.value);assert.equal(afterDraft.start,draft.start);assert.equal(afterDraft.end,draft.end);assert.equal(afterDraft.size,19);
  await click('.mdp-footnote-actions button:not(.mod-cta)');await wait(`!document.querySelector('.mdp-footnote-input')`);check('font change preserves live footnote draft, selection and input element');
  for(let i=0;i<3;i++){await tab('Link View');await tab('Metadata View');await wait(`!!document.querySelector('.mdp-footnote-context')`)}
  const old=await size();await wheel('.mdp-footnote-context',-100);assert.equal(await size(),old+1);check('view switching retains size and does not duplicate wheel handlers');
  // An unrelated central editor keeps its original Ctrl+wheel behavior.
  const metadata=await size(),base=await js(`app.vault.getConfig('baseFontSize')`),zoom=(await state()).zoom;
  await wheel('.cm-content',-100);assert.equal(await js(`${p}.metadataFontSize`),metadata);
  await js(`app.vault.setConfig('baseFontSize',${JSON.stringify(base)});require('@electron/remote').getCurrentWindow().webContents.setZoomFactor(${zoom});true`);check('Ctrl+wheel outside Metadata does not alter the stored metadata size');
  await toSize(18);await js(`${p}.flushState();${p}.saveChain.then(()=>true)`);
  const saved=JSON.parse(await readFile(vault+'/.obsidian/plugins/md-palette/data.json','utf8'));assert.equal(saved.metadataFontSize,18);
  const backup=JSON.parse(await readFile(dir+'/backup.json','utf8'));const prior=JSON.parse(await readFile(backup.backup+'/.obsidian/plugins/md-palette/data.json','utf8'));
  for(const key of ['cards','foldersByMain','folderDefaults','spaces','metadataCollapsed','connections'])assert.deepEqual(saved[key],prior[key],key);check('font preference saved without changing existing organization or roles');
  await writeFile(dir+'/expected.json',JSON.stringify({font:18}));
 }
 const backup=JSON.parse(await readFile(dir+'/backup.json','utf8'));for(const f of backup.originals)assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);check('all Sandbox source-file hashes unchanged');
 await js(`app.workspace.rightSplit.setSize(280);true`);await pause(100);assert.ok(await js(`(()=>{const e=document.querySelector('.mdp-metadata');return e.scrollWidth<=e.clientWidth+1})()`));
 await js(`app.workspace.rightSplit.setSize(490);document.querySelector('.mdp-metadata').closest('.view-content').scrollTop=0;true`);await pause(100);
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:700,y:50});await c.screenshot(dir+'/'+(mode==='restart'?'restart':'after')+'.png');
 assert.deepEqual(c.errors,[]);const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(sha256,hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)));assets.push({name,sha256})}
 await writeFile(dir+'/'+(mode==='restart'?'restart':'ui')+'-result.json',JSON.stringify({passed:true,version:'0.1.4',checks,assets,errors:c.errors},null,2));
 if(mode==='restart'){
  const ui=JSON.parse(await readFile(dir+'/ui-result.json','utf8'));assert.equal(ui.passed,true);assert.deepEqual(ui.assets,assets);
  await writeFile(dir+'/release-ready.json',JSON.stringify({passed:true,version:'0.1.4',assets},null,2));
 }
}catch(e){await c.screenshot(dir+'/failure.png');throw e}finally{c.close()}
