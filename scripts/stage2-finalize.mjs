import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';
import { connect } from './cdp.mjs';
const dir='.artifacts/stage2';
const reports=['ui-result','advanced-result','final-regression','performance-result','restart-result'];
for(const name of reports){const r=JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));assert.equal(r.passed,true,name);assert.deepEqual(r.errors,[],name);}
const {code}=await transform(await readFile('src/cards-state.ts','utf8'),{loader:'ts',format:'esm'});
const {bodyOnly}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const c=await connect();
try{
  const live=await c.evaluate(`({version:app.plugins.plugins['md-palette'].manifest.version,vault:app.vault.adapter.getBasePath(),data:app.plugins.plugins['md-palette'].data,frontmatter:app.metadataCache.getFileCache(app.plugins.plugins['md-palette'].mainFile).frontmatter})`);
  assert.equal(live.version,'0.0.3');assert.deepEqual(live.data.preservedFixture,{labels:['keep-me'],nested:{value:42}});
  const originals=JSON.parse(await readFile(`${dir}/fixture-originals.json`,'utf8'));
  for(const file of originals){
    const now=await readFile(`${live.vault}/${file.path}`),original=Buffer.from(file.bytes);
    if(file.path.endsWith('/Main.md')){assert.equal(bodyOnly(now.toString()),bodyOnly(original.toString()));assert.equal(live.frontmatter.keep,'preserved');assert.equal(live.frontmatter['link note'].length,2);assert.ok(live.frontmatter['link note'].some(s=>s.includes('Extra')));}
    else assert.deepEqual(now,original,file.path);
  }
  const assets=[];
  for(const name of ['main.js','manifest.json','styles.css']){const local=await readFile(name),installed=await readFile(`${live.vault}/.obsidian/plugins/md-palette/${name}`);assert.deepEqual(installed,local,name);assets.push({name,sha256:createHash('sha256').update(local).digest('hex'),bytes:local.length});}
  const report={version:'0.0.3',passed:true,reports,assets,originalFilesVerified:originals.length,mainBodyUnchanged:true,onlyLinkNoteChanged:true,unknownDataPreserved:true};
  await writeFile(`${dir}/release-ready.json`,JSON.stringify(report,null,2));console.log(report);
}finally{c.close();}
