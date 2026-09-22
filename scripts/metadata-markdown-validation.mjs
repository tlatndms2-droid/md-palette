import assert from 'node:assert/strict';
import {mkdir, cp, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect} from './cdp.mjs';

const dir='.artifacts/metadata-markdown', mode=process.argv[2]??'ui';
const c=await connect(), p="app.plugins.plugins['md-palette']", js=s=>c.evaluate(s);
const hash=b=>createHash('sha256').update(b).digest('hex');
const checks=[], check=s=>{checks.push(s);console.log('PASS',s)};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(s){for(let i=0;i<80;i++){if(await js(s))return;await pause(100)}throw Error('Timeout: '+s)}
async function point(s){return js(`(()=>{const e=document.querySelector(${JSON.stringify(s)});if(!e)throw Error('Missing element');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)}
async function tap(q){await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...q});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...q});await pause(150)}
async function click(s){await tap(await point(s))}
async function key(key,code,keyCode,modifiers=0){for(const type of ['keyDown','keyUp'])await c.send('Input.dispatchKeyEvent',{type,key,code,windowsVirtualKeyCode:keyCode,modifiers})}
async function type(s,value){await click(s);await key('a','KeyA',65,2);await c.send('Input.insertText',{text:value});await pause(250)}
async function menu(title){await tap(await js(`(()=>{const e=[...document.querySelectorAll('.menu-item-title')].find(e=>e.textContent===${JSON.stringify(title)});if(!e)throw Error('Missing menu');const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`))}
const fixture=[
 '# Markdown 표시 확인', '',
 '책을 읽는 것은 **깊이 이해하기**와 ==자신의 사고력을 확장하기==입니다. [[Related|연결 문서]]와 `코드`를 함께 봅니다.[^1]', '',
 '[^1]: **각주 굵게**와 *기울임*, ==중요 강조==, ~~취소선~~, `코드` 및 [[Related|연결 문서]]',
 '    다음 줄도 **서식 유지**',
 '    ',
 '    - 첫 번째 **항목**',
 '    - 두 번째 항목', '',
 '- [ ] **서식 있는 할 일**과 [[Related|연결 문서]]', '',
 '**블록 굵게**와 ==블록 강조==',
 '- 목록 **내용**',
 '- [ ] 미리보기 내부 체크',
 '^sample-block', '',
 '[**공식 안내**](https://example.com/metadata)', '',
 '## 아래쪽', '끝', ''
].join('\n');
const foot='.mdp-meta-footnotes .mdp-metadata-markdown:not(.mdp-footnote-context)';
async function assertRendering(){
 await wait(`document.querySelector('${foot} strong')?.textContent==='각주 굵게'`);
 const state=await js(`(()=>{const f=document.querySelector('${foot}'),ctx=document.querySelector('.mdp-footnote-context');return{bold:f.querySelector('strong')?.textContent,em:f.querySelector('em')?.textContent,mark:f.querySelector('mark')?.textContent,code:f.querySelector('code')?.textContent,link:f.querySelector('a.internal-link')?.textContent,list:f.querySelectorAll('li').length,ctxBold:ctx.querySelector('strong')?.textContent,ctxMark:ctx.querySelector('mark')?.textContent,task:!!document.querySelector('.mdp-meta-tasks strong'),block:!!document.querySelector('.mdp-meta-blocks strong'),highlight:!!document.querySelector('.mdp-meta-highlights .mdp-metadata-markdown p'),url:!!document.querySelector('.mdp-meta-links strong'),text:f.textContent}})()`);
 assert.equal(state.bold,'각주 굵게');assert.equal(state.em,'기울임');assert.equal(state.mark,'중요 강조');assert.equal(state.code,'코드');assert.equal(state.link,'연결 문서');assert.equal(state.list,2);assert.equal(state.ctxBold,'깊이 이해하기');assert.equal(state.ctxMark,'자신의 사고력을 확장하기');
 for(const k of ['task','block','highlight','url'])assert.equal(state[k],true,k);
 assert.ok(!state.text.includes('**'));assert.ok(!state.text.includes('[['));check('footnote, context and all metadata sections render Markdown');
}
async function install(vault,source='.'){
 await js(`app.plugins.unloadPlugin('md-palette').then(()=>true)`);
 await mkdir(vault+'/.obsidian/plugins/md-palette',{recursive:true});
 for(const n of ['main.js','manifest.json','styles.css']){await cp(source+'/'+n,vault+'/.obsidian/plugins/md-palette/'+n);assert.equal(hash(await readFile(source+'/'+n)),hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+n)))}
 await js(`(async()=>{await app.plugins.loadManifests();await app.plugins.setEnable(true);await app.plugins.enablePluginAndSave('md-palette');if(!${p})await app.plugins.loadPlugin('md-palette');return !!${p}})()`);
}
try {
 await mkdir(dir,{recursive:true});
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Metadata-Sandbox-20260922'));
 if(mode==='reset') await js(`app.vault.modify(app.vault.getAbstractFileByPath('Metadata Review.md'),${JSON.stringify(fixture)}).then(()=>true)`);
 if(mode==='install') await install(vault);
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1100,deviceScaleFactor:1,mobile:false});
 if(mode==='setup'){
  await cp(vault+'/.obsidian',dir+'/backup-obsidian',{recursive:true,force:false});
  await install(vault,'.github/release-assets/0.1.2');
  await js(`(async()=>{if(!app.vault.getAbstractFileByPath('Related.md'))await app.vault.create('Related.md','# 연결 문서');if(!app.vault.getAbstractFileByPath('Metadata Review.md'))await app.vault.create('Metadata Review.md',${JSON.stringify(fixture)});const f=app.vault.getAbstractFileByPath('Metadata Review.md');const l=app.workspace.getLeaf(false);await l.openFile(f);await ${p}.setMain(l);${p}.selectView('metadata');${p}.metadataCollapsed=[];app.workspace.leftSplit.collapse();app.workspace.rightSplit.setSize(490);app.vault.setConfig('theme','obsidian');app.updateTheme();return true})()`);
  await wait(`!!document.querySelector('${foot.replace(' .mdp-metadata-markdown:not(.mdp-footnote-context)',' .mdp-metadata-text')}')`);
  await c.screenshot(dir+'/before.png');
  assert.equal(await js(`!!document.querySelector('.mdp-meta-footnotes strong')`),false);
  await js(`${p}.flushState();${p}.saveChain.then(()=>true)`);
  await cp(vault+'/.obsidian',dir+'/backup-012',{recursive:true});
  await writeFile(dir+'/fixture.json',JSON.stringify({file:'Metadata Review.md',sha256:hash(Buffer.from(fixture))}));
  await install(vault);check('0.1.2 baseline reproduced; update assets match');
 }
 await wait(`${p}?.mainFile?.path==='Metadata Review.md'`);assert.equal(await js(`${p}.manifest.version`),'0.1.3');
 await assertRendering();assert.equal(await js(`app.vault.read(${p}.mainFile)`),fixture);
 if(mode!=='restart'){
  await click('.mdp-footnote-edit');assert.equal(await js(`document.querySelector('.mdp-footnote-input').value`),fixture.split('[^1]: ')[1].split('\n\n- [ ]')[0].replace(/\n    /g,'\n'));
  await type('.mdp-footnote-input','**저장된 각주**와 ==새 강조==');
  await click('.mdp-footnote-actions button:not(.mod-cta)');await assertRendering();assert.equal(await js(`app.vault.read(${p}.mainFile)`),fixture);check('edit shows raw Markdown; cancel preserves exact source');
  await click('.mdp-footnote-edit');await type('.mdp-footnote-input','**저장된 각주**와 ==새 강조==');await click('.mdp-footnote-actions .mod-cta');
  await wait(`document.querySelector('${foot} strong')?.textContent==='저장된 각주'`);
  const saved=await js(`app.vault.read(${p}.mainFile)`);assert.equal(saved,fixture.slice(0,fixture.indexOf('[^1]: ')+6)+'**저장된 각주**와 ==새 강조=='+fixture.slice(fixture.indexOf('\n\n- [ ]')));check('save changes only footnote definition and renders formatting');
  await js(`app.vault.modify(${p}.mainFile,${JSON.stringify(fixture)}).then(()=>true)`);await assertRendering();
  await click('.mdp-meta-tasks > input');await wait(`document.querySelector('.mdp-meta-tasks')?.classList.contains('is-complete')`);
  assert.equal(await js(`app.vault.read(${p}.mainFile)`),fixture.replace('- [ ] **서식 있는 할 일**','- [x] **서식 있는 할 일**'));
  await click('.mdp-meta-tasks > input');await wait(`!document.querySelector('.mdp-meta-tasks')?.classList.contains('is-complete')`);check('task checkbox preserves formatted task text');
  const leaves=await js('app.workspace.getLeavesOfType("markdown").length');
  await click(foot+' a.internal-link');await wait(`!${p}.busy`);assert.equal(await js('app.workspace.getLeavesOfType("markdown").length'),leaves);assert.equal(await js(`${p}.mainLeaf.view.editor.getCursor().line`),2);check('formatted links keep existing source-navigation behavior');
  await click('.mdp-meta-links .mdp-metadata-markdown');assert.equal(await js(`document.querySelectorAll('.menu-item').length>=2`),true);await key('Escape','Escape',27);check('URL label retains existing open menu');
  const children=await js(`${p}._children.length`);
  for(let i=0;i<4;i++){await type('.mdp-metadata-search input','각주');await type('.mdp-metadata-search input','');}
  await assertRendering();assert.equal(await js(`${p}._children.length`),children);check('search rerenders without accumulating Markdown components');
  await click('[data-kind="blocks"] .mdp-metadata-toggle');await click('[data-kind="blocks"] .mdp-metadata-toggle');
  await js(`${p}.selectView('link','card');true`);await pause(150);await js(`${p}.selectView('metadata');true`);await assertRendering();check('view switch disposes previews and restores rendering');
  // Native drag still uses the underlying Markdown, not rendered text.
  const from=await point('.mdp-meta-footnotes');await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...from});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...from});
  for(let i=1;i<=12;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:from.x-i*5,y:from.y+i*2});
  for(let i=0;i<30&&!c.dragEvents.length;i++)await pause(50);assert.ok(c.dragEvents.length);
  assert.equal(await js(`${p}.reuseDrag.source.item.text.startsWith('**각주 굵게**')`),true);
  await c.send('Input.dispatchDragEvent',{type:'dragCancel',x:from.x,y:from.y,data:c.dragEvents.at(-1).data});await key('Escape','Escape',27);await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...from});await c.send('Input.setInterceptDrags',{enabled:false});check('native footnote drag retains original Markdown');
 }
 await js(`app.workspace.rightSplit.setSize(280);true`);await pause(200);
 const narrow=await js(`(()=>{const e=document.querySelector('.mdp-metadata');return{width:e.clientWidth,scroll:e.scrollWidth}})()`);assert.ok(narrow.scroll<=narrow.width+1);check('narrow sidebar wraps without horizontal overflow');
 await js(`app.workspace.rightSplit.setSize(490);document.querySelector('.mdp-metadata').closest('.view-content').scrollTop=0;true`);await pause(200);
 await c.screenshot(dir+'/'+(mode==='restart'?'restart':'after')+'.png');
 if(mode!=='restart'){
  await js(`app.vault.setConfig('theme','moonstone');app.updateTheme();true`);await pause(150);await c.screenshot(dir+'/light.png');await js(`app.vault.setConfig('theme','obsidian');app.updateTheme();true`);
 }
 assert.equal(await js(`app.vault.read(${p}.mainFile)`),fixture);assert.equal(hash(await readFile(vault+'/Metadata Review.md')),hash(Buffer.from(fixture)));check('test edits restored; fixture byte hash matches');
 await js(`${p}.flushState();${p}.saveChain.then(()=>{app.workspace.requestSaveLayout();return true})`);
 assert.deepEqual(c.errors,[]);
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const sha256=hash(await readFile(name));assert.equal(hash(await readFile(vault+'/.obsidian/plugins/md-palette/'+name)),sha256);assets.push({name,sha256})}
 await writeFile(dir+'/'+(mode==='restart'?'restart':'ui')+'-result.json',JSON.stringify({passed:true,version:'0.1.3',checks,assets,errors:c.errors},null,2));
}catch(e){await c.screenshot(dir+'/failure.png');throw e}finally{c.close()}
