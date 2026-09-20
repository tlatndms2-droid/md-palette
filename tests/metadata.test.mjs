import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code}=await transform(await readFile('src/metadata-model.ts','utf8'),{loader:'ts',format:'esm'});
const {parseMetadata,footnoteReplacement}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('Main metadata excludes properties, code and comments, links include properties',()=>{
 const text='---\nlabel: ==not a highlight==\nlink note: "[[Property]]"\nsite: https://example.com\n---\n==실제\n강조==\n`==code==`\n```md\n- [ ] code\n[[Hidden]]\n```\n%%==comment==%%\n- [ ] 해야 할 일\n- [x] 완료\n문단 내용 ^same\n\n두 번째 ^same\n';
 const r=parseMetadata(text);assert.deepEqual(r.highlights.map(i=>i.text),['실제\n강조']);assert.deepEqual(r.tasks.map(i=>i.checked),[false,true]);assert.equal(r.blocks.length,2);assert.ok(r.blocks.every(i=>i.duplicate));assert.deepEqual(r.links.map(i=>i.target),['Property','https://example.com']);
 for(const i of r.tasks)assert.match(text.slice(i.from,i.to),/^[ x]$/);
});
test('footnotes preserve context and exact multiline replacement ranges with CRLF',()=>{
 const text='문맥[^a] 뒤\r\n\r\n[^a]: 첫 줄\r\n    둘째 줄\r\n\r\n다른 내용';
 const [i]=parseMetadata(text).footnotes;assert.equal(i.context,'문맥 뒤\r');assert.equal(i.text,'첫 줄\n둘째 줄');
 const next=text.slice(0,i.from)+footnoteReplacement(i,'수정\n다음',text)+text.slice(i.to);
 assert.equal(next,'문맥[^a] 뒤\r\n\r\n[^a]: 수정\r\n    다음\r\n\r\n다른 내용');
});
test('Markdown, wiki, embeds, references, URL parentheses and aliases keep targets',()=>{
 const text='[[자료#위치|별칭]] ![[image.png]] [웹](https://example.com/a_(b))\n[명칭][ref]\n[ref]: https://example.org\nhttps://example.net\n';
 assert.deepEqual(parseMetadata(text).links.map(i=>i.target),['자료#위치','image.png','https://example.com/a_(b)','https://example.org','https://example.net']);
});
test('escaped, incomplete and fenced syntax does not become editable metadata',()=>{
 const r=parseMetadata('\\==no==\n\\[[no]]\n==unfinished\n```\n==no==\n- [x] no\n');assert.equal(r.highlights.length,0);assert.equal(r.tasks.length,0);assert.equal(r.links.length,0);
});
test('duplicate footnote definitions do not silently allow ambiguous editing',()=>{
 const r=parseMetadata('문맥[^a]\n\n[^a]: one\n\n[^a]: two');assert.equal(r.footnotes.length,1);assert.equal(r.footnotes[0].duplicate,true);
});
test('inline code at the start of a footnote remains inside its editable range',()=>{
 const text='본문[^code]\n\n[^code]: `code` 설명';const [item]=parseMetadata(text).footnotes;
 assert.equal(item.text,'`code` 설명');assert.equal(text.slice(item.from,item.to),item.text);
});
