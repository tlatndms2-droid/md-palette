import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/stage4';try{
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 await mkdir(dir,{recursive:true});await c.evaluate(`(async()=>{const p=app.plugins.plugins['md-palette'];if(p){p.flushState();await p.saveChain;}return true})()`);
 await cp(vault+'/.obsidian',dir+'/backup-obsidian',{recursive:true,errorOnExist:true,force:false});
 const files=await c.evaluate('app.vault.getFiles().map(f=>f.path)');const originals=[];for(const path of files)originals.push({path,sha256:createHash('sha256').update(await readFile(vault+'/'+path)).digest('hex')});await writeFile(dir+'/originals.json',JSON.stringify(originals,null,2));
 await c.evaluate(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
 for(const name of ['main.js','manifest.json','styles.css']){await cp(name,vault+'/.obsidian/plugins/md-palette/'+name);assert.deepEqual(await readFile(name),await readFile(vault+'/.obsidian/plugins/md-palette/'+name));}
 console.log('Backed up previous state and installed assets; run stage4-fixtures.mjs next.');
}finally{c.close()}
