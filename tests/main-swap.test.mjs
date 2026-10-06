import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

class TFile { constructor(path) { this.path = path; this.extension = path.split('.').at(-1); } }
class WorkspaceLeaf {
  constructor(file, group) { this.file = file; this.parent = group; this.type = file.extension === 'md' ? 'markdown' : 'canvas'; }
  getViewState() { return { type: this.type, state: { file: this.file.path } }; }
  async openFile(file) { this.file = file; }
  async setViewState(state) { this.file = files.get(state.state.file); this.type = state.type; }
  getRoot() { return root; }
}
const root = {}, files = new Map(), notices = [];
const groupOf = leaf => leaf?.parent;
globalThis.__swapTest = {
  Plugin: class {}, FuzzySuggestModal: class {}, TFile, WorkspaceLeaf,
  Notice: class { constructor(message) { notices.push(message); } },
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
  files.clear(); notices.length = 0;
  const group = names => {
    const g = { children: [], currentTab: 0, selectTabIndex(index) { this.currentTab = index; } };
    g.children = names.map(name => { const file = files.get(name) ?? new TFile(name); files.set(name, file); return new WorkspaceLeaf(file, g); });
    return g;
  };
  const a = group(['A.md', 'C.md']), b = group(['B.md', 'D.md']), normal = group(['N.md', 'Map.canvas']);
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
  assert.deepEqual(normal.children.map(l => l.file.path), ['N.md', 'Map.canvas']);
});

test('ordinary Main replacement keeps its previous behavior and unsupported Canvas changes no roles', async () => {
  const { p, a, b, normal } = setup();
  await p.setMain(normal.children[1]);
  assert.equal(p.mainGroup, a); assert.equal(p.subGroup, b);
  await p.setMain(normal.children[0]);
  assert.equal(p.mainFile.path, 'N.md'); assert.equal(p.subGroup, undefined); assert.deepEqual(p.subGroups, []);
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
