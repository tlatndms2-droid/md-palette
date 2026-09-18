import assert from 'node:assert/strict';
import {readFile,writeFile,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/stage4',mode=process.argv[2];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
  await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  const vault=await c.evaluate(`app.vault.adapter.getBasePath()`);assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
  if(mode==='prepare'){
    await c.evaluate(`(async()=>{const p=app.plugins.plugins['md-palette'];p.flushState();await p.saveChain;await app.plugins.disablePlugin('md-palette');return true})()`);
    await cp(`${vault}/.obsidian/plugins/md-palette/data.json`,`${dir}/data-before-brat.json`);
    const baseline='.artifacts/stage4/backup-obsidian/plugins';
    assert.equal(JSON.parse(await readFile(`${baseline}/md-palette/manifest.json`,'utf8')).version,'0.0.6');
    for(const name of ['main.js','manifest.json','styles.css'])await cp(`${baseline}/md-palette/${name}`,`${vault}/.obsidian/plugins/md-palette/${name}`);
    await cp(`${baseline}/obsidian42-brat`,`${vault}/.obsidian/plugins/obsidian42-brat`,{recursive:true});
    const state=await c.evaluate(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePlugin('md-palette');await app.plugins.enablePluginAndSave('obsidian42-brat');return {version:app.plugins.plugins['md-palette'].manifest.version,brat:app.plugins.plugins['obsidian42-brat'].manifest.version,tracked:app.plugins.plugins['obsidian42-brat'].settings.pluginList}})()`);
    assert.equal(state.version,'0.0.6');assert.ok(state.tracked.includes('tlatndms2-droid/md-palette'));console.log(state);
  }else{
    if(mode!=='verify'){
      assert.equal(await c.evaluate(`app.plugins.plugins['md-palette'].manifest.version`),'0.0.6');
      await c.evaluate(`app.commands.executeCommandById('command-palette:open');true`);
      await c.send('Input.insertText',{text:'BRAT: Plugins: Check for updates to all beta plugins and UPDATE'});
      let point;for(let i=0;i<35;i++){point=await c.evaluate(`(()=>{const e=[...document.querySelectorAll('.suggestion-item')].find(e=>e.textContent.includes('Check for updates to all beta plugins and UPDATE'));if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(point)break;await pause(150);}
      assert.ok(point);await c.screenshot(`${dir}/brat-update-command.png`);
      await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
    }
    let live;for(let i=0;i<150;i++){live=await c.evaluate(`(()=>{const p=app.plugins.plugins['md-palette'];return {version:p?.manifest.version,enabled:app.plugins.enabledPlugins.has('md-palette'),spaces:p?.data.spaces,cards:p?.cards,connections:p?.connections,folders:p?.folders,unknown:p?.data.preservedFixture}})()`);if(live.version==='0.0.7'&&live.spaces?.main)break;await pause(200);}
    assert.equal(live.version,'0.0.7');assert.ok(live.enabled);
    const saved=JSON.parse(await readFile(`${dir}/data-before-brat.json`,'utf8'));
    assert.deepEqual(live.folders,saved.folders);assert.deepEqual(live.spaces,saved.spaces);assert.deepEqual(live.cards,saved.cards);assert.deepEqual(live.connections.heights,saved.connections.heights);assert.deepEqual(live.connections.collapsed,saved.connections.collapsed);assert.deepEqual(live.unknown,saved.preservedFixture);
    const assets=[];
    for(const name of ['main.js','manifest.json','styles.css']){
      const local=await readFile(name),installed=await readFile(`${vault}/.obsidian/plugins/md-palette/${name}`);
      if(name==='manifest.json')assert.deepEqual(JSON.parse(installed.toString()),JSON.parse(local.toString()));else assert.deepEqual(installed,local);
      assets.push({name,sha256:createHash('sha256').update(installed).digest('hex'),contentIdentical:true});
    }
    await c.evaluate(`app.commands.executeCommandById('md-palette:open-sidebar');true`);await pause(900);
    assert.equal(await c.evaluate(`document.querySelectorAll('.mdp-folder-grid').length`),1);
    await c.screenshot(`${dir}/brat-updated.png`);assert.deepEqual(c.errors,[]);
    await writeFile(`${dir}/brat-verification.json`,JSON.stringify({passed:true,from:'0.0.6',to:'0.0.7',cardsAndSpacesPreserved:true,unknownDataPreserved:true,assets,errors:c.errors},null,2));console.log('PASS BRAT 0.0.6 → 0.0.7, cards, spaces and installed assets');
  }
}finally{c.close();}
