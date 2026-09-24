import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code}=await transform(await readFile('src/canvas-layout.ts','utf8'),{loader:'ts',format:'esm'});
const {folderLayout,fileLayout,translate,collides}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
let seq=0;const id=()=>String(++seq);
const state={folders:[{id:'a',name:'A',parent:''},{id:'b',name:'B',parent:'a'},{id:'c',name:'C',parent:''}],positions:{'1.md':'a','2.md':'b','3.md':'c'},order:['d:a','d:c','f:1.md','d:b','f:2.md','f:3.md']};
test('folder export includes exactly selected descendants and their own parent edges without modifying source',()=>{
 const snapshot=JSON.stringify(state),p=folderLayout(state,['1.md','2.md','3.md'],'a',id);
 assert.equal(p.nodes.length,4);assert.equal(p.edges.length,3);assert.deepEqual(p.nodes.flatMap(n=>n.file?[n.file]:[]).sort(),['1.md','2.md']);
 const b=p.nodes.find(n=>n.text==='B'),file=p.nodes.find(n=>n.file==='2.md');assert.ok(p.edges.some(e=>e.fromNode===b.id&&e.toNode===file.id));assert.ok(file.x>b.x);
 assert.equal(collides(p,{nodes:[],edges:[]}),false);assert.equal(JSON.stringify(state),snapshot);
 const all=folderLayout(state,['1.md','2.md','3.md'],'',id);assert.equal(all.nodes.length,7);assert.equal(all.edges.length,6);
});
test('file placement deduplicates, offsets without changing source, and rejects external or internal collisions',()=>{
 const p=fileLayout(['A.md','B.pdf','A.md','C.png','D.md'],id);assert.equal(p.nodes.length,4);assert.deepEqual(p.edges,[]);assert.equal(collides(p,{nodes:[],edges:[]}),false);
 const shifted=translate(p,{x:-1200,y:450});assert.equal(shifted.nodes[0].x,-1200);assert.equal(shifted.nodes[0].y,450);assert.equal(p.nodes[0].x,0);
 assert.equal(collides(shifted,{nodes:[{...shifted.nodes[0],id:'old'}],edges:[]}),true);
 assert.equal(collides({nodes:[p.nodes[0],{...p.nodes[0],id:'copy'}],edges:[]},{nodes:[],edges:[]}),true);
});
