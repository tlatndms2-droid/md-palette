import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const {code}=await transform(await readFile('src/state.ts','utf8'),{loader:'ts',format:'esm'});
const {readSpaces,subOpenMode,subRestoreCandidates}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('bad saved roles do not become workspace targets',()=>{
  for(const value of [null,[],42,'broken'])assert.deepEqual(readSpaces(value),{});
  assert.deepEqual(readSpaces({main:{groupId:42,activeFile:'A.md'},sub:{groupId:'sub',activeFile:{}},reference:'wrong'}),{});
});
test('multiple Sub groups preserve order and last-used group while legacy single Sub still restores',()=>{
 const sub={groupId:'one',activeFile:'A.md'},second={groupId:'two',activeFile:null};
 assert.deepEqual(readSpaces({sub}),{sub});
 assert.deepEqual(readSpaces({sub:second,subs:[sub,second,sub,null,{groupId:3}]}),{sub:second,subs:[sub,second]});
 assert.deepEqual(readSpaces({main:{groupId:'main',activeFile:'Main.md'},subs:[{groupId:'main',activeFile:'Main.md'}]}).subs,[]);
});
test('modified gestures choose a Sub tab or an ordinary group, never another Sub',()=>{
 assert.equal(subOpenMode(),'replace');
 assert.equal(subOpenMode({ctrlKey:false,metaKey:false,shiftKey:true}),'replace');
 assert.equal(subOpenMode({ctrlKey:true,metaKey:false,shiftKey:false}),'tab');
 assert.equal(subOpenMode({ctrlKey:true,metaKey:false,shiftKey:true}),'normal-group');
 assert.equal(subOpenMode({ctrlKey:false,metaKey:true,shiftKey:true}),'normal-group');
});

test('legacy Sub restoration prefers last used, deduplicates and excludes Main',()=>{
 const a={groupId:'a',activeFile:'A.md'},b={groupId:'b',activeFile:'B.canvas'},main={groupId:'m',activeFile:'Main.md'};
 assert.deepEqual(subRestoreCandidates({main,sub:b,subs:[a,b,main]}),[b,a]);
 assert.deepEqual(subRestoreCandidates({main,subs:[main,a,b]}),[a,b]);
 assert.deepEqual(subRestoreCandidates({}),[]);
});
test('valid role metadata survives without inventing missing groups or changing input',()=>{
  const input={main:{groupId:'main-id',activeFile:'A.md'},emptySubId:'reserved-id',future:'leave alone'};
  const copy=structuredClone(input);
  assert.deepEqual(readSpaces(input),{main:{groupId:'main-id',activeFile:'A.md'}});
  assert.deepEqual(input,copy);
  assert.deepEqual(readSpaces({reference:{groupId:'ref-id',activeFile:null}}),{});
});
