import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { connect } from './cdp.mjs';

const cdp = await connect();
try {
  const result = await cdp.evaluate(`({
    title:document.title,
    version:app.plugins.plugins['md-palette']?.manifest.version,
    enabled:app.plugins.enabledPlugins.has('md-palette'),
    groups:app.workspace.rootSplit.children.map(g=>({id:g.id,active:g.currentTab,files:g.children.map(l=>l.getViewState().state.file)})),
    canvas:app.workspace.getLeavesOfType('canvas')[0]?.view.canvas.getData()
  })`);
  assert.equal(result.version, '0.0.1');
  assert.equal(result.enabled, true);
  assert.deepEqual(result.groups.map(g=>g.id), ['s0-main','s0-sub','s0-reference','s0-ordinary']);
  assert.deepEqual(result.groups.at(-1).files, ['Stage0-Fixtures/Ordinary.md','Stage0-Fixtures/Ordinary-inactive.md']);
  assert.equal(result.groups[0].active, 1);
  const saved = JSON.parse(await readFile('.artifacts/restart-Drop.canvas', 'utf8'));
  const sorted = data => data.nodes.sort((a,b)=>a.id.localeCompare(b.id));
  assert.deepEqual(sorted(result.canvas), sorted(saved));
  assert.deepEqual(cdp.errors, []);
  await writeFile('.artifacts/restart-result.json', JSON.stringify(result,null,2));
  console.log('PASS: 0.0.1 enabled, group order, active/inactive tabs and all Canvas nodes survived process restart.');
} finally { cdp.close(); }
