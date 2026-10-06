import assert from 'node:assert/strict';
import { cp,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { c,p,js,pause,wait } from './stage4-helpers.mjs';
const dir='.artifacts/canvas-main',hash=v=>createHash('sha256').update(v).digest('hex');
const state=()=>js(`({explorer:${p}.explorer,cards:${p}.cards,connections:${p}.connections,foldersByMain:${p}.foldersByMain})`);
try{
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
 assert.equal(JSON.parse(await readFile(`${dir}/release-verification.json`,'utf8')).assets.length,3);
 const dest=`${vault}/.obsidian/plugins/md-palette`;
 await js(`(async()=>{${p}.flushState();await ${p}.saveChain;return true})()`);
 await cp(`${dest}/data.json`,`${dir}/before-brat-data.json`);
 await cp(`${vault}/.obsidian/workspace.json`,`${dir}/before-brat-workspace.json`);
 await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
 // The older version has never supported Canvas Main. Test its real Markdown-era
 // settings when upgrading, without asking it to interpret new Canvas-era data.
 await cp(`${dir}/pretest-obsidian/plugins/md-palette/data.json`,`${dest}/data.json`);
 for(const name of ['main.js','manifest.json','styles.css']){
  const response=await fetch(`https://github.com/tlatndms2-droid/md-palette/releases/download/0.1.13/${name}`);assert.ok(response.ok);await writeFile(`${dest}/${name}`,Buffer.from(await response.arrayBuffer()));
 }
 await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePlugin('md-palette');return true})()`);
 assert.equal(await js(`${p}.manifest.version`),'0.1.13');await wait(`${p}.ready`);const baseline=await state();
 await js(`window.canvasBrat=null;app.plugins.plugins['obsidian42-brat'].betaPlugins.addPlugin('tlatndms2-droid/md-palette',false,false,false,'',true,true).then(ok=>window.canvasBrat=ok).catch(e=>window.canvasBrat=String(e));true`);
 for(let i=0;i<150;i++){if(await js('window.canvasBrat!==null'))break;await pause(300)}
 assert.equal(await js('window.canvasBrat'),true);await wait(`${p}?.manifest.version==='0.1.14'&&${p}.ready`);
 assert.deepEqual(await state(),baseline);assert.equal(await js(`app.plugins.enabledPlugins.has('md-palette')`),true);
 assert.ok(await js(`app.plugins.plugins['obsidian42-brat'].settings.pluginList.includes('tlatndms2-droid/md-palette')`));
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){
  const installed=await readFile(`${dest}/${name}`),local=await readFile(name);
  if(name==='manifest.json')assert.deepEqual(JSON.parse(installed),JSON.parse(local));else assert.equal(hash(installed),hash(local));
  assets.push({name,sha256:hash(installed),localSha256:hash(local),contentIdentical:true});
 }
 await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
 await cp(`${dir}/before-brat-data.json`,`${dest}/data.json`);
 assert.equal(hash(await readFile(`${dir}/before-brat-data.json`)),hash(await readFile(`${dest}/data.json`)));
 await js(`app.plugins.enablePlugin('md-palette').then(()=>true)`);await wait(`${p}.ready`);
 assert.equal(await js(`${p}.mainFile.path`),'CanvasMain-Review/Board.canvas');assert.deepEqual(c.errors,[]);
 const result={passed:true,from:'0.1.13',version:'0.1.14',through:'BRAT public release download and activation',priorSettingsPreserved:true,canvasMainLoadedAfterUpdate:true,assets};
 await writeFile(`${dir}/brat-verification.json`,JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
