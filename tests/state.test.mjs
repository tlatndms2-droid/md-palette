import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const {code}=await transform(await readFile('src/state.ts','utf8'),{loader:'ts',format:'esm'});
const {readSpaces}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('bad saved roles do not become workspace targets',()=>{
  for(const value of [null,[],42,'broken'])assert.deepEqual(readSpaces(value),{});
  assert.deepEqual(readSpaces({main:{groupId:42,activeFile:'A.md'},sub:{groupId:'sub',activeFile:{}},reference:'wrong'}),{});
});
test('valid role metadata survives without inventing missing groups or changing input',()=>{
  const input={main:{groupId:'main-id',activeFile:'A.md'},emptySubId:'reserved-id',future:'leave alone'};
  const copy=structuredClone(input);
  assert.deepEqual(readSpaces(input),{main:{groupId:'main-id',activeFile:'A.md'},emptySubId:'reserved-id'});
  assert.deepEqual(input,copy);
  assert.deepEqual(readSpaces({reference:{groupId:'ref-id',activeFile:null}}),{reference:{groupId:'ref-id',activeFile:null}});
});
