import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { connect } from './cdp.mjs';

const c=await connect();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const dir='.artifacts/stage1';
try {
  const before=await c.evaluate(`app.plugins.plugins['md-palette']?.manifest.version`);
  if(process.argv[2]!=='verify') {
    assert.equal(before,'0.0.1');
    await c.evaluate(`app.commands.executeCommandById('command-palette:open');true`);
    await c.send('Input.insertText',{text:'BRAT: Plugins: Check for updates to all beta plugins and UPDATE'});
    let point;
    for(let i=0;i<25;i++) {
      point=await c.evaluate(`(()=>{const el=Array.from(document.querySelectorAll('.suggestion-item')).find(e=>e.textContent.includes('Check for updates to all beta plugins and UPDATE'));if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      if(point)break;await pause(200);
    }
    assert.ok(point,'BRAT update command is visible');
    await c.screenshot(`${dir}/brat-update-command.png`);
    await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
    await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
  }
  let result;
  for(let i=0;i<120;i++) {
    result=await c.evaluate(`(()=>{const p=app.plugins.plugins['md-palette'];return {version:p?.manifest.version,enabled:app.plugins.enabledPlugins.has('md-palette'),main:p?.mainGroup?.id,sub:p?.subGroup?.id,reference:p?.referenceGroup?.id,vault:app.vault.adapter.getBasePath(),notice:document.querySelector('.notice-container')?.innerText}})()`);
    if(result.version==='0.0.2'&&result.main&&result.sub&&result.reference)break;
    await pause(250);
  }
  assert.equal(result.version,'0.0.2');assert.ok(result.enabled&&result.main&&result.sub&&result.reference);
  await pause(1500);
  const original=JSON.parse(await readFile(`${dir}/data-before-brat.json`,'utf8'));
  const data=JSON.parse(await readFile(`${result.vault}/.obsidian/plugins/md-palette/data.json`,'utf8'));
  assert.deepEqual(data,original);
  const release=JSON.parse(await readFile(`${dir}/release-verification.json`,'utf8'));
  result.assets=[];
  for(const asset of release.assets) {
    const bytes=await readFile(`${result.vault}/.obsidian/plugins/md-palette/${asset.name}`);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    if(asset.name==='manifest.json')assert.deepEqual(JSON.parse(bytes.toString()),JSON.parse(await readFile('manifest.json','utf8')));
    else assert.equal(sha256,asset.sha256);
    result.assets.push({name:asset.name,sha256,releaseSha256:asset.sha256,contentIdentical:true});
  }
  result.from='0.0.1';result.dataPreserved=true;
  assert.deepEqual(c.errors,[]);
  await c.evaluate(`app.commands.executeCommandById('md-palette:open-sidebar');true`);
  await pause(500);
  await c.screenshot(`${dir}/brat-updated.png`);
  await writeFile(`${dir}/brat-verification.json`,JSON.stringify(result,null,2));
  console.log(result);
} finally {c.close();}
