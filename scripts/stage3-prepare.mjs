import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const dir='.artifacts/stage3';await mkdir(dir,{recursive:true});const c=await connect();
try{
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 const walk=async(root,prefix='')=>{let out=[];for(const e of await readdir(root,{withFileTypes:true})){const p=prefix+e.name;if(e.isDirectory())out.push(...await walk(root+'/'+e.name,p+'/'));else out.push(p);}return out;};
 const paths=await walk(vault+'/.obsidian');await cp(vault+'/.obsidian',dir+'/backup-obsidian',{recursive:true,errorOnExist:true,force:false});
 const hashes=[];for(const p of paths)hashes.push({path:p,sha256:createHash('sha256').update(await readFile(vault+'/.obsidian/'+p)).digest('hex')});await writeFile(dir+'/backup.json',JSON.stringify({vault,hashes},null,2));
 await mkdir(vault+'/.obsidian/plugins/md-palette',{recursive:true});
 for(const name of ['main.js','manifest.json','styles.css']){await cp(name,vault+'/.obsidian/plugins/md-palette/'+name);assert.deepEqual(await readFile(name),await readFile(vault+'/.obsidian/plugins/md-palette/'+name));}
 const prior=JSON.parse(await readFile('.artifacts/stage2-drag/validated-obsidian/plugins/md-palette/data.json','utf8'));
 prior.spaces={};prior.topView='link';prior.linkView='card';prior.preservedFixture={keep:'stage2-data'};
 await writeFile(dir+'/prior-data.json',JSON.stringify(prior));await writeFile(vault+'/.obsidian/plugins/md-palette/data.json',JSON.stringify(prior));
 const version=await c.evaluate(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return app.plugins.plugins['md-palette'].manifest.version})()`);assert.equal(version,'0.0.5');console.log({vault,version,backedUp:hashes.length});
}finally{c.close();}
