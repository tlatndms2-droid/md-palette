import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,wait,point,tap,textClick,markdownPoint,drag} from './stage6-helpers.mjs';
const dir='.artifacts/revision4',hash=b=>createHash('sha256').update(b).digest('hex');
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await wait(`${p}?.mainFile?.path==='Revision4-Review/Main.md'`);
 const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8'));
 assert.equal(await js(`${p}.manifest.version`),'0.0.13');assert.deepEqual(await js(`${p}.data.spaces`),expected.spaces);assert.equal(await js(`document.querySelectorAll('.mdp-space-icon[aria-label="Sub Space"]').length`),3);
 assert.deepEqual(await js(`${p}.subGroups.map(g=>({id:g.id,files:g.children.map(l=>l.getViewState().state?.file)}))`),expected.groups);
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 for(const [name,value]of Object.entries(expected.files))assert.equal(await readFile(vault+'/Revision4-Review/'+name,'utf8'),value,name);
 await js(`window.r4Target=${p}.subGroups[0].children[${p}.subGroups[0].currentTab];${p}.selectView('metadata');true`);await wait(`document.querySelector('.mdp-meta-links')`);
 const before=await js('r4Target.view.editor.getValue()');await drag('.mdp-meta-links',await markdownPoint('r4Target'));await textClick('취소');assert.equal(await js('r4Target.view.editor.getValue()'),before);
 await js(`${p}.selectView('link','card');true`);await pause(180);const id=await js(`${p}.subGroup.children[${p}.subGroup.currentTab].id`),last=await js(`${p}.subGroup.id`);const pt=await point('.mdp-card[data-path="Revision4-Review/C.md"] .mdp-card-name');await tap(pt);await tap(pt,'left',2);await pause(400);assert.equal(await js(`${p}.subGroup.id`),last);assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].id`),id);assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file.path`),'Revision4-Review/C.md');
 const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));for(const f of originals)assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
 for(const f of ['opening-result','drag-result','guards-result'])assert.ok(JSON.parse(await readFile(`${dir}/${f}.json`,'utf8')).passed);
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)),sha256);assets.push({name,sha256})}
 const backup=JSON.parse(await readFile(dir+'/backup/.obsidian/plugins/md-palette/data.json','utf8')),now=await js(`${p}.data`);for(const key of ['labels','assignments','fileType','labelFilter'])assert.deepEqual(now.cards[key],backup.cards[key],key);for(const [path,state]of Object.entries(backup.foldersByMain))assert.deepEqual(now.foldersByMain[path],state,path);
 await c.screenshot(dir+'/restart.png');assert.equal(c.errors.length,0);
 const result={version:'0.0.13',passed:true,restoredMultipleSubs:true,restoredLastUsedSub:true,rolesAndIcons:true,savedMarkdownAndCanvas:true,dragAndReplacementAfterRestart:true,preservedLabelsAndDocumentFolders:true,originalFilesUnchanged:originals.length,assets};
 await writeFile(dir+'/restart-result.json',JSON.stringify(result,null,2));await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}

