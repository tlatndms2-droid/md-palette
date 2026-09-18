import assert from 'node:assert/strict';import {cp,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {c,p,dir,js,pause,wait,click,type} from './stage4-helpers.mjs';
const mode=process.argv[2],hash=b=>createHash('sha256').update(b).digest('hex');
try{
if(mode==='snapshot'){
 const prior=JSON.parse(await readFile(dir+'/backup-obsidian/plugins/md-palette/data.json','utf8'));
 await js(`(()=>{const p=${p},old=${JSON.stringify(prior.cards)};for(const key of ['labels','assignments','fileType','labelFilter','display','textSize','typeCollapsed','labelCollapsed'])p.cards[key]=old[key];p.cardsChanged();return true})()`);
 await click('.mdp-folder-breadcrumb [data-folder=""]');const ids=JSON.parse(await readFile(dir+'/ui-result.json','utf8')).ids;await js(`${p}.changeFolders(s=>{s.current='${ids.a}'}).then(()=>true)`);
 await click('[aria-label="현재 폴더에서 검색"]');await type('Beta');await pause(600);await js(`${p}.flushState();${p}.saveChain.then(()=>true)`);await js('app.workspace.requestSaveLayout();true');await pause(1400);
 await writeFile(dir+'/before-restart.json',JSON.stringify(await js(`({folders:${p}.folders,cards:${p}.cards,connections:${p}.connections,spaces:${p}.data.spaces,unknown:${p}.data.preservedFixture})`),null,2));
 console.log('Saved restart baseline; search Beta must clear after restart');
}else{
 const saved=JSON.parse(await readFile(dir+'/before-restart.json','utf8'));await wait(`!!${p}?.mainFile&&!!document.querySelector('.mdp-folder-grid')`);assert.equal(await js(`${p}.manifest.version`),'0.0.7');
 for(const k of ['folders','cards','connections'])assert.deepEqual(await js(`${p}.${k}`),saved[k],k);assert.deepEqual(await js(`${p}.data.spaces`),saved.spaces);assert.equal(await js(`document.querySelector('input[type=search]').value`),'');
 const prior=JSON.parse(await readFile(dir+'/backup-obsidian/plugins/md-palette/data.json','utf8'));for(const key of ['labels','assignments','fileType','labelFilter','display','textSize','typeCollapsed','labelCollapsed'])assert.deepEqual(saved.cards[key],prior.cards[key],key);assert.deepEqual(saved.connections,prior.connections);assert.deepEqual(saved.cards.order.slice(0,prior.cards.order.length),prior.cards.order);
 const vault=await js('app.vault.adapter.getBasePath()'),assets=[];for(const name of ['main.js','manifest.json','styles.css']){const bytes=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),bytes);assets.push({name,sha256:hash(bytes)});}
 for(const f of JSON.parse(await readFile(dir+'/originals.json','utf8')))assert.equal(hash(await readFile(vault+'/'+f.path)),f.sha256,f.path);
 await c.screenshot(dir+'/restart.png');assert.deepEqual(c.errors,[]);await writeFile(dir+'/restart-result.json',JSON.stringify({passed:true,version:'0.0.7',searchCleared:true,priorCardsAndConnectionsPreserved:true,foldersAndSpacesRestored:true,assets,errors:c.errors},null,2));
 for(const name of ['ui-result','advanced-result','performance-result']){const r=JSON.parse(await readFile(dir+'/'+name+'.json','utf8'));assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);}
 await writeFile(dir+'/release-ready.json',JSON.stringify({passed:true,version:'0.0.7',assets},null,2));console.log('PASS process restart, final assets, prior state and source hashes');
}
}finally{c.close()}
