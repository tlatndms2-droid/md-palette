import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { connect } from './cdp.mjs';
const dir = '.artifacts/stage2';
await mkdir(dir, {recursive:true});
if(process.argv[2]==='version') {
  for(const path of ['package.json','manifest.json']) {
    const data=JSON.parse(await readFile(path,'utf8')); data.version='0.0.3';
    if(data.packages?.['']) data.packages[''].version='0.0.3';
    if(path==='manifest.json') data.description='Main·Sub·Reference 작업 공간과 연결 파일 Card·썸네일·라벨 정리.';
    if(path==='package.json') data.description='MD Palette for Obsidian — Spaces and linked file cards';
    await writeFile(path,JSON.stringify(data,null,2)+'\n');
  }
  const versions=JSON.parse(await readFile('versions.json','utf8'));versions['0.0.3']='1.13.7';await writeFile('versions.json',JSON.stringify(versions,null,2)+'\n');
} else {
  const c=await connect();
  try {
    const live=await c.evaluate(`({vault:app.vault.adapter.getBasePath(),plugins:Object.keys(app.plugins.plugins),files:app.vault.getFiles().map(f=>f.path)})`);
    assert.ok(live.vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
    const walk=async(root,prefix='')=>{const out=[];for(const e of await readdir(root,{withFileTypes:true})){const p=prefix+e.name;if(e.isDirectory())out.push(...await walk(root+'/'+e.name,p+'/'));else out.push(p);}return out;};
    const paths=await walk(live.vault+'/.obsidian');
    await cp(live.vault+'/.obsidian',dir+'/backup-obsidian',{recursive:true,errorOnExist:true,force:false});
    const hashes=[];for(const p of paths)hashes.push({path:p,sha256:createHash('sha256').update(await readFile(live.vault+'/.obsidian/'+p)).digest('hex')});
    await writeFile(dir+'/backup.json',JSON.stringify({live,hashes},null,2));
    for(const name of ['main.js','manifest.json','styles.css'])await cp(name,live.vault+'/.obsidian/plugins/md-palette/'+name);
    await c.evaluate(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return app.plugins.plugins['md-palette']?.manifest.version})()`);
    console.log({vault:live.vault,backedUp:hashes.length,version:await c.evaluate(`app.plugins.plugins['md-palette'].manifest.version`)});
  } finally {c.close();}
}
