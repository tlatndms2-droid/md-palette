import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

class TFile { constructor(path) { this.path = path; this.extension = path.split('.').at(-1); } }
class WorkspaceLeaf {
  constructor(file, group) { this.file = file; this.parent = group; this.type = file.extension === 'md' ? 'markdown' : file.extension === 'canvas' ? 'canvas' : 'pdf'; }
  getViewState() { return { type: this.type, state: { file: this.file.path } }; }
  async openFile(file) { this.file = file; }
  async setViewState(state) { this.file = files.get(state.state.file); this.type = state.type; }
  getRoot() { return root; }
}
const root = {}, files = new Map(), notices = [];
let designation;
const groupOf = leaf => leaf?.parent;
globalThis.__swapTest = {
  Plugin: class {}, FuzzySuggestModal: class {}, TFile, WorkspaceLeaf,
  Notice: class { constructor(message) { notices.push(message); } },
  SubDesignationModal: class { constructor(_plugin, _main, _file, apply) { this.apply = apply; } open() { designation = this; } },
  groupOf, fileIn: (_app, leaf) => leaf?.file ?? null,
  isCentral: (_app, group) => group?.central !== false,
  groupsIn: app => app.groups, activeIn: group => group?.children[group.currentTab],
  readFolders: state => structuredClone(state),
};
async function load(file) {
  const source = (await readFile(file, 'utf8')).replace(/^import .*;\r?$/gm, '');
  const { code } = await transform(`const {${Object.keys(globalThis.__swapTest).join(',')}} = globalThis.__swapTest;\n${source}`, { loader: 'ts', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const { default: Plugin } = await load('src/main.ts');
const { SubOpenGuard } = await load('src/sub-open-guard.ts');
function setup() {
  files.clear(); notices.length = 0; designation = undefined;
  const group = names => {
    const g = { children: [], currentTab: 0, selectTabIndex(index) { this.currentTab = index; } };
    g.children = names.map(name => { const file = files.get(name) ?? new TFile(name); files.set(name, file); return new WorkspaceLeaf(file, g); });
    return g;
  };
  const a = group(['A.md', 'C.md']), b = group(['B.md', 'D.md']), normal = group(['N.md', 'Map.canvas', 'Document.pdf']);
  const p = Object.create(Plugin.prototype), disposers = [];
  p.app = { groups: [a, b, normal], vault: { getAbstractFileByPath: path => files.get(path) }, workspace: {
    iterateAllLeaves(fn) { for (const g of [a, b, normal]) g.children.forEach(fn); },
    getMostRecentLeaf() { return a.children[a.currentTab]; },
    setActiveLeaf(leaf) { leaf.parent.currentTab = leaf.parent.children.indexOf(leaf); this.active = leaf; },
    on() {}, async revealLeaf() {},
  } };
  Object.assign(p, { mainGroup: a, mainLeaf: a.children[0], pinnedMain: a.children[0].file, subGroup: b, subGroups: [b], foldersByMain: { 'A.md': { order: ['A-specific'] }, 'B.md': { order: ['B-specific'] } }, folderDefaults: {} });
  p.clearIcons = () => {}; p.openSidebar = async () => {}; p.register = fn => disposers.push(fn); p.registerEvent = () => {};
  p.linkedPaths = () => new Set([p.mainFile.path, 'A.md', 'B.md']);
  return { p, a, b, normal, cleanup: () => disposers.reverse().forEach(fn => fn()) };
}

function connections(p) {
  const frontmatter = new Map(), writes = [];
  p.connectedFiles = () => []; p.render = () => {}; p.updateIcons = () => {}; p.persist = () => {};
  p.app.metadataCache = { getFirstLinkpathDest: path => files.get(path) };
  p.app.fileManager = { async processFrontMatter(file, change) {
    assert.equal(file.extension, 'md', 'Canvas must never be passed to Markdown writer');
    const next = structuredClone(frontmatter.get(file.path) ?? {}); change(next);
    frontmatter.set(file.path, next); writes.push(file.path);
  } };
  return { frontmatter, writes };
}

test('Sub promotion exchanges roles in place and preserves inactive tabs and each Main folder state', async () => {
  const { p, a, b, normal } = setup(), groups = [...p.app.groups], leaves = groups.flatMap(g => g.children);
  a.currentTab = 1; // Main remains pinned to A while unrelated C is visible.
  await p.setMain(b.children[0]);
  assert.equal(p.mainGroup, b); assert.equal(p.mainFile.path, 'B.md'); assert.equal(p.subGroup, a);
  assert.deepEqual(p.subGroups, [a]); assert.equal(a.currentTab, 1);
  assert.deepEqual(p.app.groups, groups); assert.deepEqual(groups.flatMap(g => g.children), leaves);
  assert.deepEqual(p.folders.order, ['B-specific']);
  await p.setMain(a.children[0]);
  assert.equal(p.mainGroup, a); assert.equal(p.subGroup, b); assert.deepEqual(p.folders.order, ['A-specific']);
  assert.deepEqual(normal.children.map(l => l.file.path), ['N.md', 'Map.canvas', 'Document.pdf']);
});

test('ordinary Main replacement keeps its previous behavior and unsupported PDF changes no roles', async () => {
  const { p, a, b, normal } = setup();
  await p.setMain(normal.children[2]);
  assert.equal(p.mainGroup, a); assert.equal(p.subGroup, b);
  await p.setMain(normal.children[0]);
  assert.equal(p.mainFile.path, 'N.md'); assert.equal(p.subGroup, undefined); assert.deepEqual(p.subGroups, []);
});

test('Canvas can become Main and exchange with Markdown without moving tabs', async () => {
  const { p, a, b, normal } = setup();
  const canvas = normal.children[1];
  normal.children.splice(1, 1); b.children.push(canvas); canvas.parent = b;
  await p.setMain(canvas);
  assert.equal(p.mainFile.path, 'Map.canvas'); assert.equal(p.subGroup, a);
  assert.equal(p.mainLeaf, canvas); assert.equal(b.children.length, 3);
  await p.setMain(a.children[0]);
  assert.equal(p.mainFile.path, 'A.md'); assert.equal(p.subGroup, b);
  assert.equal(b.children[2], canvas);
});

test('stale Main cannot be demoted into Sub during a swap', async () => {
  const { p, a, b } = setup(); p.mainLeaf.file = files.get('C.md');
  await p.setMain(b.children[0]);
  assert.equal(p.mainGroup, a); assert.equal(p.subGroup, b); assert.match(notices.at(-1), /기존 Main/);
});

test('existing unlinked tabs remain selectable and reloadable, but new unlinked replacements remain blocked', async () => {
  const { p, a, b, normal, cleanup } = setup();
  p.subOpenGuard = new SubOpenGuard(p);
  try {
    await p.setMain(b.children[0]);
    const c = a.children[1];
    a.selectTabIndex(1); assert.equal(a.currentTab, 1);
    p.app.workspace.setActiveLeaf(c); assert.equal(p.app.workspace.active, c);
    await c.setViewState({ type: 'markdown', state: { file: 'C.md' } }); assert.equal(c.file.path, 'C.md');
    await p.openIn('sub', files.get('C.md')); assert.equal(p.app.workspace.active, c);
    await c.openFile(normal.children[0].file); assert.equal(c.file.path, 'C.md');
    await c.setViewState({ type: 'markdown', state: { file: 'N.md' } }); assert.equal(c.file.path, 'C.md');
    await p.openIn('sub', files.get('N.md')); assert.equal(c.file.path, 'C.md');
    await c.openFile(files.get('A.md')); assert.equal(c.file.path, 'A.md');
    await c.openFile(files.get('C.md')); assert.equal(c.file.path, 'A.md'); // Prior open is not a permanent exemption.
  } finally { cleanup(); }
});

test('Canvas Main connection writes a reverse link only to the selected note and preserves properties', async () => {
  const { p, a, normal } = setup(), { frontmatter, writes } = connections(p);
  await p.setMain(normal.children[1]); const canvas = p.mainFile, note = a.children[0].file;
  frontmatter.set(note.path, { topic: 'study', 'link note': ['[[B.md]]'] });
  assert.equal(await p.addConnection(canvas, note, true), true);
  assert.deepEqual(frontmatter.get(note.path), { topic: 'study', 'link note': ['[[B.md]]', '[[Map.canvas]]'] });
  assert.deepEqual(writes, ['A.md']); assert.equal(await p.addConnection(canvas, note, true), false);
  assert.deepEqual(frontmatter.get(note.path)['link note'], ['[[B.md]]', '[[Map.canvas]]']);
  await assert.rejects(p.mainText(canvas), /Markdown/);
  await assert.rejects(p.patchMain(canvas, '{}', 0, 1, 'x'), /Markdown/);
});

test('Markdown Main still stores an outgoing Canvas link on Main', async () => {
  const { p, normal } = setup(), { frontmatter, writes } = connections(p);
  await p.addConnection(p.mainFile, normal.children[1].file, true);
  assert.deepEqual(writes, ['A.md']); assert.deepEqual(frontmatter.get('A.md'), { 'link note': ['[[Map.canvas]]'] });
});

test('Canvas reverse-link rejects unsupported targets, invalid properties and stale actions without writes', async () => {
  const { p, a, normal } = setup(), { frontmatter, writes } = connections(p);
  await p.setMain(normal.children[1]); const canvas = p.mainFile, note = a.children[0].file;
  await assert.rejects(p.addConnection(canvas, normal.children[2].file, true), /Markdown/);
  frontmatter.set(note.path, { 'link note': 42 });
  await assert.rejects(p.addConnection(canvas, note, true), /link note/);
  assert.deepEqual(frontmatter.get(note.path), { 'link note': 42 });
  frontmatter.set(note.path, {});
  await assert.rejects(p.addConnection(canvas, note, true, () => false), /변경/);
  assert.deepEqual(writes, []);
});

test('Canvas creation starts placement on captured Main and keeps the empty file when placement is cancelled or unavailable', async () => {
  const { p, normal } = setup();
  await p.setMain(normal.children[1]); const main = p.mainFile;
  p.newLinkedNotePath = (_main, name) => name + '.canvas';
  p.app.vault.getAllLoadedFiles = () => [...files.values()];
  const bodies = new Map(), placements = [];
  p.app.vault.create = async (path, body) => { const f = new TFile(path); files.set(path, f); bodies.set(path, body); return f; };
  p.addConnection = () => { throw Error('must use placement, not Markdown properties'); };
  p.canvasInsert = { newCanvas: (...args) => placements.push(args) };
  const file = await p.createLinkedNote(main, 'New', undefined, 'canvas');
  assert.deepEqual(placements, [[main, file, undefined]]);
  assert.deepEqual(JSON.parse(bodies.get(file.path)), { nodes: [], edges: [] });
  assert.equal(files.get(file.path), file);
  await assert.rejects(p.createLinkedNote(main, 'New', undefined, 'canvas'), /같은 이름/);
  p.canvasInsert.newCanvas = () => { throw Error('Main changed'); };
  const retained = await p.createLinkedNote(main, 'Retained', undefined, 'canvas');
  assert.equal(files.get(retained.path), retained);
  assert.deepEqual(JSON.parse(bodies.get(retained.path)), { nodes: [], edges: [] });
  assert.match(notices.at(-1), /빈 Canvas는 만들었습니다/);
});

test('stale Sub designation rolls the newly added reverse link back out of the note, never Canvas', async () => {
  const { p, a, normal } = setup(), { frontmatter, writes } = connections(p);
  await p.setMain(normal.children[1]); const note = a.children[0].file;
  frontmatter.set(note.path, { 'link note': ['[[B.md]]'], topic: 'keep' });
  await p.toggleSub(a.children[0]); assert.ok(designation);
  const original = p.app.fileManager.processFrontMatter;
  let first = true;
  p.app.fileManager.processFrontMatter = async (file, change) => {
    await original(file, change);
    if (first) { first = false; a.children[0].file = files.get('C.md'); }
  };
  await assert.rejects(designation.apply(), /취소/);
  assert.equal(p.subGroup, undefined);
  assert.deepEqual(frontmatter.get(note.path), { 'link note': ['[[B.md]]'], topic: 'keep' });
  assert.deepEqual(writes, ['A.md', 'A.md']);
});
