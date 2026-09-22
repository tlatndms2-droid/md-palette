import assert from 'node:assert/strict';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,wait,click,textClick,key,type,create} from './stage4-helpers.mjs';
const dir='.artifacts/new-canvas',mode=process.argv[2]??'ui',checks=[],j=JSON.stringify;
const hash=b=>createHash('sha256').update(b).digest('hex');
const check=s=>{checks.push(s);console.log('PASS',s)};
async function open(name,format='canvas',folder=false){
 if(folder){await click('.mdp-folder-grid','right');await textClick('.menu-item-title','새 링크 파일 추가')}else await click('.mdp-new-linked-note');
 await wait(`document.querySelector('.mdp-new-note input')`);assert.equal(await js(`document.querySelector('.mdp-new-note select').value`),'md');
 if(format==='canvas'){await click('.mdp-new-note select');await key('ArrowDown','ArrowDown',40);await key('Enter','Enter',13)}
 assert.equal(await js(`document.querySelector('.mdp-new-note select').value`),format);
 await click('.mdp-new-note input');await type(name);
}
async function submit(){await textClick('.modal button','만들고 연결');await pause(350)}
async function cancel(){await textClick('.modal button','취소')}
const tabs=()=>js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{if(l.view.file)a.push([l.id,l.view.file.path])});return a})()`);
try{
 await mkdir(dir,{recursive:true});const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Metadata-Sandbox-20260922'));
 if(mode==='install'){
  const backup=dir+'/backup-'+Date.now();await cp(vault+'/.obsidian',backup+'/.obsidian',{recursive:true});const originals=[];
  for(const path of await js('app.vault.getFiles().map(f=>f.path)'))originals.push({path,sha256:hash(await readFile(vault+'/'+path))});
  await writeFile(dir+'/backup.json',j({backup,originals}));
  await js(`app.plugins.unloadPlugin('md-palette').then(()=>true)`);
  for(const name of ['main.js','manifest.json','styles.css'])await cp(name,vault+'/.obsidian/plugins/md-palette/'+name);
  await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');if(!${p})await app.plugins.loadPlugin('md-palette');return true})()`);await pause(500);
 }
 assert.equal(await js(`${p}.manifest.version`),'0.1.6');await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1100,deviceScaleFactor:1,mobile:false});
 if(mode==='restart'){
  const e=JSON.parse(await readFile(dir+'/expected.json','utf8'));assert.equal(await js(`${p}.mainFile.path`),e.main);
  assert.equal(await js(`app.vault.read(${p}.mainFile)`),e.body);assert.deepEqual(await js(`${p}.folders`),e.folders);
  for(const path of e.created)assert.ok(await js(`${p}.connectedFiles().some(f=>f.path===${j(path)})`));
  check('restart restores Main, links and virtual folder positions');
  await js(`${p}.selectView('link','card');true`);await pause(250);await open('재시작 선택 확인');await c.screenshot(dir+'/restart-dialog.png');await cancel();
  await click(`[data-path=${j(e.canvas)}]`,'left',2);await pause(500);
  assert.ok(await js(`app.workspace.getLeavesOfType('canvas').some(l=>l.view.file?.path===${j(e.canvas)})`));check('created Canvas opens normally only after double-click');
 }else{
  const root='CanvasCreate-Review-'+Date.now();await writeFile(dir+'/root.json',j(root));
  const settings=await js(`({newFileLocation:app.vault.getConfig('newFileLocation'),newFileFolderPath:app.vault.getConfig('newFileFolderPath')})`);await writeFile(dir+'/settings.json',j(settings));
  await js(`(async()=>{await app.vault.createFolder(${j(root)});await app.vault.createFolder(${j(root+'/지정 폴더')});const f=await app.vault.create(${j(root+'/Main.md')},${j('# Canvas 생성 확인\n')});const l=${p}.mainLeaf??app.workspace.getLeavesOfType('markdown').find(l=>l.view.file?.path.startsWith('CanvasCreate-Review'));await ${p}.unsetMain();await l.openFile(f);await ${p}.setMain(l);${p}.selectView('link','card');return true})()`);await pause(400);
  const created=[];
  const success=async(path,format)=>{
   const before=await tabs();await submit();await wait(`!document.querySelector('.mdp-new-note')`);
   assert.deepEqual(await tabs(),before,'creation does not open or replace tabs');
   const body=await js(`app.vault.read(app.vault.getAbstractFileByPath(${j(path)}))`);if(format==='canvas')assert.deepEqual(JSON.parse(body),{nodes:[],edges:[]});else assert.equal(body,'');
   await wait(`${p}.connectedFiles().some(f=>f.path===${j(path)})`);assert.ok((await js(`app.vault.read(${p}.mainFile)`)).includes(`[[${path}]]`));created.push(path);
  };
  try{
   const count=await js('app.vault.getFiles().length');await open('취소 시험');await cancel();assert.equal(await js('app.vault.getFiles().length'),count);check('Canvas cancel creates nothing');
   await js(`app.vault.setConfig('newFileLocation','current');true`);
   await open('같은 이름','md');await success(root+'/같은 이름.md','md');
   await open('같은 이름');assert.ok((await js(`document.querySelector('.mdp-new-note-path').textContent`)).endsWith('같은 이름.canvas'));await c.screenshot(dir+'/dialog.png');await success(root+'/같은 이름.canvas','canvas');
   check('Markdown default and Canvas selection create separate valid files in Main folder without opening');
   await open('같은 이름.CANVAS');await submit();assert.match(await js(`document.querySelector('.mdp-new-note-error').textContent`),/같은 이름/);await cancel();check('duplicate Canvas is rejected without overwrite');
   await js(`app.vault.setConfig('newFileLocation','root');true`);const rootName=root+' 루트';await open(rootName);await success(rootName+'.canvas','canvas');check('Canvas respects vault-root new-note setting');
   await js(`app.vault.setConfig('newFileLocation','folder');app.vault.setConfig('newFileFolderPath',${j(root+'/지정 폴더')});${p}.selectView('link','connections');true`);await pause(200);
   await open('Connections 캔버스.md');await success(root+'/지정 폴더/Connections 캔버스.canvas','canvas');check('Connections respects configured folder and selected extension');
   await js(`${p}.selectView('link','folder');true`);await pause(200);const folder=await create('Canvas 모음');
   await js(`${p}.folders.current=${j(folder)};${p}.selectView('link','folder');true`);await pause(200);
   await open('폴더 캔버스','canvas',true);await success(root+'/지정 폴더/폴더 캔버스.canvas','canvas');assert.equal(await js(`${p}.folders.positions[${j(root+'/지정 폴더/폴더 캔버스.canvas')}]`),folder);check('Folder menu places Canvas in selected virtual folder');
   await js(`${p}.selectView('link','card');true`);await pause(200);await open('실패 복구');
   await js(`window.canvasOriginalWrite=app.fileManager.processFrontMatter;app.fileManager.processFrontMatter=async()=>{throw Error('검증용 연결 실패')};true`);
   try{await submit();assert.match(await js(`document.querySelector('.mdp-new-note-error').textContent`),/검증용 연결 실패/);assert.equal(await js(`!!app.vault.getAbstractFileByPath(${j(root+'/지정 폴더/실패 복구.canvas')})`),false);await cancel()}
   finally{await js('app.fileManager.processFrontMatter=window.canvasOriginalWrite;delete window.canvasOriginalWrite;true')}
   check('failed linking removes only untouched newly-created Canvas');
   await js(`${p}.flushState();${p}.saveChain.then(()=>true)`);
   await writeFile(dir+'/expected.json',j(await js(`(async()=>({main:${p}.mainFile.path,body:await app.vault.read(${p}.mainFile),folders:${p}.folders,created:${j(created)},canvas:${j(root+'/같은 이름.canvas')}}))()`)));
  }finally{await js(`(()=>{for(const [k,v]of Object.entries(${j(settings)}))app.vault.setConfig(k,v);return true})()`)}
 }
 const backup=JSON.parse(await readFile(dir+'/backup.json','utf8'));for(const f of backup.originals)assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);check('all pre-existing Sandbox files unchanged');
 await c.screenshot(dir+'/'+(mode==='restart'?'restart':'ui')+'.png');assert.deepEqual(c.errors,[]);
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(sha256,hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)));assets.push({name,sha256})}
 const report={passed:true,version:'0.1.6',checks,assets};await writeFile(dir+'/'+(mode==='restart'?'restart':'ui')+'-result.json',j(report));
 if(mode==='restart'){assert.deepEqual(JSON.parse(await readFile(dir+'/ui-result.json','utf8')).assets,assets);await writeFile(dir+'/release-ready.json',j(report))}
}catch(e){await c.screenshot(dir+'/failure.png');throw e}finally{c.close()}
