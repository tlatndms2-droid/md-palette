import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/stage2-drag',mode=process.argv[2],pause=ms=>new Promise(r=>setTimeout(r,ms));await mkdir(dir,{recursive:true});
const js=s=>c.evaluate(s);
const hash=b=>createHash('sha256').update(b).digest('hex');
async function click(selector,modifiers=0){const p=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,modifiers,...p});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,modifiers,...p});await pause(120);}
const card=n=>`.mdp-card[data-path="Stage2-Fixtures/${n}"]`;
async function dragStart(name){
  await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;
  const a=await js(`(()=>{const e=document.querySelector(${JSON.stringify(card(name))});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...a});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...a});
  for(let i=1;i<=8;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:a.x+i*3,y:a.y+i*2});
  for(let i=0;i<20&&!c.dragEvents.length;i++)await pause(50);assert.ok(c.dragEvents.length,'Native drag');return c.dragEvents.at(-1).data;
}
async function endDrag(data,p,cancel=false){if(cancel){await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await c.send('Input.dispatchDragEvent',{type:'dragCancel',...p,data});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});}else await c.send('Input.dispatchDragEvent',{type:'drop',...p,data});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});await c.send('Input.setInterceptDrags',{enabled:false});await pause(350);}
try{
  await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1000,deviceScaleFactor:1,mobile:false});
  const vault=await js(`app.vault.adapter.getBasePath()`);assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
  if(mode==='setup'){
    await cp(vault+'/.obsidian',dir+'/backup-obsidian',{recursive:true,errorOnExist:true,force:false});
    const hashes=[];for(const name of await readdir(vault+'/.obsidian'))hashes.push({path:name,sha256:hash(await readFile(vault+'/.obsidian/'+name))});await writeFile(dir+'/backup.json',JSON.stringify({hashes},null,2));
    await cp('.artifacts/stage2/validated-fixtures',vault+'/Stage2-Fixtures',{recursive:true});await cp('.artifacts/stage2/validated-obsidian',vault+'/.obsidian',{recursive:true});
    await js(`(async()=>{await app.plugins.loadManifests();await app.workspace.changeLayout(JSON.parse(await app.vault.adapter.read('.obsidian/workspace.json')));await app.plugins.enablePlugin('md-palette');return true})()`);await pause(1800);
  }
  if(mode==='setup'||mode==='setup-resume'){
    const original=await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`);await writeFile(dir+'/main-original.md',original);
    const before=await js(`app.plugins.plugins['md-palette'].data`);await writeFile(dir+'/seed-data.json',JSON.stringify(before,null,2));
    await js(`app.vault.modify(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'),${JSON.stringify(original+'\n'+Array.from({length:400},(_,i)=>`[[Bulk/Note-${String(i).padStart(4,'0')}]]`).join('\n'))}).then(()=>true)`);
    await js(`(()=>{const p=app.plugins.plugins['md-palette'];p.cards.labelFilter=[];p.cards.labelCollapsed=false;p.cards.display='medium';p.cards.textSize='normal';p.cardsChanged();return true})()`);await pause(2200);
    console.log({version:await js(`app.plugins.plugins['md-palette'].manifest.version`),cards:await js(`document.querySelectorAll('.mdp-card').length`)});
  }
  if(mode==='install'||mode==='baseline-install'){
    await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);for(const name of ['main.js','styles.css','manifest.json'])await cp(mode==='baseline-install'?'.artifacts/stage2/validated-obsidian/plugins/md-palette/'+name:name,`${vault}/.obsidian/plugins/md-palette/${name}`);
    await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePlugin('md-palette');await app.plugins.plugins['md-palette'].openSidebar();return true})()`);console.log(await js(`app.plugins.plugins['md-palette'].manifest.version`));
  }
  if(mode==='baseline'||mode==='drag'){
    const version=await js(`app.plugins.plugins['md-palette'].manifest.version`);assert.equal(version,mode==='baseline'?'0.0.3':'0.0.4');
    const seed=JSON.parse(await readFile(dir+'/seed-data.json','utf8'));
    await js(`(()=>{const p=app.plugins.plugins['md-palette'],seed=${JSON.stringify(seed.cards.order)};p.cards.order=[...seed,...p.cards.order.filter(x=>!seed.includes(x))];p.cards.display='medium';p.cardsChanged();document.querySelector('.mdp-card-grid').scrollTop=0;return true})()`);await pause(250);
    await click(card('C.md'));await click(card('Board.canvas'),2);
    const before=await js(`app.plugins.plugins['md-palette'].cards.order`);const data=await dragStart('C.md');
    const rect=await js(`document.querySelector(${JSON.stringify(card('Paper.pdf'))}).getBoundingClientRect().toJSON()`),p={x:rect.x+rect.width*.75,y:rect.y+rect.height*.65};
    await js(`window.dragIdentity=[...document.querySelectorAll('.mdp-card')];window.dragOriginalRects=window.dragIdentity.slice(0,10).map(e=>e.getBoundingClientRect().toJSON());true`);
    await c.send('Performance.enable');const metrics=()=>c.send('Performance.getMetrics').then(r=>Object.fromEntries(r.metrics.map(m=>[m.name,m.value])));const first=await metrics();
    await c.send('Input.dispatchDragEvent',{type:'dragEnter',...p,data});
    for(let i=0;i<36;i++){await c.send('Input.dispatchDragEvent',{type:'dragOver',x:rect.x+rect.width*(i%2?.75:.25),y:rect.y+rect.height*(i%2?.65:.35),data});await pause(18);}
    const last=await metrics();await c.send('Input.dispatchDragEvent',{type:'dragOver',...p,data});await pause(70);
    if(mode==='drag')for(let i=0;i<30;i++){if(await js(`document.querySelector('.mdp-drop-overlay')?.dataset.side==='after'`))break;await pause(100);}
    const geometry=await js(`({stable:window.dragIdentity.slice(0,10).every((e,i)=>{const a=e.getBoundingClientRect(),b=window.dragOriginalRects[i];return Math.abs(a.x-b.x)<.5&&Math.abs(a.y-b.y)<.5&&Math.abs(a.height-b.height)<.5}),overlay:document.querySelector('.mdp-drop-overlay')?{...document.querySelector('.mdp-drop-overlay').dataset}:null})`);
    await c.screenshot(`${dir}/${mode}-preview.png`);
    await endDrag(data,p);
    const result=await js(`({order:app.plugins.plugins['md-palette'].cards.order,reused:window.dragIdentity.every(e=>e.isConnected),overlayRemoved:!document.querySelector('.mdp-drop-overlay')})`);
    assert.notDeepEqual(result.order,before);
    if(mode==='drag'){assert.ok(geometry.stable);assert.equal(geometry.overlay.axis,'vertical');assert.equal(geometry.overlay.target,'Stage2-Fixtures/Paper.pdf');assert.equal(geometry.overlay.side,'after');assert.ok(result.reused&&result.overlayRemoved);assert.equal(result.order.indexOf('Stage2-Fixtures/C.md'),result.order.indexOf('Stage2-Fixtures/Board.canvas')+1);}
    const report={version,passed:true,geometry,domReused:result.reused,layoutCount:last.LayoutCount-first.LayoutCount,layoutSeconds:last.LayoutDuration-first.LayoutDuration,recalcCount:last.RecalcStyleCount-first.RecalcStyleCount,cards:await js(`document.querySelectorAll('.mdp-card').length`),errors:c.errors};
    assert.deepEqual(c.errors,[]);await writeFile(`${dir}/${mode}-result.json`,JSON.stringify(report,null,2));console.log(report);
    if(mode==='baseline')await js(`(()=>{const p=app.plugins.plugins['md-palette'];p.cards.order=${JSON.stringify(before)};p.cardsChanged();return true})()`);
  }
  if(mode==='list-cancel'){
    await js(`(()=>{const p=app.plugins.plugins['md-palette'];p.cards.display='list';p.cardsChanged();return true})()`);await pause(250);
    await click(card('C.md'));const before=await js(`app.plugins.plugins['md-palette'].cards.order`),data=await dragStart('C.md');
    const r=await js(`document.querySelector(${JSON.stringify(card('Other.xyz'))}).getBoundingClientRect().toJSON()`),p={x:r.x+r.width/2,y:r.bottom-8};await c.send('Input.dispatchDragEvent',{type:'dragEnter',...p,data});await c.send('Input.dispatchDragEvent',{type:'dragOver',...p,data});await pause(80);
    assert.equal(await js(`document.querySelector('.mdp-drop-overlay').dataset.axis`),'horizontal');await c.screenshot(dir+'/list-marker.png');await endDrag(data,p);assert.equal(await js(`app.plugins.plugins['md-palette'].cards.order.indexOf('Stage2-Fixtures/C.md')`),await js(`app.plugins.plugins['md-palette'].cards.order.indexOf('Stage2-Fixtures/Other.xyz')+1`));
    const saved=await js(`app.plugins.plugins['md-palette'].cards.order`),cancelData=await dragStart('C.md');await c.send('Input.dispatchDragEvent',{type:'dragEnter',...p,data:cancelData});await c.send('Input.dispatchDragEvent',{type:'dragOver',...p,data:cancelData});await endDrag(cancelData,p,true);assert.deepEqual(await js(`app.plugins.plugins['md-palette'].cards.order`),saved);assert.equal(await js(`document.querySelectorAll('.mdp-drop-overlay,.mdp-card.is-dragging').length`),0);
    await js(`(()=>{const p=app.plugins.plugins['md-palette'];p.cards.display='medium';p.cardsChanged();app.workspace.requestSaveLayout();return true})()`);await pause(1500);
    const expected=await js(`({cards:app.plugins.plugins['md-palette'].cards,spaces:app.plugins.plugins['md-palette'].data.spaces,unknown:app.plugins.plugins['md-palette'].data.preservedFixture})`);await writeFile(dir+'/restart-expected.json',JSON.stringify(expected,null,2));await writeFile(dir+'/list-cancel-result.json',JSON.stringify({passed:true,list:true,single:true,escapeUnchanged:true,errors:c.errors},null,2));console.log('PASS list marker, single drop, Escape cleanup');
  }
  if(mode==='restart'){
    await js(`app.commands.executeCommandById('md-palette:open-sidebar');true`);await pause(1700);
    const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8')),actual=await js(`({cards:app.plugins.plugins['md-palette'].cards,spaces:app.plugins.plugins['md-palette'].data.spaces,unknown:app.plugins.plugins['md-palette'].data.preservedFixture})`);assert.deepEqual(actual,expected);assert.equal(await js(`app.plugins.plugins['md-palette'].manifest.version`),'0.0.4');await c.screenshot(dir+'/restart.png');await writeFile(dir+'/restart-result.json',JSON.stringify({passed:true,errors:c.errors},null,2));console.log('PASS process restart and order/data preservation');
  }
  if(mode==='finalize'){
    for(const name of ['drag-result','list-cancel-result','restart-result']){const r=JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);}
    const expectedMain=(await readFile(dir+'/main-original.md','utf8'))+'\n'+Array.from({length:400},(_,i)=>`[[Bulk/Note-${String(i).padStart(4,'0')}]]`).join('\n');assert.equal(await readFile(vault+'/Stage2-Fixtures/Main.md','utf8'),expectedMain);
    const walk=async(path,prefix='')=>{const result=[];for(const e of await readdir(path,{withFileTypes:true})){if(e.isDirectory())result.push(...await walk(path+'/'+e.name,prefix+e.name+'/'));else result.push(prefix+e.name);}return result;};
    const files=await walk('.artifacts/stage2/validated-fixtures');for(const path of files)if(path!=='Main.md')assert.equal(hash(await readFile(vault+'/Stage2-Fixtures/'+path)),hash(await readFile('.artifacts/stage2/validated-fixtures/'+path)),path);
    const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const local=await readFile(name);assert.deepEqual(local,await readFile(`${vault}/.obsidian/plugins/md-palette/${name}`));assets.push({name,sha256:hash(local),bytes:local.length});}
    await writeFile(dir+'/release-ready.json',JSON.stringify({version:'0.0.4',passed:true,assets,filesUnchanged:files.length},null,2));console.log('PASS final assets and 2013 fixture files unchanged by reorder');
  }
}finally{c.close();}
