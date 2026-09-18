import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { connect } from './cdp.mjs';

const c = await connect();
const dir = '.artifacts/stage1';
await mkdir(dir, {recursive:true});
const mode=process.argv[2];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const evalJS=expression=>c.evaluate(expression);
async function state() {
  // Electron throttles background timers; let the UI's debounced refresh settle.
  await pause(2300);
  return evalJS(`(() => {
    const p=app.plugins.plugins['md-palette'];
    const describe=g=>g?{id:g.id,active:g.currentTab,files:g.children.map(l=>l.getViewState().state.file??l.getViewState().type),leafIds:g.children.map(l=>l.id)}:null;
    return {version:p.manifest.version,main:describe(p.mainGroup),sub:describe(p.subGroup),reference:describe(p.referenceGroup),mainFile:p.mainFile?.path??null,emptySub:describe(p.emptySub),sidebar:document.querySelector('.mdp-sidebar')?.innerText,icons:Array.from(document.querySelectorAll('.mdp-space-icon')).map(e=>({label:e.getAttribute('aria-label'),tab:e.parentElement.innerText})),groups:app.workspace.rootSplit.children.map(g=>g.id)};
  })()`);
}
async function command(id) { await evalJS(`app.commands.executeCommandById('md-palette:${id}'); true`); await pause(220); }
async function mouse(point,button='left') {
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button,clickCount:1,...point});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button,clickCount:1,...point});
  await pause(150);
}
async function click(selector) {
  const point=await evalJS(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await mouse(point);
}
async function menu(title) {
  const point=await evalJS(`(()=>{const el=Array.from(document.querySelectorAll('.menu-item')).find(e=>e.querySelector('.menu-item-title')?.textContent===${JSON.stringify(title)});if(!el)throw Error('Missing menu '+${JSON.stringify(title)}+'; '+Array.from(document.querySelectorAll('.menu-item')).map(e=>e.innerText).join('|'));const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await mouse(point); await pause(250);
}
async function tabMenu(leafId) {
  const point=await evalJS(`(()=>{const el=app.workspace.getLeafById(${JSON.stringify(leafId)}).tabHeaderEl;const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await mouse(point,'right');
}
async function pick(role,name) {
  await command('open-'+role);
  await c.send('Input.insertText',{text:name});
  let point;
  for(let i=0;i<20;i++) {
    point=await evalJS(`(()=>{const el=Array.from(document.querySelectorAll('.suggestion-item')).find(e=>e.textContent.trim()===${JSON.stringify('Stage1-Fixtures/'+name)});if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    if(point)break;
    await pause(200);
  }
  assert.ok(point,'Exact file suggestion '+name);
  await mouse(point);await pause(350);
  const path=await evalJS(`(()=>{const g=app.plugins.plugins['md-palette'][${JSON.stringify(role+'Group')}];return g?.children[g.currentTab]?.getViewState().state.file})()`);
  assert.equal(path,'Stage1-Fixtures/'+name);
}
try {
  if(mode==='setup') {
    await evalJS(`(async()=>{
      if(!app.vault.getName().includes('Stage0-Sandbox'))throw Error('Wrong vault');
      if(!app.vault.getAbstractFileByPath('Stage1-Fixtures')) {
        await app.vault.createFolder('Stage1-Fixtures');
        for(const name of ['A','A-inactive','B','B-inactive','C','Ordinary','Ordinary-inactive']) await app.vault.create('Stage1-Fixtures/'+name+'.md','# '+name+'\\n\\n원본 본문 보존. [[B]] 및 [[Board.canvas]]\\n');
        await app.vault.create('Stage1-Fixtures/Board.canvas',JSON.stringify({nodes:[],edges:[]}));
        await app.vault.create('Stage1-Fixtures/Image.svg','<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="teal"/></svg>');
      }
      const leaf=(id,name)=>({id,type:'leaf',state:{type:'markdown',state:{file:'Stage1-Fixtures/'+name+'.md',mode:'source',source:false}}});
      const layout=app.workspace.getLayout();
      layout.main.children=[{id:'s1-main',type:'tabs',children:[leaf('s1-a','A'),leaf('s1-a2','A-inactive')]},{id:'s1-ordinary',type:'tabs',children:[leaf('s1-o','Ordinary'),leaf('s1-o2','Ordinary-inactive')]}];
      layout.active='s1-a';layout.left.collapsed=true;layout.right.width=330;
      await app.workspace.changeLayout(layout);
      const p=app.plugins.plugins['md-palette'];
      p.data.preservedFixture={labels:['keep-me'],nested:{value:42}};
      await p.saveData(p.data);
      return true;
    })()`);
    await c.send('Emulation.setDeviceMetricsOverride',{width:1680,height:1000,deviceScaleFactor:1,mobile:false});
    await command('open-sidebar');
    assert.match((await state()).sidebar,/메인 스페이스를 먼저/);
    await c.screenshot(`${dir}/no-main.png`);
    console.log('PASS setup and sidebar no-Main state');
  }
  if(mode==='ui') {
    await tabMenu('s1-a');
    await c.screenshot(`${dir}/set-main-menu.png`);
    await menu('메인 스페이스로 지정');
    let s=await state(); assert.equal(s.mainFile,'Stage1-Fixtures/A.md'); assert.equal(s.icons.length,1);
    await command('set-main'); assert.equal((await state()).main.id,'s1-main');
    await pick('sub','B.md');
    s=await state(); assert.ok(s.sub.files.includes('Stage1-Fixtures/B.md'));
    const subId=s.sub.id;
    await pick('sub','C.md'); assert.equal((await state()).sub.id,subId);
    await pick('sub','B.md');
    await evalJS(`(async()=>{const p=app.plugins.plugins['md-palette'],g=p.subGroup;const l=app.workspace.createLeafInParent(g,g.children.length);await l.openFile(app.vault.getAbstractFileByPath('Stage1-Fixtures/B-inactive.md'));app.workspace.setActiveLeaf(g.children[0]);return true;})()`);
    await pause(120);
    await pick('reference','Board.canvas');
    await pick('reference','Image.svg');
    await pick('reference','B.md');
    const beforeDuplicate=await state();
    await pick('reference','B.md');
    s=await state(); assert.equal(s.reference.files.length,3);assert.equal(s.reference.id,beforeDuplicate.reference.id);
    assert.equal(s.icons.length,3);
    // Switch through the actual Main tab context menu.
    await evalJS(`app.workspace.setActiveLeaf(app.workspace.getLeafById('s1-a'));true`);await pause(100);
    await tabMenu('s1-a'); await menu('메인 / 서브 전환');
    s=await state();assert.equal(s.mainFile,'Stage1-Fixtures/B.md');assert.equal(s.sub.files[0],'Stage1-Fixtures/A.md');assert.equal(s.main.files[1],'Stage1-Fixtures/A-inactive.md');assert.equal(s.sub.files[1],'Stage1-Fixtures/B-inactive.md');
    await c.screenshot(`${dir}/spaces-and-sidebar.png`);
    await click('.mdp-tabs button:nth-child(2)');assert.match((await state()).sidebar,/Metadata View는/);
    await click('.mdp-tabs button:nth-child(1)');await click('.mdp-link-tabs button:nth-child(3)');assert.match((await state()).sidebar,/Folder View는/);
    const overflow=await evalJS(`(()=>{const e=document.querySelector('.mdp-sidebar');return {scroll:e.scrollWidth,client:e.clientWidth}})()`);
    assert.ok(overflow.scroll<=overflow.client);
    await writeFile(`${dir}/ui-result.json`,JSON.stringify({state:s,overflow,exceptions:c.errors},null,2));
    console.log('PASS native menu, role icons, Sub reuse, Reference multi-file/dedup, active-file switch, sidebar tabs');
  }
  if(mode==='state') console.log(await state());
  if(mode==='lifecycle') {
    let s=await state();
    // Selecting another tab moves the role icon and changes the sidebar context.
    await evalJS(`app.workspace.setActiveLeaf(app.workspace.getLeafById('s1-a2'));true`);await pause(120);
    assert.equal((await state()).mainFile,'Stage1-Fixtures/A-inactive.md');
    await evalJS(`app.workspace.setActiveLeaf(app.workspace.getLeafById('s1-a'));true`);await pause(100);
    // Non-Markdown in Main keeps its group role and disables Main-based actions.
    await evalJS(`(async()=>{const p=app.plugins.plugins['md-palette'];const l=app.workspace.createLeafInParent(p.mainGroup,p.mainGroup.children.length);await l.openFile(app.vault.getAbstractFileByPath('Stage1-Fixtures/Board.canvas'));window.s1CanvasLeaf=l;return true;})()`);await pause(150);
    s=await state();assert.ok(s.main);assert.equal(s.mainFile,null);assert.match(s.sidebar,/Markdown 파일을 활성화/);
    await c.screenshot(`${dir}/main-non-markdown.png`);
    await evalJS(`app.workspace.setActiveLeaf(app.workspace.getLeafById('s1-a'));true`);await pause(120);
    assert.equal((await state()).mainFile,'Stage1-Fixtures/B.md');
    // Other tabs in a Reference remain when one closes.
    await evalJS(`app.plugins.plugins['md-palette'].referenceGroup.children[0].detach();true`);await pause(150);
    assert.equal((await state()).reference.files.length,2);
    // Inject an ordinary group between managed groups, as a changed native layout.
    const old=await state();
    await evalJS(`(()=>{const p=app.plugins.plugins['md-palette'];const root=p.mainGroup.parent;const ordinary=root.children.find(g=>g.id==='s1-ordinary');window.s1OrdinaryLeaves=[...ordinary.children];root.removeChild(ordinary);root.insertChild(root.children.indexOf(p.mainGroup)+1,ordinary);return true;})()`);await pause(180);
    s=await state();assert.deepEqual(s.groups.slice(0,3),[s.main.id,s.sub.id,s.reference.id]);
    assert.ok(await evalJS(`window.s1OrdinaryLeaves.every(l=>app.workspace.getLeafById(l.id)===l)`));
    // New Main: old Main becomes ordinary; Sub becomes native blank; Reference closes.
    const oldMainId=s.main.id,oldSubId=s.sub.id;
    await evalJS(`app.workspace.setActiveLeaf(app.workspace.getLeafById('s1-o'));true`);await pause(120);
    await tabMenu('s1-o');await menu('메인 스페이스로 지정');
    s=await state();assert.equal(s.main.id,'s1-ordinary');assert.equal(s.mainFile,'Stage1-Fixtures/Ordinary.md');assert.equal(s.reference,null);assert.equal(s.sub,null);assert.equal(s.emptySub.id,oldSubId);assert.deepEqual(s.emptySub.files,['empty']);assert.ok(s.groups.includes(oldMainId));assert.equal(s.icons.length,1);
    await c.screenshot(`${dir}/new-main-native-empty.png`);
    await pick('sub','A.md');s=await state();assert.equal(s.sub.id,oldSubId);
    // Sub tab context menu must not allow Main designation.
    await tabMenu(s.sub.leafIds[0]);
    assert.equal(await evalJS(`Array.from(document.querySelectorAll('.menu-item-title')).some(e=>e.textContent==='메인 스페이스로 지정')`),false);
    await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await evalJS(`app.plugins.plugins['md-palette'].subGroup.children[0].detach();true`);await pause(150);assert.equal((await state()).sub,null);
    await command('switch-main-sub');assert.match(await evalJS(`document.querySelector('.notice-container')?.innerText??''`),/서브 스페이스가 없어/);
    await pick('reference','Board.canvas');
    await evalJS(`app.plugins.plugins['md-palette'].referenceGroup.children[0].detach();true`);await pause(150);assert.equal((await state()).reference,null);
    await pick('sub','A.md');await pick('reference','Board.canvas');
    // Closing the Main group releases roles without closing the other groups.
    await evalJS(`(()=>{const p=app.plugins.plugins['md-palette'];window.s1KeepGroups=[p.subGroup,p.referenceGroup];for(const l of [...p.mainGroup.children])l.detach();return true;})()`);await pause(150);
    s=await state();assert.equal(s.main,null);assert.equal(s.sub,null);assert.equal(s.reference,null);assert.match(s.sidebar,/메인 스페이스를 먼저/);
    assert.ok(await evalJS(`window.s1KeepGroups.every(g=>g.children.length>0&&g.parent)`));
    // Re-establish an explicit Main for restart checks; no auto successor.
    await evalJS(`app.workspace.setActiveLeaf(app.workspace.getLeafById('s1-a'));true`);await pause(100);
    await tabMenu('s1-a');await menu('메인 스페이스로 지정');
    await pick('sub','A.md');await pick('reference','Board.canvas');
    await click('.mdp-tabs button:nth-child(2)');
    await pause(400);
    const final=await state();
    const saved=await evalJS(`app.plugins.plugins['md-palette'].loadData()`);
    assert.deepEqual(saved.preservedFixture,{labels:['keep-me'],nested:{value:42}});
    await evalJS('app.workspace.saveLayout();true');
    await writeFile(`${dir}/restart-expected.json`,JSON.stringify({state:final,data:saved},null,2));
    await writeFile(`${dir}/lifecycle-result.json`,JSON.stringify({passed:true,exceptions:c.errors},null,2));
    console.log('PASS active tab/icon, non-MD, order protection, new Main blank/reuse, Sub/Reference close, no auto Main, unknown data preserved');
  }
  if(mode==='restart') {
    await pause(200);
    const expected=JSON.parse(await readFile(`${dir}/restart-expected.json`,'utf8'));
    const s=await state();
    assert.equal(s.version,'0.0.2');
    for(const role of ['main','sub','reference']) assert.deepEqual(s[role],expected.state[role]);
    assert.equal(s.mainFile,expected.state.mainFile);assert.equal(s.icons.length,3);
    const saved=await evalJS(`app.plugins.plugins['md-palette'].loadData()`);
    assert.deepEqual(saved,expected.data);
    assert.match(s.sidebar,/Metadata View는/);
    await c.screenshot(`${dir}/restart.png`);
    await writeFile(`${dir}/restart-result.json`,JSON.stringify({passed:true,state:s,data:saved,exceptions:c.errors},null,2));
    console.log('PASS restart: roles attached to existing groups; tabs and view state preserved');
  }
  if(mode==='restore-cases') {
    const expected=JSON.parse(await readFile(`${dir}/restart-expected.json`,'utf8'));
    const layout=JSON.parse(await readFile(`${dir}/workspace-before-restart.json`,'utf8'));
    await evalJS(`app.plugins.disablePlugin('md-palette')`);await pause(500);
    await evalJS(`(()=>{const id=${JSON.stringify(expected.state.sub.id)};const leaves=[];app.workspace.iterateAllLeaves(l=>{if(l.parent.id===id)leaves.push(l)});for(const l of leaves)l.detach();return true;})()`);await pause(1500);
    await evalJS(`app.plugins.enablePlugin('md-palette')`);
    let s=await state();assert.equal(s.sub,null);assert.ok(s.main&&s.reference);assert.ok(!s.groups.includes(expected.state.sub.id));
    await evalJS(`app.plugins.disablePlugin('md-palette')`);await pause(500);
    await evalJS(`(()=>{const id=${JSON.stringify(expected.state.main.id)};const leaves=[];app.workspace.iterateAllLeaves(l=>{if(l.parent.id===id)leaves.push(l)});for(const l of leaves)l.detach();return true;})()`);await pause(1500);
    await evalJS(`app.plugins.enablePlugin('md-palette')`);
    s=await state();assert.equal(s.main,null);assert.equal(s.sub,null);assert.equal(s.reference,null);
    // Restore the previously tested arrangement, not missing files/groups by plugin logic.
    await evalJS(`app.plugins.disablePlugin('md-palette')`);await pause(500);
    await evalJS(`app.vault.adapter.write('.obsidian/plugins/md-palette/data.json',${JSON.stringify(JSON.stringify(expected.data))})`);
    await evalJS(`app.workspace.changeLayout(${JSON.stringify(layout)})`);
    await evalJS(`app.plugins.enablePlugin('md-palette')`);
    s=await state();assert.ok(s.main&&s.sub&&s.reference);
    await command('open-sidebar');
    await writeFile(`${dir}/restore-cases.json`,JSON.stringify({missingSubNotCreated:true,missingMainReleasesAll:true,restoredFixture:true,exceptions:c.errors},null,2));
    console.log('PASS missing Sub is not recreated; missing Main prevents all role restoration');
  }
  if(mode==='visual') {
    await c.send('Emulation.setDeviceMetricsOverride',{width:1680,height:1000,deviceScaleFactor:1,mobile:false});
    await evalJS(`app.vault.setConfig('theme','obsidian');app.updateTheme();app.workspace.rightSplit.setSize(300);true`);await pause(1400);
    assert.ok(await evalJS(`document.body.classList.contains('theme-dark')`));
    await c.screenshot(`${dir}/dark-spaces.png`);
    await evalJS(`app.workspace.rightSplit.setSize(220);true`);await pause(1400);
    const bounds=await evalJS(`(()=>{const el=document.querySelector('.mdp-sidebar');return {scroll:el.scrollWidth,client:el.clientWidth,buttons:Array.from(el.querySelectorAll('button')).map(b=>({text:b.innerText,rect:b.getBoundingClientRect().toJSON()}))}})()`);
    assert.ok(bounds.scroll<=bounds.client);
    assert.ok(bounds.client<=220);
    for(const b of bounds.buttons)assert.ok(b.rect.width>0&&b.rect.height>0);
    await c.screenshot(`${dir}/narrow-sidebar.png`);
    await evalJS(`app.workspace.rightSplit.setSize(330);true`);
    // Picker cancellation must leave the workspace and roles unchanged.
    const before=await state();await command('open-sub');
    await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    const after=await state();for(const role of ['main','sub','reference'])assert.deepEqual(after[role],before[role]);
    await writeFile(`${dir}/visual-result.json`,JSON.stringify({bounds,cancelUnchanged:true,exceptions:c.errors},null,2));
    console.log('PASS theme rendering, narrow sidebar no horizontal overflow, picker cancel no change');
  }
  if(mode==='drag') {
    await c.send('Emulation.setDeviceMetricsOverride',{width:1680,height:1000,deviceScaleFactor:1,mobile:false});
    const probe=await evalJS(`(()=>{const p=app.plugins.plugins['md-palette'];const groups=app.workspace.rootSplit.children;const ordinary=groups.find(g=>g.type==='tabs'&&![p.mainGroup,p.subGroup,p.referenceGroup].includes(g)&&g.children.length===1);if(!ordinary)throw Error('No ordinary test group');const leaf=ordinary.children[0];const a=leaf.tabHeaderEl.getBoundingClientRect(),b=p.mainGroup.containerEl.getBoundingClientRect();window.s1BeforeDrag=groups.flatMap(g=>g.children.map(l=>({id:l.id,file:l.getViewState().state.file})));return {leafId:leaf.id,oldParent:ordinary.id,start:{x:a.x+a.width/2,y:a.y+a.height/2},end:{x:b.right-6,y:b.y+b.height/2}};})()`);
    await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...probe.start});
    await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...probe.start});
    for(let step=1;step<=12;step++) {
      const ratio=step/12;
      await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:probe.start.x+(probe.end.x-probe.start.x)*ratio,y:probe.start.y+(probe.end.y-probe.start.y)*ratio});
      await pause(70);
    }
    await pause(200);
    await c.screenshot(`${dir}/drag-preview.png`);
    await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...probe.end});
    await pause(1800);
    const s=await state();
    const result=await evalJS(`({newParent:app.workspace.getLeafById(${JSON.stringify(probe.leafId)})?.parent.id,preserved:window.s1BeforeDrag.every(v=>app.workspace.getLeafById(v.id)?.getViewState().state.file===v.file)})`);
    assert.notEqual(result.newParent,probe.oldParent,'Native drag must actually relocate the ordinary tab');
    assert.ok(result.preserved);
    assert.deepEqual(s.groups.slice(s.groups.indexOf(s.main.id),s.groups.indexOf(s.main.id)+3),[s.main.id,s.sub.id,s.reference.id]);
    await c.screenshot(`${dir}/drag-repaired.png`);
    await writeFile(`${dir}/drag-result.json`,JSON.stringify({probe,result,state:s,exceptions:c.errors},null,2));
    console.log('PASS native tab drag: ordinary tab relocated, all leaves/files preserved, managed groups adjacent in order');
  }
  if(mode==='nested') {
    const before=await evalJS(`(()=>{const ids=[];app.workspace.iterateAllLeaves(l=>ids.push(l.id));return ids})()`);
    await evalJS(`app.workspace.setActiveLeaf(app.workspace.getLeafById('s1-a'));true`);await pause(200);
    await tabMenu('s1-a');await menu('하단 분할');
    await pause(2500);
    const result=await evalJS(`(()=>{const p=app.plugins.plugins['md-palette'];const parent=p.mainGroup.parent;return {direction:parent.direction,adjacent:parent.children[parent.children.indexOf(p.mainGroup)+1]===p.subGroup&&parent.children[parent.children.indexOf(p.mainGroup)+2]===p.referenceGroup,preserved:${JSON.stringify(before)}.every(id=>!!app.workspace.getLeafById(id)),rootType:app.workspace.rootSplit.children[0].type}})()`);
    assert.equal(result.direction,'vertical');assert.ok(result.adjacent&&result.preserved);
    await c.screenshot(`${dir}/nested-split.png`);
    await writeFile(`${dir}/nested-result.json`,JSON.stringify({result,exceptions:c.errors},null,2));
    console.log('PASS native split down: managed groups remain a left-to-right row and all original tabs survive');
  }
  if(mode==='failure') {
    const before=await state();
    await evalJS(`(()=>{const p=app.plugins.plugins['md-palette'];const leaf=p.subGroup.children[p.subGroup.currentTab];window.s1Open=leaf.openFile;window.s1FailLeaf=leaf;leaf.openFile=async()=>{throw Error('Intentional stage1 open failure')};return true})()`);
    await command('switch-main-sub');await pause(1600);
    await evalJS(`window.s1FailLeaf.openFile=window.s1Open;true`);
    const after=await state();for(const role of ['main','sub','reference'])assert.deepEqual(after[role],before[role]);
    const candidate=await evalJS(`(()=>{const p=app.plugins.plugins['md-palette'];let leaf;app.workspace.iterateAllLeaves(l=>{if(l.getViewState().type==='markdown'&&![p.mainGroup,p.subGroup,p.referenceGroup].includes(l.parent))leaf=l});return leaf?.id})()`);
    assert.ok(candidate);
    await evalJS(`(()=>{const p=app.plugins.plugins['md-palette'];window.s1Create=app.workspace.createLeafInParent;app.workspace.createLeafInParent=function(parent,index){const leaf=window.s1Create.call(this,parent,index);if(parent===p.subGroup){const original=leaf.setViewState;leaf.setViewState=async function(){leaf.setViewState=original;throw Error('Intentional stage1 blank failure')}}return leaf};app.workspace.setActiveLeaf(app.workspace.getLeafById(${JSON.stringify(candidate)}));return true})()`);
    await command('set-main');await pause(1600);
    await evalJS(`app.workspace.createLeafInParent=window.s1Create;true`);
    const failed=await state();for(const role of ['main','sub','reference'])assert.deepEqual(failed[role],before[role]);
    await writeFile(`${dir}/failure-result.json`,JSON.stringify({switchRollback:true,newMainPrepareRollback:true,expectedHandledErrors:2,uncaught:c.errors},null,2));
    console.log('PASS injected open failure rolls back switch; failed blank preparation leaves roles and tabs intact');
  }
  if(mode==='prepare-restart') {
    await pause(1500);
    const s=await state();const data=await evalJS(`app.plugins.plugins['md-palette'].loadData()`);
    const layout=await evalJS('app.workspace.getLayout()');
    await writeFile(`${dir}/restart-expected.json`,JSON.stringify({state:s,data},null,2));
    await writeFile(`${dir}/workspace-before-restart.json`,JSON.stringify(layout,null,2));
    await evalJS('app.workspace.saveLayout();true');
    console.log('Saved final restart expectations');
  }
  assert.deepEqual(c.errors,[]);
} finally {c.close();}
