import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { c, p, js, pause, wait } from './stage4-helpers.mjs';
const dir = '.artifacts/main-swap', mode = process.argv[2] ?? 'verify';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function download(url, destination) {
  const response = await fetch(url); assert.ok(response.ok, `${response.status}: ${url}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}
try {
  const vault = await js('app.vault.adapter.getBasePath()'); assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
  if (mode === 'prepare') {
    const response = await fetch('https://api.github.com/repos/TfTHacker/obsidian42-brat/releases/latest'); assert.ok(response.ok);
    const release = await response.json();
    const dest = `${vault}/.obsidian/plugins/obsidian42-brat`; await mkdir(dest, { recursive: true });
    for (const name of ['main.js', 'manifest.json', 'styles.css']) {
      const asset = release.assets.find(a => a.name === name); assert.ok(asset, name); await download(asset.browser_download_url, `${dest}/${name}`);
    }
    await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('obsidian42-brat');return true})()`);
    assert.ok(await js(`!!app.plugins.plugins['obsidian42-brat']?.betaPlugins`));
    console.log('BRAT ready', await js(`app.plugins.plugins['obsidian42-brat'].manifest.version`));
  } else {
    assert.equal(JSON.parse(await readFile(`${dir}/release-verification.json`, 'utf8')).assets.length, 3);
    const dest = `${vault}/.obsidian/plugins/md-palette`;
    await js(`(async()=>{${p}.flushState();await ${p}.saveChain;return true})()`);
    await cp(`${dest}/data.json`, `${dir}/before-brat-data.json`);
    await cp(`${vault}/.obsidian/workspace.json`, `${dir}/before-brat-workspace.json`);
    const baseline = JSON.parse(await readFile(`${dest}/data.json`, 'utf8'));
    await js(`app.plugins.disablePlugin('md-palette').then(()=>true)`);
    for (const name of ['main.js', 'manifest.json', 'styles.css']) await download(`https://github.com/tlatndms2-droid/md-palette/releases/download/0.1.12/${name}`, `${dest}/${name}`);
    await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePlugin('md-palette');return true})()`);
    assert.equal(await js(`${p}.manifest.version`), '0.1.12');
    await js(`window.swapBratResult=null;app.plugins.plugins['obsidian42-brat'].betaPlugins.addPlugin('tlatndms2-droid/md-palette',false,false,false,'',true,true).then(ok=>window.swapBratResult=ok).catch(e=>window.swapBratResult=String(e));true`);
    for (let i = 0; i < 150; i++) { if (await js('window.swapBratResult!==null')) break; await pause(300); }
    assert.equal(await js('window.swapBratResult'), true);
    await wait(`${p}?.manifest.version==='0.1.13'&&${p}.ready`);
    assert.equal(await js(`app.plugins.enabledPlugins.has('md-palette')`), true);
    assert.ok(await js(`app.plugins.plugins['obsidian42-brat'].settings.pluginList.includes('tlatndms2-droid/md-palette')`));
    for (const key of ['explorer', 'cards', 'connections', 'foldersByMain']) assert.deepEqual(await js(`${p}.${key}`), baseline[key], key);
    const assets = [];
    for (const name of ['main.js', 'manifest.json', 'styles.css']) {
      const installed = await readFile(`${dest}/${name}`), local = await readFile(name);
      if (name === 'manifest.json') assert.deepEqual(JSON.parse(installed), JSON.parse(local)); else assert.equal(hash(installed), hash(local));
      assets.push({ name, sha256: hash(installed), localSha256: hash(local), contentIdentical: true });
    }
    assert.equal(c.errors.length, 0);
    const result = { passed: true, from: '0.1.12', version: '0.1.13', through: 'BRAT public release download and reload', priorSettingsPreserved: true, assets };
    await writeFile(`${dir}/brat-verification.json`, JSON.stringify(result, null, 2)); console.log(result);
  }
} finally { c.close(); }
