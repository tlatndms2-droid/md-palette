import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const repository = 'tlatndms2-droid/md-palette';
const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
const tag = manifest.version;
const reportDir = tag === '0.1.5' ? '.artifacts/footnote-choice' : tag === '0.1.4' ? '.artifacts/metadata-font' : tag === '0.1.3' ? '.artifacts/metadata-markdown' : tag === '0.1.0' ? '.artifacts/stage7' : tag === '0.0.15' ? '.artifacts/sub-height' : tag === '0.0.14' ? '.artifacts/new-note' : tag === '0.0.13' ? '.artifacts/revision4' : tag === '0.0.12' ? '.artifacts/stage6' : tag === '0.0.11' ? '.artifacts/revision3' : tag === '0.0.10' ? '.artifacts/revision2' : tag === '0.0.9' ? '.artifacts/stage5' : tag === '0.0.8' ? '.artifacts/revision' : tag === '0.0.7' ? '.artifacts/stage4' : tag === '0.0.1' ? '.artifacts' : tag === '0.0.2' ? '.artifacts/stage1' : tag === '0.0.6' ? '.artifacts/stage3-fix' : tag === '0.0.5' ? '.artifacts/stage3' : tag === '0.0.4' ? '.artifacts/stage2-drag' : '.artifacts/stage2';
const mode = process.argv[2] || 'inspect';
const credential = execFileSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
const token = credential.split(/\r?\n/).find(line => line.startsWith('password='))?.slice(9);
if (!token) throw new Error('GitHub credential unavailable');
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
async function api(path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${path}`);
  return response.json();
}
const repo = await api('');
let release = await api(`/releases/tags/${tag}`);
if (mode === 'inspect') {
  console.log({ repository, defaultBranch: repo.default_branch, public: !repo.private, existingRelease: release?.html_url || null });
}
if (mode === 'publish') {
  assert.equal(repo.private, false);
  assert.equal(release, null, 'Existing published release must not be overwritten');
  if (tag === '0.0.1') {
    const restart = JSON.parse(await readFile('.artifacts/restart-result.json', 'utf8'));
    const ui = JSON.parse(await readFile('.artifacts/install-ui.json', 'utf8'));
    assert.equal(restart.version, tag);
    assert.ok(restart.enabled && ui.workspaceUnchanged);
  } else {
    const ready = JSON.parse(await readFile(`${reportDir}/release-ready.json`, 'utf8'));
    assert.equal(ready.version,tag);
    assert.equal(ready.passed,true);
    for (const asset of ready.assets) assert.equal(createHash('sha256').update(await readFile(asset.name)).digest('hex'),asset.sha256);
  }
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  release = await api('/releases', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: tag, target_commitish: commit, name: `MD Palette ${tag}`, body: await readFile('RELEASE_NOTES.md', 'utf8'), draft: false, prerelease: false })
  });
  for (const name of ['main.js', 'manifest.json', 'styles.css']) {
    const current = await api(`/releases/${release.id}`);
    const url = current.upload_url.replace(/\{.*$/, '') + `?name=${encodeURIComponent(name)}`;
    const response = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/octet-stream' }, body: await readFile(name) });
    if (!response.ok) throw new Error(`Asset upload failed: ${name}, HTTP ${response.status}`);
  }
}
if (mode === 'publish' || mode === 'verify') {
  release = await api(`/releases/tags/${tag}`);
  assert.ok(release && !release.draft);
  assert.deepEqual(release.assets.map(a=>a.name).sort(), ['main.js','manifest.json','styles.css'].sort());
  const results = [];
  for (const name of ['main.js', 'manifest.json', 'styles.css']) {
    const asset = release.assets.find(a => a.name === name);
    // Deliberately no authorization header: verify the public download path.
    const response = await fetch(asset.browser_download_url);
    assert.equal(response.ok, true, `Public download: ${name}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = data => createHash('sha256').update(data).digest('hex');
    assert.equal(hash(bytes), hash(await readFile(name)), `Release hash: ${name}`);
    results.push({ name, sha256: hash(bytes), url: asset.browser_download_url });
  }
  await mkdir(reportDir, { recursive: true });
  await writeFile(`${reportDir}/release-verification.json`, JSON.stringify({ url: release.html_url, assets: results }, null, 2));
  console.log({ url: release.html_url, assets: results });
}
