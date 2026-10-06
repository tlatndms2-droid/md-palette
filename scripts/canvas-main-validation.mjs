import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { c, p, js, pause, wait, tap, click, textClick, key, type } from './stage4-helpers.mjs';
const dir='.artifacts/canvas-main', mode=process.argv[2]??'ui', root='CanvasMain-Review', j=JSON.stringify;
const path=name=>`${root}/${name}`, hash=v=>createHash('sha256').update(v).digest('hex');
const checks=[],pass=s=>{checks.push(s);console.log('PASS',s)};
const board=JSON.stringify({nodes:[{id:'text',type:'text',x:0,y:0,width:320,height:160,text:'Canvas 내용은 변경하지 않습니다.'},{id:'file',type:'file',file:path('Node.md'),x:400,y:0,width:320,height:180}],edges:[{id:'edge',fromNode:'text',toNode:'file',fromSide:'right',toSide:'left'}]},null,2);
const fixtures={
 'Board.canvas':board,'Other.canvas':JSON.stringify({nodes:[],edges:[]}),
 'OldMain.md':'# 이전 Main\n\n[[Board.canvas]]\n',
 'Node.md':'# Canvas 안의 노트\n\n- [ ] 카드 작업\n',
 'Reverse.md':'---\ntopic: keep\nlink note:\n  - "[[OldMain.md]]"\n---\n# 새 연결 대상\n\n- [ ] 확인할 작업\n\n본문 유지\n',
 'FolderNote.md':'# 폴더 연결 대상\n', 'SubNote.md':'# Sub 지정 대상\n',
 'Unrelated.md':'# 이미 열려 있는 다른 탭\n', 'Cancel.md':'# 취소 대상\n',
};
const snapshot=()=>js(`(()=>{const leaves=[];app.workspace.iterateAllLeaves(l=>{if(l.getRoot()===app.workspace.rootSplit)leaves.push({id:l.id,group:l.parent.id,file:l.getViewState().state?.file,type:l.getViewState().type})});return{main:${p}.mainFile?.path,mainGroup:${p}.mainGroup?.id,sub:${p}.subGroup?.id,leaves,folders:JSON.parse(JSON.stringify(${p}.foldersByMain))}})()`);
async function tab(expr,button='left'){
 const pt=await js(`(()=>{const e=(${expr}).tabHeaderEl;e.scrollIntoView({block:'nearest'});const r=(e.querySelector('.workspace-tab-header-inner-title')??e).getBoundingClientRect();return{x:r.x+Math.min(12,r.width/2),y:r.y+r.height/2}})()`);await tap(pt,button);
}
async function menu(expr,title='메인 스페이스로 지정'){await tab(expr);await pause(180);await tab(expr,'right');await textClick('.menu-item-title',title);await pause(220);await wait(`!${p}.busy`)}
async function save(){await js(`${p}.flushState();app.workspace.requestSaveLayout();${p}.saveChain.then(()=>true)`);await pause(1600)}
async function choose(name){await wait(`!!document.querySelector('.prompt-input')`);await click('.prompt-input');await type(name);await key('Enter','Enter',13);await pause(350);await wait(`!${p}.busy`)}
async function boardUnchanged(vault){assert.equal(hash(await readFile(`${vault}/${path('Board.canvas')}`)),hash(board));assert.deepEqual(await js('cm.Board.view.canvas.getData().nodes.map(n=>n.id).sort()'),['file','text'])}
async function locals(){await js(`window.cm={};app.workspace.iterateAllLeaves(l=>{const f=l.getViewState().state?.file;if(f?.startsWith(${j(root+'/')}))cm[f.split('/').at(-1).split('.')[0]]=l});true`)}

try{
 await mkdir(dir,{recursive:true});const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
 if(mode==='install'||mode==='reset'){
  if(mode==='install'){
   assert.equal(await js(`${p}.manifest.version`),'0.1.13');await save();
   await cp(`${vault}/.obsidian`,`${dir}/pretest-obsidian`,{recursive:true});
   await cp(`${vault}/Swap-Review`,`${dir}/pretest-swap-review`,{recursive:true});
  }
  await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
  if(mode==='reset')await cp(`${dir}/pretest-obsidian/plugins/md-palette/data.json`,`${vault}/.obsidian/plugins/md-palette/data.json`);
  const assets=[];for(const name of ['main.js','manifest.json','styles.css']){await cp(name,`${vault}/.obsidian/plugins/md-palette/${name}`);const sha256=hash(await readFile(name));assert.equal(hash(await readFile(`${vault}/.obsidian/plugins/md-palette/${name}`)),sha256);assets.push({name,sha256})}
  await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return true})()`);await wait(`${p}?.ready`);assert.equal(await js(`${p}.manifest.version`),'0.1.14');
  await js(`(async()=>{if(!app.vault.getAbstractFileByPath(${j(root)}))await app.vault.createFolder(${j(root)});for(const[name,body]of Object.entries(${j(fixtures)})){const path=${j(root)}+'/'+name,existing=app.vault.getAbstractFileByPath(path);if(existing){if(await app.vault.read(existing)!==body)await app.vault.modify(existing,body)}else await app.vault.create(path,body);}return true})()`);
  if(mode==='reset')await js(`(async()=>{const created=app.vault.getMarkdownFiles().find(f=>f.basename==='CanvasMain-New-014');if(created)await app.vault.delete(created);return true})()`);
  await js(`(async()=>{await ${p}.unsetMain();window.cm={};const f=n=>app.vault.getAbstractFileByPath(${j(root)}+'/'+n);const old=app.workspace.createLeafBySplit(app.workspace.getMostRecentLeaf(),'vertical');await old.openFile(f('OldMain.md'));cm.OldMain=old;const other=app.workspace.createLeafInParent(old.parent,old.parent.children.length);await other.openFile(f('Unrelated.md'));cm.Unrelated=other;const board=app.workspace.createLeafBySplit(old,'vertical');await board.openFile(f('Board.canvas'));cm.Board=board;const spare=app.workspace.createLeafInParent(board.parent,board.parent.children.length);await spare.openFile(f('Other.canvas'));cm.Other=spare;await ${p}.setMain(old);await ${p}.toggleSub(board);app.workspace.setActiveLeaf(board,{focus:true});${p}.selectView('link','card');app.workspace.leftSplit.collapse();app.workspace.rightSplit.setSize(400);return true})()`);
  await pause(800);await save();await cp(`${vault}/${root}`,`${dir}/fixture-backup`,{recursive:true});
  await writeFile(`${dir}/install.json`,j({version:'0.1.14',vault,assets}));console.log('Native links',await js(`app.metadataCache.resolvedLinks[${j(path('Board.canvas'))}]`));pass('final version installed; original Sandbox configuration and fixtures backed up');
 }else if(mode==='reload'){
  await save();await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
  const assets=[];for(const name of ['main.js','manifest.json','styles.css']){await cp(name,`${vault}/.obsidian/plugins/md-palette/${name}`);const sha256=hash(await readFile(name));assert.equal(hash(await readFile(`${vault}/.obsidian/plugins/md-palette/${name}`)),sha256);assets.push({name,sha256})}
  await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return true})()`);await wait(`${p}?.ready`);
  await writeFile(`${dir}/install.json`,j({version:'0.1.14',vault,assets}));
 }else if(mode==='ui'){
  await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1800,height:1050,deviceScaleFactor:1,mobile:false});await locals();
  const before=await snapshot();await c.screenshot(`${dir}/before.png`);
  await tab('cm.Board');await tab('cm.Board','right');assert.ok(await js(`Array.from(document.querySelectorAll('.menu-item-title')).some(e=>e.textContent==='메인 스페이스로 지정')`));await c.screenshot(`${dir}/canvas-menu.png`);await textClick('.menu-item-title','메인 스페이스로 지정');await pause(300);
  const after=await snapshot();assert.equal(after.main,path('Board.canvas'));assert.equal(after.sub,before.mainGroup);assert.equal(after.mainGroup,before.sub);assert.deepEqual(after.leaves,before.leaves);
  assert.equal(await js(`document.querySelectorAll('[aria-label="Main Space"]').length`),1);assert.equal(await js(`document.querySelectorAll('[aria-label="Sub Space"]').length`),1);
  await tab('cm.Unrelated');assert.equal(await js('app.workspace.getMostRecentLeaf().id'),await js('cm.Unrelated.id'));
  await boardUnchanged(vault);pass('Canvas native tab menu promotes Sub to Main; tabs, roles and Canvas bytes are preserved');
  const linked=await js(`${p}.connectedFiles().map(f=>f.path)`);assert.ok(linked.includes(path('OldMain.md')));assert.ok(linked.includes(path('Node.md')));
  await textClick('.mdp-tabs button','Connections');await pause(400);assert.match(await js(`document.querySelector('[data-section="backlinks"]').innerText`),/OldMain/);assert.match(await js(`document.querySelector('[data-section="outgoing"]').innerText`),/Node/);
  await c.screenshot(`${dir}/connections.png`);pass('native Canvas outgoing file card and incoming Markdown backlink appear in Connections');
  await textClick('.mdp-tabs button','Card');await textClick('button','+ 연결 파일 추가');await choose('Reverse');
  await wait(`!!app.metadataCache.resolvedLinks[${j(path('Reverse.md'))}]?.[${j(path('Board.canvas'))}]`);
  const reverse=await readFile(`${vault}/${path('Reverse.md')}`,'utf8');assert.ok(reverse.includes(`[[${path('Board.canvas')}]]`));assert.ok(reverse.includes('topic: keep'));assert.ok(reverse.includes('[[OldMain.md]]'));assert.ok(reverse.endsWith('# 새 연결 대상\n\n- [ ] 확인할 작업\n\n본문 유지\n'));
  await boardUnchanged(vault);await c.screenshot(`${dir}/reverse-link.png`);pass('Add connection writes only the selected note link note property; Canvas gains no cards and existing content remains');
  await textClick('button','+ 연결 파일 추가');await choose('Reverse');assert.equal(await readFile(`${vault}/${path('Reverse.md')}`,'utf8'),reverse);
  await click(`.mdp-card[data-path=${j(path('Reverse.md'))}]`,'left',2);await pause(250);await locals();assert.equal(await js('app.workspace.getMostRecentLeaf().getViewState().state.file'),path('Reverse.md'));
  await menu('cm.Reverse');assert.equal((await snapshot()).main,path('Reverse.md'));await menu('cm.Board');assert.equal((await snapshot()).main,path('Board.canvas'));await boardUnchanged(vault);
  pass('duplicate connection is unchanged; linked note opens in Sub and Markdown/Canvas can swap both ways');
  await textClick('.mdp-tabs button','Metadata View');await pause(250);assert.match(await js('document.body.innerText'),/Canvas 자체에는 Markdown 메타데이터가 없습니다/);
  await click('.mdp-source-toggle');await textClick('.mdp-source-file','Reverse.md');await pause(250);assert.equal(await js(`${p}.metadataFile.path`),path('Reverse.md'));
  assert.match(await js(`document.querySelector('.mdp-metadata-sections').innerText`),/확인할 작업/);await c.screenshot(`${dir}/metadata.png`);pass('Canvas JSON is never parsed as Markdown metadata; a linked note can be selected and read');
  await textClick('.mdp-tabs button','Link View');await textClick('.mdp-tabs button','Folder');
  await js(`${p}.changeFolders(s=>{s.folders.push({id:'canvas-folder',name:'Canvas별 정리',parent:''});s.order.push('d:canvas-folder')}).then(()=>true)`);
  await js(`${p}.addFolderConnection(${p}.mainFile,app.vault.getAbstractFileByPath(${j(path('FolderNote.md'))}),'canvas-folder').then(()=>true)`);
  await wait(`!!app.metadataCache.resolvedLinks[${j(path('FolderNote.md'))}]?.[${j(path('Board.canvas'))}]`);
  assert.equal(await js(`${p}.folders.positions[${j(path('FolderNote.md'))}]`),'canvas-folder');await boardUnchanged(vault);pass('Canvas-specific folder organization and reverse-link folder addition work together');
  await textClick('.mdp-tabs button','Card');await textClick('button','+ 새 링크 파일 추가');assert.deepEqual(await js(`Array.from(document.querySelectorAll('.mdp-new-note select option')).map(e=>e.value)`),['md']);
  await click('.mdp-new-note input');await type('CanvasMain-New-014');await textClick('.modal button','만들고 연결');await wait(`!document.querySelector('.mdp-new-note')`);
  const newPath=await js(`app.vault.getMarkdownFiles().find(f=>f.basename==='CanvasMain-New-014')?.path`);assert.ok(newPath);assert.ok((await readFile(`${vault}/${newPath}`,'utf8')).includes(`[[${path('Board.canvas')}]]`));await writeFile(`${dir}/created-note.json`,j({path:newPath}));
  await boardUnchanged(vault);pass('new linked Markdown note stores the Canvas backlink without adding Canvas nodes');
  await tab('cm.Other');await js(`app.commands.executeCommandById('md-palette:set-main');true`);await pause(250);assert.equal((await snapshot()).main,path('Other.canvas'));
  await tab('cm.Board');await js(`app.commands.executeCommandById('md-palette:set-main');true`);await pause(250);assert.equal((await snapshot()).main,path('Board.canvas'));
  // The other Canvas was in the same Main group: the ordinary Main replacement rule clears Sub.
  await js(`(async()=>{cm.SubNote=app.workspace.createLeafBySplit(cm.OldMain,'horizontal');await cm.SubNote.openFile(app.vault.getAbstractFileByPath(${j(path('SubNote.md'))}));await ${p}.toggleSub(cm.SubNote);return true})()`);
  await wait(`!!document.querySelector('.mdp-sub-designation')`);await textClick('.modal button','취소');assert.equal(await readFile(`${vault}/${path('SubNote.md')}`,'utf8'),fixtures['SubNote.md']);
  await js(`${p}.toggleSub(cm.SubNote).then(()=>true)`);await textClick('.modal button','연결하고 Sub로 지정');await wait(`!document.querySelector('.mdp-sub-designation')`);assert.ok((await readFile(`${vault}/${path('SubNote.md')}`,'utf8')).includes(`[[${path('Board.canvas')}]]`));await boardUnchanged(vault);
  pass('Canvas designation command works; unlinked Sub cancel preserves the note and confirm writes a reverse link');
  await tab('cm.Board');
  await save();const expected=await snapshot();await writeFile(`${dir}/expected.json`,j(expected));
  await c.screenshot(`${dir}/final.png`);assert.deepEqual(c.errors,[]);await writeFile(`${dir}/ui.json`,j({passed:true,version:'0.1.14',checks,errors:c.errors}));
 }else if(mode==='restart'){
  await c.send('Emulation.setDeviceMetricsOverride',{width:1800,height:1050,deviceScaleFactor:1,mobile:false});await wait(`${p}?.ready`);assert.equal(await js(`${p}.manifest.version`),'0.1.14');await locals();
  const expected=JSON.parse(await readFile(`${dir}/expected.json`,'utf8'));assert.deepEqual(await snapshot(),expected);
  assert.equal((await snapshot()).main,path('Board.canvas'));assert.equal(await js(`${p}.folders.positions[${j(path('FolderNote.md'))}]`),'canvas-folder');await boardUnchanged(vault);
  await tab('cm.SubNote');await menu('cm.SubNote');assert.equal((await snapshot()).main,path('SubNote.md'));await menu('cm.Board');assert.equal((await snapshot()).main,path('Board.canvas'));await boardUnchanged(vault);
  pass('process restart restores Canvas Main, Sub, tabs and per-Canvas folder state; reverse swapping still works');
  await c.screenshot(`${dir}/restart.png`);assert.deepEqual(c.errors,[]);await writeFile(`${dir}/restart.json`,j({passed:true,version:'0.1.14',checks,errors:c.errors}));
 }
}finally{c.close()}
