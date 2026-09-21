import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,wait,click,type,textClick,pause} from './stage4-helpers.mjs';
const dir='.artifacts/new-note',hash=b=>createHash('sha256').update(b).digest('hex');
try {
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await wait(`${p}?.mainFile?.path==='NewNote-Review/Main.md'`);
 assert.equal(await js(`${p}.manifest.version`),'0.0.14');
 const expected=JSON.parse(await readFile(dir+'/expected.json','utf8'));
 assert.equal(await js(`app.vault.read(${p}.mainFile)`),expected.body);
 assert.deepEqual(await js(`${p}.connectedFiles().map(f=>f.path)`),expected.paths);
 assert.deepEqual(await js(`${p}.folders`),expected.folders);
 for(const path of expected.paths)assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath(${JSON.stringify(path)}))`),'');
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));
 for(const f of originals)assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
 const backup=JSON.parse(await readFile(dir+'/backup/.obsidian/plugins/md-palette/data.json','utf8')),now=await js(`${p}.data`);
 for(const key of ['labels','assignments','fileType','labelFilter'])assert.deepEqual(now.cards[key],backup.cards[key],key);
 for(const [path,state]of Object.entries(backup.foldersByMain))assert.deepEqual(now.foldersByMain[path],state,path);
 const settings=JSON.parse(await readFile(dir+'/settings.json','utf8'));assert.deepEqual(await js(`({newFileLocation:app.vault.getConfig('newFileLocation'),newFileFolderPath:app.vault.getConfig('newFileFolderPath')})`),settings);
 await click('.mdp-new-linked-note');await type('재시작 후 생성');await textClick('.modal button','만들고 연결');await wait(`!document.querySelector('.mdp-new-note')`);await wait(`${p}.connectedFiles().some(f=>f.path==='재시작 후 생성.md')`);assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('재시작 후 생성.md'))`),'');
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)),sha256);assets.push({name,sha256})}
 for(const name of ['ui-result','visual-result'])assert.equal(JSON.parse(await readFile(`${dir}/${name}.json`,'utf8')).passed,true);
 await pause(1000);await c.screenshot(dir+'/restart.png');assert.equal(c.errors.length,0);
 const result={version:'0.0.14',passed:true,restarted:true,linksAndFilesRestored:true,virtualFoldersRestored:true,originalFilesUnchanged:originals.length,labelsAndPriorFoldersPreserved:true,settingsRestored:true,createAfterRestart:true,assets};
 await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
} finally {c.close()}
