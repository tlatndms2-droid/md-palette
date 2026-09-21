import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code}=await transform(await readFile('src/reuse-model.ts','utf8'),{loader:'ts',format:'esm'});
const {canReuse,reuseOptions,reuseText,sameCanvasData,footnoteInsertion,webReuseText}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('approved target matrix allows file cards in Main/Sub and metadata in Markdown or Sub Canvas',()=>{
 const targets=['main-markdown','sub-markdown','sub-canvas','unsupported'];
 assert.deepEqual(targets.map(t=>canReuse('file',t)),[true,true,false,false]);
 for(const kind of ['highlight','block','footnote','url'])assert.deepEqual(targets.map(t=>canReuse(kind,t)),[true,true,true,false]);
});
test('footnotes insert one reference and multiline definition without reusing existing or dangling IDs',()=>{
 const original='앞 뒤\n\n[^mdp-1]: 기존\n\n없는 정의 [^mdp-2]';
 const r=footnoteInsertion(original,2,'첫 줄\r\n둘째 줄');
 assert.equal(r.value,'앞 [^mdp-3]뒤\n\n[^mdp-1]: 기존\n\n없는 정의 [^mdp-2]\n\n[^mdp-3]: 첫 줄\n    둘째 줄\n');
 let applied=original;for(const c of [...r.changes].reverse())applied=applied.slice(0,c.offset)+c.text+applied.slice(c.offset);assert.equal(applied,r.value);
 const end=footnoteInsertion('끝',1,'각주');assert.equal(end.changes.length,1);assert.equal(end.value,'끝[^mdp-1]\n\n[^mdp-1]: 각주\n');
 assert.throws(()=>footnoteInsertion('a',2,'b'));
});
test('URL reuse preserves HTTP(S) URLs and safely escapes link labels',()=>{
 assert.equal(webReuseText('https://example.com/a?q=1#s','참고',false),'https://example.com/a?q=1#s');
 assert.equal(webReuseText('https://example.com','A [B]',true),'[A \\[B\\]](<https://example.com/>)');
 assert.throws(()=>webReuseText('javascript:alert(1)','제목',true));
 assert.deepEqual(reuseOptions('footnote',true,false).map(x=>x.mode),['text','footnote']);
 assert.deepEqual(reuseOptions('url',true,true).map(x=>x.mode),['address','named-url']);
});
test('drop choices exclude file-body insertion for non-Markdown and block-content insertion into Markdown',()=>{
 assert.deepEqual(reuseOptions('file',true,false).map(x=>x.mode),['link','embed','body']);
 assert.deepEqual(reuseOptions('file',false,false).map(x=>x.mode),['link','embed']);
 assert.deepEqual(reuseOptions('block',true,false).map(x=>x.mode),['link','embed']);
 assert.deepEqual(reuseOptions('block',true,true).map(x=>x.mode),['text','link']);
 assert.deepEqual(reuseOptions('highlight',true,false).map(x=>x.mode),['text','source']);
});
test('reuse preserves multiline Markdown and uses the generated native link for wiki and Markdown formats',()=>{
 const content='첫 줄 **강조**\n두 번째 줄';
 for(const link of ['[[폴더/자료#^id]]','[자료](%ED%8F%B4%EB%8D%94/자료.md#^id)']) {
  assert.equal(reuseText('link',link,content),link);
  assert.equal(reuseText('embed',link,content),'!'+link);
  assert.equal(reuseText('text',link,content),content);
  assert.equal(reuseText('source',link,content),content+'\n\n출처: '+link);
 }
});
test('Canvas disk conflicts distinguish changed data from harmless JSON key ordering',()=>{
 assert.ok(sameCanvasData('{"nodes":[],"edges":[]}','{"edges":[],"nodes":[]}'));
 assert.ok(!sameCanvasData('{"nodes":[{"text":"new"}],"edges":[]}','{"nodes":[{"text":"old"}],"edges":[]}'));
 assert.ok(!sameCanvasData('broken','{}'));
 assert.ok(sameCanvasData('{"nodes":[{"id":"b"},{"id":"a"}]}','{"nodes":[{"id":"a"},{"id":"b"}]}'));
});
test('Windows body newlines use the same text representation as the editor rollback snapshot',()=>{
 assert.equal(reuseText('body','[[자료]]','# 제목\r\n\r\n본문\r\n'),'# 제목\n\n본문\n');
 assert.equal(reuseText('source','[[자료]]','첫 줄\r\n둘째 줄'),'첫 줄\n둘째 줄\n\n출처: [[자료]]');
});
