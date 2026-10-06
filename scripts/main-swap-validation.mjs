import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { c, p, js, pause, wait, tap, textClick } from './stage4-helpers.mjs';

const dir = '.artifacts/main-swap', mode = process.argv[2] ?? 'ui', j = JSON.stringify;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const checks = [], pass = text => { checks.push(text); console.log('PASS', text); };
const root = 'Swap-Review';
const fixtures = {
  'A.md': '# A · 원래 Main\n\n[[B]]\n[[Bridge]]\n',
  'B.md': '# B · 새 Main\n\nB를 Main으로 지정하면 A 화면이 Sub로 바뀝니다.\n',
  'C.md': '# C · 기존 탭\n\nB와 연결되지 않아도 이미 열려 있던 이 탭은 계속 볼 수 있습니다.\n',
  'D.md': '# D · 다른 기존 탭\n', 'N.md': '# N · 새 미연결 파일\n',
  'Bridge.md': '# 중간 파일\n\n[[Deep]]\n', 'Deep.md': '# 여러 단계 아래 파일\n',
  'Map.canvas': JSON.stringify({ nodes: [{ id: 'note', type: 'text', x: 0, y: 0, width: 300, height: 180, text: 'Canvas 내용 보존' }], edges: [] }),
};
const path = name => `${root}/${name}`;
const snapshot = () => js(`(()=>{const leaves=[];app.workspace.iterateAllLeaves(l=>{if(l.getRoot()===app.workspace.rootSplit)leaves.push({id:l.id,group:l.parent.id,file:l.getViewState().state?.file,type:l.getViewState().type})});return {main:${p}.mainFile?.path,mainGroup:${p}.mainGroup?.id,sub:${p}.subGroup?.id,leaves,folders:JSON.parse(JSON.stringify(${p}.foldersByMain))}})()`);
async function tab(expr, button = 'left') {
  const point = await js(`(()=>{const e=(${expr}).tabHeaderEl;e.scrollIntoView({block:'nearest'});const r=(e.querySelector('.workspace-tab-header-inner-title')??e).getBoundingClientRect();return{x:r.x+Math.min(12,r.width/2),y:r.y+r.height/2}})()`);
  await tap(point, button);
}
async function menu(expr, title = '메인 스페이스로 지정') {
  await tab(expr); await pause(250); await tab(expr, 'right'); await textClick('.menu-item-title', title); await pause(250);
  await wait(`!${p}.busy`);
}
async function save() { await js(`${p}.flushState();app.workspace.requestSaveLayout();${p}.saveChain.then(()=>true)`); await pause(1800); }
async function verifyFixtures(vault) {
  for (const [name, content] of Object.entries(fixtures)) assert.equal(hash(await readFile(`${vault}/${path(name)}`)), hash(content), name);
  pass('all Markdown and Canvas source bytes unchanged');
}

try {
  await mkdir(dir, { recursive: true });
  const vault = await js('app.vault.adapter.getBasePath()');
  assert.ok(vault.endsWith('MDPalette-Swap-Sandbox-20261006'));
  if (mode === 'install') {
    await cp(`${vault}/.obsidian`, `${dir}/pre-install-obsidian`, { recursive: true });
    const dest = `${vault}/.obsidian/plugins/md-palette`; await mkdir(dest, { recursive: true });
    const assets = [];
    for (const name of ['main.js', 'manifest.json', 'styles.css']) {
      await cp(name, `${dest}/${name}`); assert.equal(hash(await readFile(name)), hash(await readFile(`${dest}/${name}`)));
      assets.push({ name, sha256: hash(await readFile(name)) });
    }
    await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return true})()`);
    await wait(`${p}?.ready`); assert.equal(await js(`${p}.manifest.version`), '0.1.13');
    await js(`(async()=>{await app.vault.createFolder(${j(root)});for(const [name,content] of Object.entries(${j(fixtures)}))await app.vault.create(${j(root)}+'/'+name,content);return true})()`);
    await js(`(async()=>{
      window.swapLeaves={};const file=name=>app.vault.getAbstractFileByPath(${j(root)}+'/'+name);
      const a=app.workspace.getLeaf(false);await a.openFile(file('A.md'));swapLeaves.A=a;
      for(const name of ['C.md','Map.canvas']){const l=app.workspace.createLeafInParent(a.parent,a.parent.children.length);await l.openFile(file(name));swapLeaves[name.split('.')[0]]=l;}
      const b=app.workspace.createLeafBySplit(a,'vertical');await b.openFile(file('B.md'));swapLeaves.B=b;
      const d=app.workspace.createLeafInParent(b.parent,b.parent.children.length);await d.openFile(file('D.md'));swapLeaves.D=d;
      app.workspace.setActiveLeaf(a,{focus:true});await ${p}.setMain(a);await ${p}.toggleSub(b);
      ${p}.explorer.depth=2;
      ${p}.foldersByMain[${j(path('A.md'))}]={...${p}.folders,folders:[{id:'a-folder',name:'A에서 정리한 폴더',parent:''}],order:['d:a-folder']};
      ${p}.foldersByMain[${j(path('B.md'))}]={...${p}.folderDefaults,folders:[{id:'b-folder',name:'B에서 정리한 폴더',parent:''}],order:['d:b-folder','f:'+${j(path('A.md'))}]};
      ${p}.selectView('link','folder');app.workspace.rightSplit.setSize(420);return true;
    })()`);
    await save();
    await cp(`${vault}/.obsidian`, `${dir}/baseline-obsidian`, { recursive: true });
    await cp(`${vault}/${root}`, `${dir}/baseline-fixtures`, { recursive: true });
    await writeFile(`${dir}/install.json`, j({ vault, assets, version: '0.1.13', snapshot: await snapshot() }));
    pass('final version installed with matching asset hashes; fixture and configuration backups captured');
  } else if (mode === 'ui') {
    assert.equal(await js(`${p}.manifest.version`), '0.1.13');
    await c.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1000, deviceScaleFactor: 1, mobile: false });
    await js(`window.swapLeaves={};app.workspace.iterateAllLeaves(l=>{const path=l.getViewState().state?.file;if(path?.startsWith(${j(root + '/')}))swapLeaves[path.split('/').at(-1).split('.')[0]]=l});true`);
    await tab('swapLeaves.A'); await tab('swapLeaves.B');
    await js(`${p}.selectView('link','folder');true`);
    const before = await snapshot();
    const geometry = () => js(`['A','B'].map(k=>{const r=swapLeaves[k].parent.containerEl.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})`);
    const positions = await geometry();
    await c.screenshot(`${dir}/before.png`);
    await tab('swapLeaves.B'); await pause(250); await tab('swapLeaves.B', 'right');
    assert.ok(await js(`Array.from(document.querySelectorAll('.menu-item-title')).some(e=>e.textContent==='메인 스페이스로 지정')`));
    await c.screenshot(`${dir}/sub-menu.png`);
    await textClick('.menu-item-title', '메인 스페이스로 지정'); await pause(300); await wait(`!${p}.busy`);
    let after = await snapshot(); assert.equal(after.main, path('B.md')); assert.equal(after.sub, before.mainGroup); assert.equal(after.mainGroup, before.sub);
    assert.deepEqual(after.leaves, before.leaves); assert.deepEqual(after.folders, before.folders); assert.deepEqual(await geometry(), positions);
    assert.equal(await js(`document.querySelectorAll('[aria-label="Main Space"]').length`), 1);
    assert.equal(await js(`document.querySelectorAll('[aria-label="Sub Space"]').length`), 1);
    assert.match(await js(`document.querySelector('.mdp-folder')?.textContent ?? document.body.innerText`), /B에서 정리한 폴더/);
    await c.screenshot(`${dir}/swapped.png`);
    pass('native Sub tab menu swaps exactly two roles; icons, layout, inactive tabs and per-Main folders remain correct');
    await tab('swapLeaves.C'); assert.equal(await js('app.workspace.getMostRecentLeaf().id'), await js('swapLeaves.C.id'));
    await tab('swapLeaves.Map'); assert.equal(await js('app.workspace.getMostRecentLeaf().id'), await js('swapLeaves.Map.id'));
    await tab('swapLeaves.A');
    const oldState = await js('swapLeaves.A.getViewState()');
    await js(`swapLeaves.A.openFile(app.vault.getAbstractFileByPath(${j(path('N.md'))})).then(()=>true)`);
    assert.deepEqual(await js('swapLeaves.A.getViewState()'), oldState);
    pass('unlinked existing Markdown and Canvas tabs remain clickable; new unlinked file replacement is blocked');
    await js(`app.commands.executeCommandById('md-palette:set-main');true`); await pause(300);
    assert.equal((await snapshot()).main, path('A.md')); assert.equal((await snapshot()).sub, before.sub);
    assert.match(await js('document.body.innerText'), /A에서 정리한 폴더/);
    pass('existing command swaps back and restores A-specific folders');
    await js(`(async()=>{const l=app.workspace.createLeafInParent(swapLeaves.B.parent,swapLeaves.B.parent.children.length);await l.openFile(app.vault.getAbstractFileByPath(${j(path('Deep.md'))}));swapLeaves.Deep=l;return true})()`);
    await pause(200); await menu('swapLeaves.Deep');
    assert.equal((await snapshot()).main, path('Deep.md'));
    assert.equal(await js(`${p}.linkedPaths().has(${j(path('A.md'))})`), false);
    await tab('swapLeaves.A'); assert.equal(await js('app.workspace.getMostRecentLeaf().id'), await js('swapLeaves.A.id'));
    await menu('swapLeaves.A');
    pass('promoting a deeper outgoing descendant still leaves the old Main accessible without writing links');
    await js('swapLeaves.Deep.detach();true');
    for (let i = 0; i < 3; i++) { await menu('swapLeaves.B'); await menu('swapLeaves.A'); }
    assert.deepEqual((await snapshot()).leaves, before.leaves);
    pass('repeated forward/back swaps do not duplicate, close or reorder tabs');
    await menu('swapLeaves.B'); await tab('swapLeaves.C');
    await verifyFixtures(vault); await save();
    const expected = await snapshot(); await writeFile(`${dir}/expected.json`, j(expected));
    await cp(`${vault}/.obsidian/workspace.json`, `${dir}/expected-workspace.json`);
    await cp(`${vault}/.obsidian/plugins/md-palette/data.json`, `${dir}/expected-data.json`);
    await writeFile(`${dir}/ui.json`, j({ passed: true, version: '0.1.13', checks, errors: c.errors }));
    assert.equal(c.errors.length, 0); await c.screenshot(`${dir}/existing-tab.png`);
  } else if (mode === 'restart') {
    await c.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1000, deviceScaleFactor: 1, mobile: false });
    await wait(`${p}?.ready`); assert.equal(await js(`${p}.manifest.version`), '0.1.13');
    const expected = JSON.parse(await readFile(`${dir}/expected.json`, 'utf8'));
    assert.deepEqual(await snapshot(), expected);
    await js(`window.swapLeaves={};app.workspace.iterateAllLeaves(l=>{const path=l.getViewState().state?.file;if(path?.startsWith(${j(root + '/')}))swapLeaves[path.split('/').at(-1).split('.')[0]]=l});true`);
    await tab('swapLeaves.C'); assert.equal(await js('app.workspace.getMostRecentLeaf().id'), await js('swapLeaves.C.id'));
    await tab('swapLeaves.Map'); assert.equal(await js('app.workspace.getMostRecentLeaf().id'), await js('swapLeaves.Map.id'));
    await menu('swapLeaves.A'); await menu('swapLeaves.B'); await tab('swapLeaves.C');
    assert.deepEqual(await snapshot(), expected); await verifyFixtures(vault);
    assert.equal(c.errors.length, 0); await c.screenshot(`${dir}/restart.png`);
    pass('process restart restores roles, every tab and folders; existing tabs and reverse swap still work');
    await writeFile(`${dir}/restart.json`, j({ passed: true, version: '0.1.13', checks, errors: c.errors }));
  }
} finally { c.close(); }
