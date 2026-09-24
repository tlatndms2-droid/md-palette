import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,wait} from './stage4-helpers.mjs';
const dir='.artifacts/outgoing-export';
try {
 await wait(`${p}?.mainFile?.path==='나의 글쓰기.md'`);
 assert.equal(await js(`${p}.manifest.version`),'0.1.12');
 const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8'));
 for(const prop of ['explorer','folders','cards'])assert.deepEqual(await js(`${p}.${prop}`),expected[prop],prop);
 await wait(`document.querySelectorAll('.mdp-folder-tree [data-link-path="산책 메모.md"]').length===2`);
 assert.equal(await js(`document.querySelectorAll('[data-link-path="글쓰기 아이디어.md"]').length`),0);
 const layout=await js(`${p}.canvasInsert.source(['관찰의 기록.md','문장 수집.md'],'writing').layout`);
 assert.equal(layout.nodes.length,5);assert.equal(layout.edges.length,4);
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Link-Sandbox-20260924'));
 const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));
 for(const [path,text]of Object.entries(originals))assert.equal(await readFile(vault+'/'+path,'utf8'),text,path);
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const local=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),local);assets.push({name,sha256:createHash('sha256').update(local).digest('hex')});}
 await c.screenshot(dir+'/restart.png');assert.equal(c.errors.length,0);
 assert.equal(JSON.parse(await readFile(dir+'/ui-result.json','utf8')).passed,true);
 const result={version:'0.1.12',passed:true,processRestart:true,outgoingOnly:true,folderExportDescendants:true,settingsPreserved:true,sourceFilesPreserved:true,assets};
 await writeFile(dir+'/restart-result.json',JSON.stringify(result,null,2));await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
