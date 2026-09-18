import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code}=await transform(await readFile('src/connections-state.ts','utf8'),{loader:'ts',format:'esm'});
const {readConnections,relations}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('directional relations exclude self, unresolved and non-Markdown, and deduplicate repeated links',()=>{
 const links={'Main.md':{'Main.md':1,'Both.md':4,'Out.md':2,'Image.png':1,'Missing.md':1},'Both.md':{'Main.md':2},'Back.md':{'Main.md':1},'Board.canvas':{'Main.md':1}};
 assert.deepEqual(relations(links,'Main.md',new Set(['Main.md','Both.md','Out.md','Back.md'])),{backlinks:['Back.md','Both.md'],outgoing:['Both.md','Out.md']});
 assert.deepEqual(relations(links,'Other.md',new Set()),{backlinks:[],outgoing:[]});
});
test('Connections upgrades safely from absent or damaged layout and preserves valid per-section choices',()=>{
 assert.deepEqual(readConnections(null).heights,{backlinks:25,outgoing:25,graph:50});
 const raw={heights:{backlinks:NaN,outgoing:-10,graph:70},collapsed:{backlinks:true,outgoing:'false'}};
 assert.deepEqual(readConnections(raw),{heights:{backlinks:25,outgoing:25,graph:70},collapsed:{backlinks:true,outgoing:false,graph:false}});
 assert.equal(raw.heights.outgoing,-10);
});
