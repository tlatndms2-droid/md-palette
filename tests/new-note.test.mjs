import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code} = await transform(await readFile('src/new-note-name.ts','utf8'), {loader:'ts',format:'esm'});
const {newNoteName} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('new Markdown names retain Korean and spaces and accept an explicit extension', () => {
  assert.equal(newNoteName('  벡터 공부  '), '벡터 공부.md');
  assert.equal(newNoteName('자료.MD'), '자료.md');
  assert.equal(newNoteName('자료.v2'), '자료.v2.md');
});
test('new note names cannot escape the chosen folder or introduce malformed links', () => {
  for (const name of ['', ' ', '.md', '..', '../자료', '폴더/자료', '폴더\\자료', 'A#B', 'A[[B]]', 'A|B', 'A^B', 'A\nB', 'A?', 'CON', 'nul.txt', 'lpt1', '자료.', '자료 .md', 'a'.repeat(181)]) assert.throws(() => newNoteName(name), name);
});

test('Canvas selection controls extension and keeps safe filenames', () => {
  assert.equal(newNoteName('  공부 지도  ', 'canvas'), '공부 지도.canvas');
  assert.equal(newNoteName('공부.CANVAS', 'canvas'), '공부.canvas');
  assert.equal(newNoteName('공부.md', 'canvas'), '공부.canvas');
  assert.equal(newNoteName('공부.canvas', 'md'), '공부.md');
  for (const name of ['', '.canvas', '../공부', 'NUL.canvas', 'a'.repeat(181)]) assert.throws(() => newNoteName(name, 'canvas'));
  assert.throws(() => newNoteName('자료', 'pdf'));
});
