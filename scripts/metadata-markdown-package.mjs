import {readFile, writeFile, mkdir, cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir='.artifacts/metadata-markdown', evidence='docs/handoff/evidence/0.1.3';
const ui=JSON.parse(await readFile(dir+'/ui-result.json','utf8'));
const restart=JSON.parse(await readFile(dir+'/restart-result.json','utf8'));
for(const result of [ui,restart]){
 assert.equal(result.passed,true);assert.equal(result.version,'0.1.3');
 for(const asset of result.assets)assert.equal(createHash('sha256').update(await readFile(asset.name)).digest('hex'),asset.sha256);
}
await writeFile(dir+'/release-ready.json',JSON.stringify({passed:true,version:'0.1.3',assets:restart.assets},null,2));
await mkdir(evidence,{recursive:true});
for(const name of ['after.png','restart.png','ui-result.json','restart-result.json'])await cp(dir+'/'+name,evidence+'/'+name);
console.log('Verified evidence and release-ready assets',restart.assets);
