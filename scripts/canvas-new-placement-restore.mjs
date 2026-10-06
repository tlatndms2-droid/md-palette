import assert from 'node:assert/strict';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='.artifacts/canvas-new-placement',hash=v=>createHash('sha256').update(v).digest('hex');
const {vault}=JSON.parse(await readFile(`${dir}/install.json`,'utf8'));assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
const originals=JSON.parse(await readFile(`${dir}/originals.json`,'utf8'));
for(const file of originals)assert.equal(hash(await readFile(`${vault}/${file.path}`)),file.sha256,file.path);
if(process.argv[2]==='prepare'){
 const {c,p,js,pause}=await import('./stage4-helpers.mjs');
 try{
  await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});assert.equal(await js('app.vault.adapter.getBasePath()'),vault);
  await js(`(async()=>{${p}.flushState();await ${p}.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1600);
  await mkdir(`${dir}/after-verification`,{recursive:true});await cp(`${vault}/.obsidian/plugins/md-palette/data.json`,`${dir}/after-verification/data.json`);await cp(`${vault}/.obsidian/workspace.json`,`${dir}/after-verification/workspace.json`);await cp(`${vault}/CanvasPlacement015/A.canvas`,`${dir}/after-verification/A.canvas`);
  const generated=await js(`app.vault.getFiles().filter(f=>!f.path.includes('/')&&f.path.startsWith('CanvasPlacement015-')).map(f=>f.path)`);
  for(const path of generated){assert.ok(!originals.some(f=>f.path===path));await cp(`${vault}/${path}`,`${dir}/after-verification/${path}`);assert.equal(hash(await readFile(`${vault}/${path}`)),hash(await readFile(`${dir}/after-verification/${path}`)));}
  await writeFile(`${dir}/generated.json`,JSON.stringify(generated));
  await js(`(async()=>{for(const path of ${JSON.stringify(generated)}){const file=app.vault.getAbstractFileByPath(path);if(file)await app.vault.delete(file)}await app.plugins.disablePlugin('md-palette');return true})()`);console.log({prepared:true,backedUpTestFiles:generated.length,originalFilesUnchanged:originals.length});
 }finally{c.close()}
}else{
 const restored=[];
 for(const path of ['workspace.json','plugins/md-palette/data.json']){const source=`${dir}/pretest-obsidian/${path}`,target=`${vault}/.obsidian/${path}`;await cp(source,target);assert.equal(hash(await readFile(target)),hash(await readFile(source)));restored.push({path,sha256:hash(await readFile(target))})}
 await cp(`${dir}/initial-A.canvas`,`${vault}/CanvasPlacement015/A.canvas`);assert.equal(hash(await readFile(`${dir}/initial-A.canvas`)),hash(await readFile(`${vault}/CanvasPlacement015/A.canvas`)));
 for(const file of originals)assert.equal(hash(await readFile(`${vault}/${file.path}`)),file.sha256,file.path);
 const result={passed:true,version:'0.1.15',originalFilesUnchanged:originals.length,restored,testResultsBackedUp:true,initialAFixtureRestored:true};await writeFile(`${dir}/restore-verification.json`,JSON.stringify(result,null,2));console.log(result);
}
