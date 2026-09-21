import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,textClick,key,type,create} from './stage4-helpers.mjs';
const dir='.artifacts/new-note',main='NewNote-Review/Main.md',checks=[];
const check = s => { checks.push(s); console.log(s); };
const exists = path => js(`!!app.vault.getAbstractFileByPath(${JSON.stringify(path)})`);
async function open(name) {await click('.mdp-new-linked-note');await wait(`document.querySelector('.mdp-new-note input')`);if(name)await type(name)}
async function submit(){await textClick('.modal button','만들고 연결');await pause(350)}
async function success(path){await submit();await wait(`!document.querySelector('.mdp-new-note')`);assert.ok(await exists(path));assert.ok((await js(`app.vault.read(${p}.mainFile)`)).includes(`[[${path}]]`));await wait(`${p}.connectedFiles().some(f=>f.path===${JSON.stringify(path)})`)}
async function error(fragment){await submit();assert.ok((await js(`document.querySelector('.mdp-new-note-error').textContent`)).includes(fragment));await textClick('.modal button','취소')}
try {
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 assert.equal(await js(`${p}.manifest.version`),'0.0.14');assert.equal(await js(`${p}.mainFile.path`),main);
 if (!process.argv[2]) {
 const before=await js(`app.vault.read(${p}.mainFile)`),count=await js('app.vault.getFiles().length');
 await open('취소 시험');await key('Escape','Escape',27);assert.equal(await js('app.vault.getFiles().length'),count);assert.equal(await js(`app.vault.read(${p}.mainFile)`),before);check('Escape cancels with no file or Main changes');
 await open();await error('파일 이름');await open('../경로');await error('경로');check('empty and invalid names rejected in UI');
 await js(`app.vault.setConfig('newFileLocation','root');true`);await open('새 링크 루트');assert.ok((await js(`document.querySelector('.mdp-new-note-path').textContent`)).endsWith('새 링크 루트.md'));await c.screenshot(dir+'/dialog-root.png');await success('새 링크 루트.md');check('Card creates empty note in vault root and links Main');
 await open('새 링크 루트');await error('같은 이름');assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('새 링크 루트.md'))`),'');check('existing filename never overwritten');
 await js(`app.vault.setConfig('newFileLocation','current');true`);await open('현재 폴더.MD');await success('NewNote-Review/현재 폴더.md');check('current-folder setting uses Main folder; explicit .MD normalized');
 await js(`app.vault.setConfig('newFileLocation','folder');app.vault.setConfig('newFileFolderPath','NewNote-Review/지정 폴더');${p}.selectView('link','connections');true`);await pause(200);await open('지정 폴더 시험');assert.ok((await js(`document.querySelector('.mdp-new-note-path').textContent`)).includes('NewNote-Review/지정 폴더/지정 폴더 시험.md'));await success('NewNote-Review/지정 폴더/지정 폴더 시험.md');await wait(`document.querySelector('.mdp-connection-row[data-path="NewNote-Review/지정 폴더/지정 폴더 시험.md"]')`);check('Connections creates in configured folder and shows outgoing row');
 await js(`${p}.selectView('link','folder');true`);await pause(250);
 const folder=await create('새 링크 모음');
 await click('.mdp-tree-root','right');await textClick('.menu-item-title','새 링크 파일 추가');await type('가상 루트');await success('NewNote-Review/지정 폴더/가상 루트.md');assert.equal(await js(`${p}.folders.positions['NewNote-Review/지정 폴더/가상 루트.md']`),'');check('Folder root menu creates and places new link');
 await writeFile(dir+'/ui-first.json',JSON.stringify(checks));
 }
 else checks.push(...JSON.parse(await readFile(dir+'/ui-first.json','utf8')));
 if (process.argv[2] !== 'resume-guards') {
 const folder=await js(`${p}.folders.folders.find(f=>f.name==='새 링크 모음').id`);
 await js(`${p}.folders.current=${JSON.stringify(folder)};${p}.selectView('link','folder');true`);await pause(200);
 await click('.mdp-folder-grid','right');await textClick('.menu-item-title','새 링크 파일 추가');await type('가상 하위');await success('NewNote-Review/지정 폴더/가상 하위.md');assert.equal(await js(`${p}.folders.positions['NewNote-Review/지정 폴더/가상 하위.md']`),folder);await c.screenshot(dir+'/folder.png');check('Folder child menu places new file in current virtual folder');
 await js(`${p}.selectView('link','card');true`);await pause(200);
 await open('실패 복구');await js(`window.newNoteOriginalWrite=app.fileManager.processFrontMatter;app.fileManager.processFrontMatter=async()=>{throw Error('검증용 연결 실패')};true`);await error('검증용 연결 실패');await js(`app.fileManager.processFrontMatter=window.newNoteOriginalWrite;delete window.newNoteOriginalWrite;true`);assert.equal(await exists('NewNote-Review/지정 폴더/실패 복구.md'),false);check('failed Main write removes only newly created empty file');
 } else {await key('Escape','Escape',27);checks.push('Folder child menu places new file in current virtual folder','failed Main write removes only newly created empty file');}
 await open('Main 변경 취소');await js(`(async()=>{window.newNoteMainLeaf=${p}.mainLeaf;await ${p}.unsetMain();return true})()`);await error('Main이 변경');assert.equal(await exists('NewNote-Review/지정 폴더/Main 변경 취소.md'),false);await js(`${p}.setMain(window.newNoteMainLeaf).then(()=>true)`);check('Main change while dialog open cancels before file creation');
 await js(`${p}.selectView('link','folder');true`);await pause(200);const folderBefore=await js(`JSON.stringify(${p}.folders)`);
 await click('.mdp-tree-root','right');await textClick('.menu-item-title','새 링크 파일 추가');await type('폴더 저장 실패');await js(`window.newNoteOriginalSave=${p}.saveData;${p}.saveData=async()=>{throw Error('검증용 폴더 저장 실패')};true`);await error('검증용 폴더 저장 실패');await js(`${p}.saveData=window.newNoteOriginalSave;delete window.newNoteOriginalSave;true`);assert.equal(await exists('NewNote-Review/지정 폴더/폴더 저장 실패.md'),false);assert.equal(await js(`JSON.stringify(${p}.folders)`),folderBefore);check('Folder save failure leaves no new file, link or virtual position');
 await click('.mdp-tree-root','right');await textClick('.menu-item-title','새 링크 파일 추가');await type('폴더 연결 실패');await js(`window.newNoteOriginalWrite=app.fileManager.processFrontMatter;app.fileManager.processFrontMatter=async()=>{throw Error('검증용 연결 실패')};true`);await error('검증용 연결 실패');await js(`app.fileManager.processFrontMatter=window.newNoteOriginalWrite;delete window.newNoteOriginalWrite;true`);assert.equal(await exists('NewNote-Review/지정 폴더/폴더 연결 실패.md'),false);assert.equal(await js(`JSON.stringify(${p}.folders)`),folderBefore);check('Folder connection failure restores original virtual folder state');
 const settings=JSON.parse(await readFile(dir+'/settings.json','utf8'));await js(`(()=>{for(const [k,v]of Object.entries(${JSON.stringify(settings)}))app.vault.setConfig(k,v);${p}.selectView('link','card');return true})()`);await pause(1000);
 await c.screenshot(dir+'/card.png');
 await writeFile(dir+'/expected.json',JSON.stringify(await js(`(async()=>({main:${p}.mainFile.path,body:await app.vault.read(${p}.mainFile),folders:${p}.folders,spaces:${p}.data.spaces,paths:${p}.connectedFiles().map(f=>f.path)}))()`),null,2));
 assert.equal(c.errors.length,0);await writeFile(dir+'/ui-result.json',JSON.stringify({version:'0.0.14',passed:true,checks},null,2));
} finally {
 await js(`(()=>{if(window.newNoteOriginalWrite)app.fileManager.processFrontMatter=window.newNoteOriginalWrite;if(window.newNoteOriginalSave)${p}.saveData=window.newNoteOriginalSave;return true})()`);c.close();
}
