import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { connect } from './cdp.mjs';

// Opt-in development probe; never imported by the released plugin.
const cdp = await connect();
const mode = process.argv[2] || 'setup';
await mkdir('.artifacts', { recursive: true });
try {
  if (mode === 'setup') {
    const result = await cdp.evaluate(`(async () => {
      if (!app.vault.getName().startsWith('MDPalette-Stage0-Sandbox')) throw Error('Wrong vault');
      window.stage0OriginalLayout = app.workspace.getLayout();
      const names = ['Main', 'Main-inactive', 'Ordinary', 'Ordinary-inactive', 'Sub', 'Reference'];
      await app.vault.createFolder('Stage0-Fixtures');
      for (const name of names) await app.vault.create('Stage0-Fixtures/' + name + '.md', '# ' + name + '\\n\\n원본 보존 시험 자료입니다.\\n');
      await app.vault.create('Stage0-Fixtures/Drop.canvas', JSON.stringify({ nodes: [], edges: [] }));
      const leaf = (id, name) => ({ id, type: 'leaf', state: { type: 'markdown', state: { file: 'Stage0-Fixtures/' + name + '.md', mode: 'source', source: false } } });
      const tabs = (id, children) => ({ id, type: 'tabs', children });
      const layout = app.workspace.getLayout();
      layout.main.children = [
        tabs('s0-main', [leaf('s0-main-a', 'Main'), leaf('s0-main-b', 'Main-inactive')]),
        tabs('s0-ordinary', [leaf('s0-ordinary-a', 'Ordinary'), leaf('s0-ordinary-b', 'Ordinary-inactive')]),
        tabs('s0-sub', [leaf('s0-sub-a', 'Sub')]),
        tabs('s0-reference', [leaf('s0-reference-a', 'Reference')])
      ];
      layout.active = 's0-main-a';
      await app.workspace.changeLayout(layout);
      const root = app.workspace.rootSplit;
      window.stage0Groups = [...root.children];
      window.stage0Leaves = root.children.flatMap(group => [...group.children]);
      window.stage0SourceHashes = await Promise.all(names.map(async name => ({ name, content: await app.vault.read(app.vault.getAbstractFileByPath('Stage0-Fixtures/' + name + '.md')) })));
      return { title: document.title, groupIds: root.children.map(g => g.id), leaves: window.stage0Leaves.map(l => l.id) };
    })()`);
    await writeFile('.artifacts/setup.json', JSON.stringify(result, null, 2));
    console.log(result);
  }
  if (mode === 'reorder') {
    const result = await cdp.evaluate(`(() => {
      const root = app.workspace.rootSplit;
      const originalGroups = window.stage0Groups;
      const originalLeaves = window.stage0Leaves;
      const before = root.children.map(group => ({ id: group.id, active: group.currentTab, leaves: group.children.map(l => ({ id: l.id, file: l.getViewState().state.file })) }));
      const ordinary = originalGroups[1];
      // Move only the managed groups; the ordinary group object and its leaves stay alive.
      for (const [group, index] of [[originalGroups[2], 1], [originalGroups[3], 2]]) {
        if (group.parent !== root || typeof root.insertChild !== 'function') throw Error('Unsupported workspace structure');
        root.removeChild(group);
        root.insertChild(index, group);
      }
      app.workspace.requestSaveLayout();
      return {
        before, after: root.children.map(group => ({ id: group.id, active: group.currentTab, leaves: group.children.map(l => ({ id: l.id, file: l.getViewState().state.file })) })),
        sameGroups: originalGroups.every(g => root.children.includes(g)),
        sameLeaves: originalLeaves.every(l => app.workspace.getLeafById(l.id) === l),
        ordinaryPreserved: ordinary.children.length === 2 && ordinary.children.every(l => l.getViewState().state.file.includes('Ordinary')),
        visibleOrder: root.children.map(g => ({ id: g.id, x: g.containerEl.getBoundingClientRect().x }))
      };
    })()`);
    assert.deepEqual(result.after.map(g => g.id), ['s0-main', 's0-sub', 's0-reference', 's0-ordinary']);
    assert.ok(result.sameGroups && result.sameLeaves && result.ordinaryPreserved);
    for (const before of result.before) assert.deepEqual(result.after.find(g => g.id === before.id), before);
    await writeFile('.artifacts/reorder.json', JSON.stringify(result, null, 2));
    await cdp.screenshot('.artifacts/reordered-groups.png');
    console.log(result);
  }
  if (mode === 'canvas') {
    console.log(await cdp.evaluate(`(async () => {
      const leaf = app.workspace.getLeaf('tab');
      await leaf.openFile(app.vault.getAbstractFileByPath('Stage0-Fixtures/Drop.canvas'));
      const canvas = leaf.view.canvas;
      window.stage0CanvasLeaf = leaf;
      const prototypes=[]; let p=canvas;
      while(p && prototypes.length<3) { prototypes.push(Object.getOwnPropertyNames(p)); p=Object.getPrototypeOf(p); }
      return { prototypes, rect: canvas.wrapperEl?.getBoundingClientRect().toJSON(), functions: Object.fromEntries(['posFromEvt','createTextNode','getData','requestSave','setViewport','zoomToBbox'].map(k=>[k,canvas[k]?.toString()])) };
    })()`));
  }
  if (mode === 'sources') {
    const result = await cdp.evaluate(`(async()=>Promise.all(window.stage0SourceHashes.map(async ({name,content})=>({name,unchanged: content === await app.vault.read(app.vault.getAbstractFileByPath('Stage0-Fixtures/'+name+'.md'))}))))()`);
    assert.ok(result.every(r => r.unchanged));
    console.log(result);
  }
  if (mode === 'drop') {
    // Expand the existing Canvas group for a visible drop trial; other groups stay alive.
    await cdp.evaluate(`(() => {
      const root = app.workspace.rootSplit;
      root.children.forEach(g => g.setDimension(g === window.stage0CanvasLeaf.parent ? 70 : 10));
      app.workspace.leftSplit.collapse();
      const canvas = window.stage0CanvasLeaf.view.canvas;
      window.stage0Drops = [];
      const accept = event => {
        if (!event.dataTransfer.types.includes('application/x-md-palette-stage0')) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.type !== 'drop') return;
        const pos = canvas.posFromEvt(event);
        const node = canvas.createTextNode({ pos, size: { width: 220, height: 100 }, text: 'Stage 0: 실제 드롭 좌표', focus: false });
        window.stage0Drops.push({ client: { x: event.clientX, y: event.clientY }, pos, node: node.getData(), trusted: event.isTrusted });
      };
      canvas.wrapperEl.addEventListener('dragover', accept, true);
      canvas.wrapperEl.addEventListener('drop', accept, true);
      window.stage0RemoveDrop = () => { canvas.wrapperEl.removeEventListener('dragover', accept, true); canvas.wrapperEl.removeEventListener('drop', accept, true); };
    })()`);
    const results = [];
    for (const [x, y, zoom] of [[0, 0, 0], [430, -270, -1], [-120, 300, 0.5]]) {
      await cdp.evaluate(`window.stage0CanvasLeaf.view.canvas.setViewport(${x},${y},${zoom})`);
      await cdp.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
      const point = await cdp.evaluate('(()=>{const r=window.stage0CanvasLeaf.view.canvas.wrapperEl.getBoundingClientRect();return {x:r.x+r.width*0.4,y:r.y+r.height*0.35}})()');
      const data = { items: [{ mimeType: 'application/x-md-palette-stage0', data: 'probe' }], dragOperationsMask: 1 };
      for (const type of ['dragEnter', 'dragOver', 'drop']) await cdp.send('Input.dispatchDragEvent', { type, ...point, data });
      await cdp.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
      const result = await cdp.evaluate(`(() => {
        const drop = window.stage0Drops.at(-1);
        const canvas = window.stage0CanvasLeaf.view.canvas;
        const node = canvas.nodes.get(drop.node.id);
        const bounds = node.nodeEl.getBoundingClientRect();
        return { ...drop, viewport: {x:canvas.x,y:canvas.y,zoom:canvas.zoom}, bounds: bounds.toJSON(), errorPx: { x: bounds.x-drop.client.x, y:bounds.y-drop.client.y } };
      })()`);
      assert.ok(result.trusted);
      assert.ok(Math.abs(result.errorPx.x) < 2 && Math.abs(result.errorPx.y) < 2, JSON.stringify(result));
      results.push(result);
    }
    await cdp.evaluate('window.stage0CanvasLeaf.view.save()');
    await writeFile('.artifacts/canvas-drop.json', JSON.stringify(results, null, 2));
    await cdp.screenshot('.artifacts/canvas-drop.png');
    console.log(results);
    await cdp.evaluate('window.stage0RemoveDrop()');
  }
  if (mode === 'manifest') {
    console.log(await cdp.evaluate('({title:document.title,manifest:app.plugins.plugins["md-palette"]?.manifest,enabled:app.plugins.enabledPlugins.has("md-palette")})'));
  }
  assert.deepEqual(cdp.errors, []);
} finally { cdp.close(); }
