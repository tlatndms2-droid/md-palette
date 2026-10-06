import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir='.artifacts/canvas-main',evidence='docs/handoff/evidence/0.1.14';
for(const name of ['ui.json','restart.json','guards.json','performance.json']){
 const result=JSON.parse(await readFile(`${dir}/${name}`,'utf8'));
 assert.equal(result.passed,true);assert.equal(result.version,'0.1.14');assert.deepEqual(result.errors,[]);
}
const installed=JSON.parse(await readFile(`${dir}/install.json`,'utf8')),assets=[];
for(const name of ['main.js','manifest.json','styles.css']){
 const sha256=createHash('sha256').update(await readFile(name)).digest('hex');
 assert.equal(sha256,installed.assets.find(a=>a.name===name).sha256);assets.push({name,sha256});
}
await writeFile(`${dir}/release-ready.json`,JSON.stringify({passed:true,version:'0.1.14',assets},null,2));
await mkdir(evidence,{recursive:true});
for(const name of ['before.png','canvas-menu.png','connections.png','reverse-link.png','metadata.png','restart.png','ui.json','restart.json','guards.json','performance.json','release-ready.json'])await cp(`${dir}/${name}`,`${evidence}/${name}`);
console.log({passed:true,version:'0.1.14',assets});
