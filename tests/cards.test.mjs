import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
const { code } = await transform(await readFile('src/cards-state.ts', 'utf8'), { loader: 'ts', format: 'esm' });
const { readCards, reorder, bodyOnly, pruneLabels, classify, deleteLabel, toggleType, typeSelected } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('deleting a label removes all its assignments and filter without changing files or other labels', () => {
  const state = readCards({ order: ['A.md', 'B.md', 'C.md'], labels: [{id:'x',name:'X',color:'#123456'}, {id:'y',name:'Y',color:'#abcdef'}], assignments:{'A.md':'x','B.md':'x','C.md':'y'},labelFilter:['x','y'] });
  deleteLabel(state, 'x');
  assert.deepEqual(state.order, ['A.md','B.md','C.md']);
  assert.deepEqual({...state.assignments}, {'C.md':'y'});
  assert.deepEqual(state.labels.map(l=>l.id), ['y']);
  assert.deepEqual(state.labelFilter, ['y']);
  assert.deepEqual(readCards(state), state);
  const saved = JSON.stringify(state); deleteLabel(state, 'missing'); assert.equal(JSON.stringify(state), saved);
});
test('group reorder preserves relative order, hidden Main slot and unrelated paths', () => {
  const order = ['A', 'B', 'Main', 'C', 'D', 'E'];
  assert.deepEqual(reorder(order, ['D', 'B'], 'E', true), ['A', 'Main', 'C', 'E', 'B', 'D']);
  assert.deepEqual(reorder(order, ['B', 'D'], 'B', false), order);
  assert.deepEqual(reorder(order, ['B', 'D'], 'missing', false), order);
  assert.deepEqual(order, ['A', 'B', 'Main', 'C', 'D', 'E']);
});
test('frontmatter removal preserves body formatting, headings and body separators', () => {
  assert.equal(bodyOnly('---\r\nsecret: hidden\r\n---\r\n# Title\r\n\r\n---\r\nBody'), '# Title\r\n\r\n---\r\nBody');
  assert.equal(bodyOnly('# Title\n---\nBody'), '# Title\n---\nBody');
  assert.equal(bodyOnly('---\nunfinished: value'), '---\nunfinished: value');
});
test('one-file-one-label replacement prunes unused labels and stale filters only', () => {
  const s = readCards({ labels: [{id:'x',name:'X',color:'#123456'},{id:'y',name:'Y',color:'#abcdef'}], assignments:{A:'x',B:'y'}, labelFilter:['x','y'] });
  s.assignments.A = 'y'; pruneLabels(s);
  assert.deepEqual(s.labels.map(l=>l.id), ['y']); assert.deepEqual(s.labelFilter,['y']); assert.equal(s.assignments.B,'y');
});
test('corrupt view state cannot inject invalid labels or orders', () => {
  const s = readCards({order:['A',42,'A','B'],display:'invalid',labels:[null,{id:'x',name:'x',color:'url(bad)'}],assignments:{A:'x'},labelFilter:['x']});
  assert.deepEqual(s.order,['A','B']); assert.equal(s.display,'list'); assert.deepEqual(s.labels,[]); assert.deepEqual(s.labelFilter,[]);
  assert.equal(classify('PDF'),'pdf'); assert.equal(classify('webm'),'video'); assert.equal(classify('unknown'),'other');
});

test('multi type filter migrates legacy selection, preserves empty and reconnects all state', () => {
  const state=readCards({fileType:'md',display:'large',order:['B','A']});
  assert.deepEqual(state.selectedTypes,['md']);assert.equal(state.display,'list');
  toggleType(state,'canvas');assert.deepEqual(state.selectedTypes,['md','canvas']);assert.equal(typeSelected(state,'all'),false);
  toggleType(state,'all');assert.equal(typeSelected(state,'all'),true);toggleType(state,'pdf');assert.equal(typeSelected(state,'all'),false);toggleType(state,'pdf');assert.equal(typeSelected(state,'all'),true);
  for(const t of [...state.selectedTypes])toggleType(state,t);
  assert.deepEqual(readCards(state).selectedTypes,[]);assert.deepEqual(state.order,['B','A']);
});
