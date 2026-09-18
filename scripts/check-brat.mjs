import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { connect } from './cdp.mjs';

const cdp = await connect();
try {
  if (process.argv[2] !== 'verify') {
  await cdp.evaluate(`const input=document.querySelector('.modal input[type="text"]'); input.focus(); input.select(); true`);
  await cdp.send('Input.insertText', { text: 'https://github.com/tlatndms2-droid/md-palette' });
  await cdp.evaluate(`document.querySelector('.modal input[type="text"]').blur(); true`);
  for (let attempt = 0; attempt < 40; attempt++) {
    const text = await cdp.evaluate('document.querySelector(".modal")?.innerText || ""');
    if (/0\.0\.1/.test(text)) break;
    await new Promise(r=>setTimeout(r,250));
  }
  await cdp.evaluate(`const select=document.querySelector('.modal select'); select.value='latest'; select.dispatchEvent(new Event('change',{bubbles:true})); true`);
  await cdp.screenshot('.artifacts/brat-add.png');
  const button = await cdp.evaluate(`(() => { const b=Array.from(document.querySelectorAll('.modal button')).find(e=>e.innerText==='Add plugin'); if(b.disabled)throw Error('BRAT Add disabled'); const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...button});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...button});
  }
  let result;
  for(let attempt=0;attempt<100;attempt++) {
    result=await cdp.evaluate(`({version:app.plugins.plugins['md-palette']?.manifest.version,enabled:app.plugins.enabledPlugins.has('md-palette'),tracked:app.plugins.plugins['obsidian42-brat'].settings.pluginList.includes('tlatndms2-droid/md-palette'),vault:app.vault.adapter.getBasePath(),notice:document.querySelector('.notice-container')?.innerText})`);
    if(result.version==='0.0.1' && result.enabled && result.tracked)break;
    await new Promise(r=>setTimeout(r,250));
  }
  assert.equal(result.version,'0.0.1');
  assert.ok(result.enabled && result.tracked);
  const release=JSON.parse(await readFile('.artifacts/release-verification.json','utf8'));
  result.assets=[];
  for(const asset of release.assets) {
    const bytes=await readFile(result.vault+'/.obsidian/plugins/md-palette/'+asset.name);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    if (asset.name === 'manifest.json') {
      assert.deepEqual(JSON.parse(bytes.toString('utf8')), JSON.parse(await readFile('manifest.json','utf8')));
      result.assets.push({name:asset.name,sha256,releaseSha256:asset.sha256,contentIdentical:true,note:'BRAT serializes manifest JSON without indentation; values match exactly.'});
    } else {
      assert.equal(sha256,asset.sha256);
      result.assets.push({name:asset.name,sha256});
    }
  }
  assert.deepEqual(cdp.errors,[]);
  await writeFile('.artifacts/brat-verification.json',JSON.stringify(result,null,2));
  await cdp.screenshot('.artifacts/brat-installed.png');
  console.log(result);
} finally { cdp.close(); }
