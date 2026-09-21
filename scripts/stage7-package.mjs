// Prepare verified local assets only. This does not publish a release.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='.artifacts/stage7';
const reports=['spaces','connections','folder','metadata','reuse','advanced','performance','final-checks','state-guards','upgrade','restart','details','canvas-guards'];
for(const name of reports) assert.equal(JSON.parse(await readFile(`${dir}/${name}-result.json`,'utf8')).passed,true,name);
const restart=JSON.parse(await readFile(`${dir}/restart-result.json`,'utf8'));
assert.equal(restart.version,'0.1.0');
assert.equal(JSON.parse(await readFile('manifest.json','utf8')).version,restart.version);
await mkdir(`${dir}/release-0.1.0`,{recursive:true});
await mkdir('docs/handoff/evidence/stage7',{recursive:true});
for(const asset of restart.assets){
 assert.equal(createHash('sha256').update(await readFile(asset.name)).digest('hex'),asset.sha256,asset.name);
 await cp(asset.name,`${dir}/release-0.1.0/${asset.name}`);
}
const ready={version:restart.version,passed:true,scope:'Local validation only; push, GitHub Release, public asset verification and user BRAT confirmation pending',assets:restart.assets,reports};
await writeFile(`${dir}/release-ready.json`,JSON.stringify(ready,null,2));
for(const name of reports) await cp(`${dir}/${name}-result.json`,`docs/handoff/evidence/stage7/${name}-result.json`);
for(const name of ['restart.png','release-ready.json']) await cp(`${dir}/${name}`,`docs/handoff/evidence/stage7/${name}`);
console.log('Verified local 0.1.0 assets prepared; no publication performed.');
