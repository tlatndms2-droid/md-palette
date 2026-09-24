import assert from 'node:assert/strict';
import {readFile,writeFile,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,wait} from './stage4-helpers.mjs';
const dir='.artifacts/link-explorer';
try{
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Link-Sandbox-20260924'));
 const pluginDir=vault+'/.obsidian/plugins/md-palette';
 const old='C:/Users/tlatn/AppData/Local/Temp/MDPalette-Canvas-Sandbox-20260924/.obsidian/plugins/md-palette';
 assert.equal(JSON.parse(await readFile(old+'/manifest.json','utf8')).version,'0.1.10');
 await js(`(async()=>{${p}.flushState();await ${p}.saveChain;await app.plugins.disablePlugin('md-palette');return true})()`);
 await cp(pluginDir+'/data.json',dir+'/before-brat-data.json');
 const baseline=JSON.parse(await readFile(pluginDir+'/data.json','utf8'));
 for(const asset of ['main.js','manifest.json','styles.css'])await cp(old+'/'+asset,pluginDir+'/'+asset);
 await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePlugin('md-palette');return true})()`);
 assert.equal(await js(`${p}.manifest.version`),'0.1.10');
 // Force BRAT's own public-release downloader and reload. No copied credentials/settings.
 await js(`window.linkBratResult=null;app.plugins.plugins['obsidian42-brat'].betaPlugins.addPlugin('tlatndms2-droid/md-palette',false,false,false,'',true,true).then(ok=>window.linkBratResult=ok).catch(e=>window.linkBratResult=String(e));true`);
 for(let n=0;n<120;n++){if(await js('window.linkBratResult!==null'))break;await pause(300);}
 assert.equal(await js('window.linkBratResult'),true);
 await wait(`${p}?.manifest.version==='0.1.11'&&!!${p}.mainFile`);
 assert.equal(await js(`app.plugins.enabledPlugins.has('md-palette')`),true);
 assert.ok(await js(`app.plugins.plugins['obsidian42-brat'].settings.pluginList.includes('tlatndms2-droid/md-palette')`));
 for(const key of ['explorer','cards','connections','foldersByMain'])assert.deepEqual(await js(`${p}.${key}`),baseline[key],key);
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){
  const installed=await readFile(pluginDir+'/'+name),local=await readFile(name);
  if(name==='manifest.json')assert.deepEqual(JSON.parse(installed),JSON.parse(local));else assert.deepEqual(installed,local);
  assets.push({name,sha256:createHash('sha256').update(installed).digest('hex'),contentIdentical:true});
 }
 await js(`${p}.selectView('metadata');true`);await pause(500);
 assert.equal(await js(`${p}.metadataFile.path`),'산책 메모.md');
 await c.screenshot(dir+'/brat-updated.png');assert.equal(c.errors.length,0);
 const result={passed:true,from:'0.1.10',version:'0.1.11',through:'BRAT 2.2.0 public download and reload',priorSettingsPreserved:true,assets};
 await writeFile(dir+'/brat-verification.json',JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
