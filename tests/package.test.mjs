import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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

test('release excludes development probes and filesystem writes', async () => {
  const bundle = await readFile('main.js', 'utf8');
  assert.ok(!bundle.includes('Stage0-Fixtures'));
  assert.ok(!bundle.includes('19273'));
  assert.ok(!bundle.includes('writeFileSync'));
});
