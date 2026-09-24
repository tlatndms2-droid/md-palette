import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code}=await transform(await readFile('src/link-explorer-model.ts','utf8'),{loader:'ts',format:'esm'});
const {LinkIndex,readExplorer}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('only outgoing children retain provenance and ancestry stops cycles',()=>{
 const i=new LinkIndex({main:{a:1,d:1},a:{b:1},b:{a:1,main:1},c:{a:1},d:{c:1},self:{self:1}});
 assert.deepEqual(i.children('a',['main','a']),[{path:'b',outgoing:true,incoming:true}]);
 assert.equal(i.children('d',['main','d']).some(e=>e.path==='c'),true);
 assert.deepEqual(i.children('b',['main','a','b']),[]);
 assert.deepEqual(i.children('self',['self']),[]);
});
test('depth traversal is shortest-path bounded and safe in cycles',()=>{
 const i=new LinkIndex({main:{a:1},a:{b:1},c:{b:1},d:{c:1}});
 assert.deepEqual([...i.reachable('main',1)],['main','a']);
 assert.deepEqual([...i.reachable('main',2)],['main','a','b']);
 assert.equal(i.reachable('main',3).has('c'),false);
 assert.equal(i.reachable('main',3).has('d'),false);
});
test('old and malformed settings preserve safe defaults',()=>{
 assert.deepEqual(readExplorer(null),{depth:2,expanded:[],sources:{}});
 assert.equal(readExplorer({depth:900}).depth,5);
 assert.equal(readExplorer({depth:NaN}).depth,2);
 assert.deepEqual(readExplorer({sources:{a:'b',b:32},expanded:[null,'x']}),{depth:2,sources:{a:'b'},expanded:['x']});
});
test('large fanout remains linear rather than enumerating every possible path',()=>{
 const links={main:{}};for(let n=0;n<5000;n++){links.main['n'+n]=1;links['n'+n]={shared:1};}
 const i=new LinkIndex(links);assert.equal(i.reachable('main',5).size,5002);assert.equal(i.children('shared',['main','n0','shared']).length,0);
});

test('direct Main backlinks remain reachable but their incoming-only children do not',()=>{const i=new LinkIndex({back:{main:1,child:1},incoming:{back:1}});assert.deepEqual([...i.reachable('main',2)],['main','back','child']);});
