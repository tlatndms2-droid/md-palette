import assert from 'node:assert/strict';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect} from './cdp.mjs';
const c=await connect(),js=s=>c.evaluate(s),p="app.plugins.plugins['md-palette']";
const dir='.artifacts/footnote-choice',mode=process.argv[2]??'ui',pause=ms=>new Promise(r=>setTimeout(r,ms));
const hash=b=>createHash('sha256').update(b).digest('hex'),results=[];
const j=JSON.stringify;
async function tap(pt){for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,button:'left',clickCount:1,...pt});await pause(180)}
async function menu(title){await tap(await js(`(()=>{const e=[...document.querySelectorAll('.menu-item-title')].find(e=>e.textContent===${j(title)});if(!e)throw Error('Missing menu');const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
async function drag(){
 const to=await js(`(()=>{if(choiceLeaf.view.canvas){const r=choiceLeaf.view.canvas.wrapperEl.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}}const e=window.choiceLeaf.view.editor;e.setCursor({line:0,ch:2});e.scrollIntoView({from:{line:0,ch:2},to:{line:0,ch:2}},true);const r=e.cm.coordsAtPos(2);return{x:r.left,y:(r.top+r.bottom)/2}})()`);
 const pt=await js(`(()=>{window.getSelection().removeAllRanges();const e=document.querySelector('.mdp-footnote-context strong');e.scrollIntoView({block:'center'});const t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT).nextNode(),r=document.createRange();r.setStart(t,0);r.setEnd(t,2);const b=r.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()`);
 await c.send('Input.setInterceptDrags',{enabled:false});
 await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...pt});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...pt});
 for(let i=1;i<=20;i++){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:pt.x+(to.x-pt.x)*i/20,y:pt.y+(to.y-pt.y)*i/20});await pause(20)}
 await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...to});await pause(150);
 assert.deepEqual(await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`),['각주만','본문만','각주와 본문','취소']);
}
try{
 await mkdir(dir,{recursive:true});const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Metadata-Sandbox-20260922'));
 if(mode==='install'){
  const backup=dir+'/backup-'+Date.now();await cp(vault+'/.obsidian',backup+'/.obsidian',{recursive:true});
  const originals=[];for(const path of await js('app.vault.getFiles().map(f=>f.path)'))originals.push({path,sha256:hash(await readFile(vault+'/'+path))});
  await writeFile(dir+'/backup.json',j({backup,originals}));
  await js(`app.plugins.unloadPlugin('md-palette').then(()=>true)`);
  for(const name of ['main.js','manifest.json','styles.css'])await cp(name,vault+'/.obsidian/plugins/md-palette/'+name);
  await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');if(!${p})await app.plugins.loadPlugin('md-palette');return true})()`);await pause(500);
 }
 assert.equal(await js(`${p}.manifest.version`),'0.1.5');
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1100,deviceScaleFactor:1,mobile:false});
 if(mode==='restart'){
  const expected=JSON.parse(await readFile(dir+'/expected.json','utf8'));
  assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('Footnote Choice Review.md'))`),expected.value);
  assert.equal(await js(`${p}.metadataFontSize`),18);results.push({restartSavedInsertion:true,fontRetained:true});
 }
 await js(`(async()=>{if(!app.vault.getAbstractFileByPath('Footnote Choice Review.md'))await app.vault.create('Footnote Choice Review.md','검증 결과');await ${p}.openIn('sub',app.vault.getAbstractFileByPath('Metadata Drop Target.md'));window.choiceLeaf=${p}.subGroup.children[${p}.subGroup.currentTab];return true})()`);
 await pause(350);
 const original=await js('choiceLeaf.view.editor.getValue()');await writeFile(dir+'/target-before-'+mode+'.json',j({original}));
 const fixture='앞 뒤\n\n[^mdp-1]: 기존 각주\n';
 let review;
 try{
  for(const source of [true,false]){
   await js(`choiceLeaf.setViewState({...choiceLeaf.getViewState(),state:{...choiceLeaf.getViewState().state,mode:'source',source:${source}}}).then(()=>true)`);await pause(200);
   for(const title of ['각주만','본문만','각주와 본문','취소']){
    await js(`choiceLeaf.view.editor.setValue(${j(fixture)});choiceLeaf.view.save().then(()=>true)`);await pause(300);
    await drag();if(title==='각주와 본문'&&!source)await c.screenshot(dir+'/menu-'+mode+'.png');
    const item=await js(`${p}.reuseDrag.menu && (()=>{const i=${p}.mainLeaf.view.editor.getValue();return i})()`);
    assert.ok(item);await menu(title);await pause(300);
    const value=await js('choiceLeaf.view.editor.getValue()');
    // Source fixture from the prior Markdown-rendering checks; parse the actual first definition/context.
    const main=await js(`${p}.mainLeaf.view.editor.getValue()`),lines=main.split('\n');
    const context=lines.find(l=>l.includes('[^1]')&&!l.startsWith('[^1]:')).replace(/\[\^[^\]]+\]/g,'');
    const from=lines.findIndex(l=>l.startsWith('[^1]:'));let note=lines[from].replace(/^\[\^1\]:\s*/,'');
    for(let n=from+1;n<lines.length&&(lines[n].startsWith('    ')||(lines[n]===''&&lines[n+1]?.startsWith('    ')));n++)note+='\n'+lines[n].replace(/^ {4}/,'');
    const insertion=title==='각주만'?note:title==='본문만'?context:title==='각주와 본문'?context+'[^mdp-2]':'';
    const expected=fixture.slice(0,2)+insertion+fixture.slice(2)+(title==='각주와 본문'?'\n\n[^mdp-2]: '+note.split('\n').map((l,i)=>i?'    '+l:l).join('\n')+'\n':'');
    assert.equal(value,expected,title);assert.equal(await js(`app.vault.read(choiceLeaf.view.file)`),expected);
    assert.equal(await js(`document.querySelectorAll('.mdp-reuse-caret,.mdp-reuse-line').length`),0);
    results.push({sourceMode:source,title,value});if(title==='각주와 본문'){
     review=value;if(!source)await c.screenshot(dir+'/inserted-'+mode+'.png');
     await js('choiceLeaf.view.editor.focus();true');
     await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'z',code:'KeyZ',windowsVirtualKeyCode:90,modifiers:2});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'z',code:'KeyZ',windowsVirtualKeyCode:90,modifiers:2});await pause(150);
     assert.equal(await js('choiceLeaf.view.editor.getValue()'),fixture,'one undo removes body and footnote together');
    }
   }
  }
 }finally{await js(`choiceLeaf.view.editor.setValue(${j(original)});choiceLeaf.view.save().then(()=>true)`);await pause(200)}
 // Existing Main and Sub Canvas destinations share the same three content choices.
 if(mode!=='restart'){
  const mainOriginal=await js(`${p}.mainLeaf.view.editor.getValue()`);
  await writeFile(dir+'/main-before.json',j({original:mainOriginal}));
  for(const destination of ['main','canvas']){
   if(destination==='main')await js(`window.choiceLeaf=${p}.mainLeaf;true`);
   else await js(`(async()=>{const path='Footnote Choice Review.canvas';if(!app.vault.getAbstractFileByPath(path))await app.vault.create(path,JSON.stringify({nodes:[],edges:[]}));await ${p}.openIn('sub',app.vault.getAbstractFileByPath(path));window.choiceLeaf=${p}.subGroup.children[${p}.subGroup.currentTab];return true})()`);
   await pause(350);
   const prior=await js(`app.vault.read(choiceLeaf.view.file)`);await writeFile(dir+'/'+destination+'-before.json',j({prior}));
   try{
    for(const title of ['각주만','본문만','각주와 본문','취소']){
     await drag();
     const actualOffset=await js(`${p}.reuseDrag.markedTarget?.offset`);
     // Capture expected source directly from unchanged parsed source, before choosing.
     const content=results.find(r=>r.title==='각주만').value.slice(2,-fixture.slice(2).length);
     const context=results.find(r=>r.title==='본문만').value.slice(2,-fixture.slice(2).length);
     const chosen=title==='각주만'?content:title==='본문만'?context:title==='각주와 본문'?context+'[^mdp-1]':'';
     const suffix=title==='각주와 본문'?'\n\n[^mdp-1]: '+content.split('\n').map((l,i)=>i?'    '+l:l).join('\n')+'\n':'';
     await menu(title);await pause(250);
     if(destination==='main'){
      assert.equal(await js('choiceLeaf.view.editor.getValue()'),mainOriginal.slice(0,actualOffset)+chosen+mainOriginal.slice(actualOffset)+suffix);
      await js(`choiceLeaf.view.editor.setValue(${j(mainOriginal)});choiceLeaf.view.save().then(()=>true)`);
     }else{
      const data=await js('choiceLeaf.view.canvas.getData()'),before=JSON.parse(prior);assert.equal(data.nodes.length,before.nodes.length+(title==='취소'?0:1));
      if(title!=='취소')assert.equal(data.nodes.at(-1).text,chosen+suffix);
      await js(`choiceLeaf.view.canvas.setData(${prior});choiceLeaf.view.canvas.requestSave();choiceLeaf.view.save().then(()=>true)`);
     }
     results.push({destination,title,passed:true});await pause(350);
    }
   }finally{
    if(destination==='main')await js(`choiceLeaf.view.editor.setValue(${j(mainOriginal)});choiceLeaf.view.save().then(()=>true)`);
    else await js(`choiceLeaf.view.canvas.setData(${prior});choiceLeaf.view.canvas.requestSave();choiceLeaf.view.save().then(()=>true)`);
   }
  }
 }
 await js(`app.vault.modify(app.vault.getAbstractFileByPath('Footnote Choice Review.md'),${j(review)}).then(()=>true)`);
 await writeFile(dir+'/expected.json',j({value:review}));
 const backup=JSON.parse(await readFile(dir+'/backup.json','utf8'));for(const f of backup.originals)assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
 await js(`(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath('Footnote Choice Review.md'));${p}.flushState();await ${p}.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(300);
 await c.screenshot(dir+'/review-'+mode+'.png');assert.deepEqual(c.errors,[]);
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(sha256,hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)));assets.push({name,sha256})}
 const report={passed:true,version:'0.1.5',results,assets,errors:c.errors};await writeFile(dir+'/'+(mode==='restart'?'restart':'ui')+'-result.json',j(report));
 if(mode==='restart'){assert.deepEqual(JSON.parse(await readFile(dir+'/ui-result.json','utf8')).assets,assets);await writeFile(dir+'/release-ready.json',j(report))}
 console.log(report);
}catch(e){await c.screenshot(dir+'/failure.png');throw e}finally{c.close()}
