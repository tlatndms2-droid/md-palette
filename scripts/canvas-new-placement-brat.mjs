import assert from 'node:assert/strict';
import {cp,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,wait} from './stage4-helpers.mjs';
const dir='.artifacts/canvas-new-placement',hash=v=>createHash('sha256').update(v).digest('hex');
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
 assert.equal(JSON.parse(await readFile(`${dir}/release-verification.json`,'utf8')).assets.length,3);
 const dest=`${vault}/.obsidian/plugins/md-palette`;
 await js(`(async()=>{${p}.flushState();await ${p}.saveChain;return true})()`);await cp(`${dest}/data.json`,`${dir}/before-brat-data.json`);
 await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
 for(const name of ['main.js','manifest.json','styles.css'])await cp(`${dir}/pretest-obsidian/plugins/md-palette/${name}`,`${dest}/${name}`);
 await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePlugin('md-palette');return true})()`);await wait(`${p}?.ready`);assert.equal(await js(`${p}.manifest.version`),'0.1.14');
 const state=()=>js(`({main:${p}.mainFile?.path,cards:${p}.cards,foldersByMain:${p}.foldersByMain,explorer:${p}.explorer})`),baseline=await state();
 await js(`window.placementBrat=null;app.plugins.plugins['obsidian42-brat'].betaPlugins.addPlugin('tlatndms2-droid/md-palette',false,false,false,'',true,true).then(ok=>window.placementBrat=ok).catch(e=>window.placementBrat=String(e));true`);
 for(let i=0;i<150;i++){if(await js('window.placementBrat!==null'))break;await pause(300)}assert.equal(await js('window.placementBrat'),true);await wait(`${p}?.manifest.version==='0.1.15'&&${p}.ready`);
 assert.deepEqual(await state(),baseline);assert.ok(await js(`app.plugins.enabledPlugins.has('md-palette')`));
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const local=await readFile(name),installed=await readFile(`${dest}/${name}`);if(name==='manifest.json')assert.deepEqual(JSON.parse(installed),JSON.parse(local));else assert.equal(hash(local),hash(installed));assets.push({name,sha256:hash(installed),localSha256:hash(local),contentIdentical:true})}
 assert.deepEqual(c.errors,[]);const result={passed:true,from:'0.1.14',version:'0.1.15',through:'BRAT public release download and activation',priorSettingsPreserved:true,assets,errors:c.errors};await writeFile(`${dir}/brat-verification.json`,JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
