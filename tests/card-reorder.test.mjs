import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code}=await transform(await readFile('src/card-reorder.ts','utf8'),{loader:'ts',format:'esm'});
const {findCardDrop}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const bounds={path:'',left:0,right:400,top:0,bottom:500};
const cards=[{path:'A',left:10,right:190,top:10,bottom:190},{path:'B',left:200,right:380,top:10,bottom:190},{path:'C',left:10,right:190,top:200,bottom:380}];
test('grid insertion follows left/right halves and gaps without shifting target geometry',()=>{
  const before=structuredClone(cards);
  assert.deepEqual(findCardDrop(cards,{x:205,y:80},bounds,true),{card:cards[1],after:false});
  assert.deepEqual(findCardDrop(cards,{x:360,y:80},bounds,true),{card:cards[1],after:true});
  assert.equal(findCardDrop(cards,{x:195,y:80},bounds,true).card.path,'A');
  assert.deepEqual(cards,before);
});
test('list insertion follows top/bottom and ignores offscreen cards',()=>{
  assert.equal(findCardDrop(cards.slice(0,1),{x:30,y:30},bounds,false).after,false);
  assert.equal(findCardDrop(cards.slice(0,1),{x:30,y:180},bounds,false).after,true);
  assert.equal(findCardDrop([{path:'off',left:0,right:400,top:-90,bottom:-10}],{x:50,y:1},bounds,false),null);
});
test('outside/empty candidate sets never yield a drop target',()=>{
  assert.equal(findCardDrop(cards,{x:401,y:100},bounds,true),null);
  assert.equal(findCardDrop(cards,{x:50,y:501},bounds,true),null);
  assert.equal(findCardDrop([],{x:100,y:100},bounds,true),null);
});
