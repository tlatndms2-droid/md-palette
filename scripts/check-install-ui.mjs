import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { connect } from './cdp.mjs';

const cdp = await connect();
let ui;
try {
  await cdp.evaluate('app.setting.open(); app.setting.openTabById("community-plugins"); true');
  ui = await connect(19273, 'settings');
  const before = await cdp.evaluate('JSON.stringify(app.workspace.getLayout())');
  const results = [];
  for (const expected of [false, true]) {
    const point = await ui.evaluate(`(() => {
      const toggle = document.querySelector('[data-plugin-id="md-palette"] .checkbox-container');
      if (!toggle) throw Error('MD Palette setting row missing');
      const r = toggle.getBoundingClientRect();
      return { x: r.x+r.width/2, y: r.y+r.height/2 };
    })()`);
    await ui.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await ui.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
    let result;
    for (let i=0; i<30; i++) {
      result = await cdp.evaluate('({loaded:!!app.plugins.plugins["md-palette"], enabled:app.plugins.enabledPlugins.has("md-palette")})');
      result.visible = await ui.evaluate('document.querySelector(\'[data-plugin-id="md-palette"] .checkbox-container\')?.classList.contains("is-enabled")');
      if (result.loaded === expected && result.enabled === expected && result.visible === expected) break;
      await new Promise(r => setTimeout(r, 100));
    }
    assert.equal(result.loaded, expected);
    assert.equal(result.enabled, expected);
    assert.equal(result.visible, expected);
    results.push(result);
  }
  assert.equal(await cdp.evaluate('JSON.stringify(app.workspace.getLayout())'), before);
  assert.deepEqual(cdp.errors, []);
  await ui.screenshot('.artifacts/installed-settings.png');
  await writeFile('.artifacts/install-ui.json', JSON.stringify({ results, workspaceUnchanged: true, exceptions: cdp.errors }, null, 2));
  console.log(results);
  await cdp.evaluate('app.setting.close(); app.workspace.saveLayout()');
} finally { ui?.close(); cdp.close(); }
