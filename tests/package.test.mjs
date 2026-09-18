import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('release version and desktop manifest agree', async () => {
  const read = async path => JSON.parse(await readFile(path, 'utf8'));
  const [pkg, manifest, versions] = await Promise.all([
    read('package.json'), read('manifest.json'), read('versions.json')
  ]);
  assert.equal(manifest.id, 'md-palette');
  assert.equal(manifest.version, pkg.version);
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  assert.equal(manifest.isDesktopOnly, true);
});

test('release loads without file writes, UI registration, or background tasks', async () => {
  const exports = {};
  const context = {
    module: { exports }, exports,
    require: id => {
      assert.equal(id, 'obsidian');
      return { Plugin: class {} };
    }
  };
  vm.runInNewContext(await readFile('main.js', 'utf8'), context);
  const plugin = new context.module.exports.default();
  await plugin.onload();
  assert.deepEqual(Object.keys(plugin), []);
});
