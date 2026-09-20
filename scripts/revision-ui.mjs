import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,textClick,key,type,create,drag} from './stage4-helpers.mjs';
const dir='.artifacts/revision', base='Revision-Review/';
const card=name=>`.mdp-card-grid [data-path="${base+name}"]`;
const file=name=>`[data-surface="folder"][data-key="f:${base+name}"]`;
const folder=id=>`[data-surface="tree"][data-key="d:${id}"]`;
async function mainTab(name){
 await js(`(async()=>{const file=app.vault.getAbstractFileByPath(${JSON.stringify(base+name)});let leaf=app.workspace.getLeavesOfType('markdown').find(l=>l.view.file===file);if(!leaf){leaf=app.workspace.getLeaf('tab');await leaf.openFile(file)}await app.workspace.revealLeaf(leaf);leaf.tabHeaderEl.dataset.revisionTab=${JSON.stringify(name)};return true})()`);
 await click(`[data-revision-tab="${name}"]`,'right');
 await textClick('.menu-item-title','메인 스페이스로 지정');await wait(`${p}.mainFile?.path===${JSON.stringify(base+name)}&&!${p}.busy`);
}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:2600,height:1100,deviceScaleFactor:1,mobile:false});
 const fixtures={
  'Main-A.md':'# 공부\n\n[[Revision-Review/자료.md]]\n[[Revision-Review/사진.png]]\n[[Revision-Review/정리.canvas]]\n[[Revision-Review/문서.pdf]]\n',
  'Main-B.md':'# 여행\n\n[[Revision-Review/자료.md]]\n',
  '자료.md':'# 미리보기 제목\n\n**굵은 강조**와 *기울임*\n\n- 첫 번째 항목\n- 두 번째 항목\n\n[영상 설명](https://example.com/video)\n\n[[Revision-Review/Main-A|공부 문서]]\n',
  '정리.canvas':JSON.stringify({nodes:[{id:'a',type:'text',text:'정리 카드',x:0,y:0,width:250,height:150}],edges:[]})
 };
 await js(`(async()=>{if(!app.vault.getAbstractFileByPath('${base.slice(0,-1)}'))await app.vault.createFolder('${base.slice(0,-1)}');for(const [name,body]of Object.entries(${JSON.stringify(fixtures)})){const path='${base}'+name;if(!app.vault.getAbstractFileByPath(path))await app.vault.create(path,body)}return true})()`);
 // Small valid image and PDF fixtures, with no remote assets.
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
 let pdf='%PDF-1.4\n',offsets=[0];const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>','<< /Length 0 >>\nstream\n\nendstream'];
 objects.forEach((s,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${s}\nendobj\n`});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 5\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 for(const [name,bytes]of [['사진.png',png],['문서.pdf',Buffer.from(pdf)]])await js(`(async()=>{if(!app.vault.getAbstractFileByPath('${base+name}'))await app.vault.createBinary('${base+name}',new Uint8Array(${JSON.stringify([...bytes])}).buffer);return true})()`);
 await wait(`Object.keys(app.metadataCache.resolvedLinks['${base}Main-A.md']??{}).length===4`);
 await js(`(async()=>{await ${p}.unsetMain();delete ${p}.foldersByMain['${base}Main-A.md'];delete ${p}.foldersByMain['${base}Main-B.md'];${p}.cards.fileType='all';${p}.cards.labelFilter=[];${p}.cards.display='medium';app.workspace.rightSplit.setSize(540);return true})()`);
 await mainTab('Main-A.md');await textClick('.mdp-link-tabs button','Card');await wait(`!!document.querySelector(${JSON.stringify(card('자료.md')+' .mdp-preview-markdown a')})`);
 const markup=await js(`(()=>{const e=document.querySelector(${JSON.stringify(card('자료.md'))}),t=e.querySelector('.mdp-file-title'),b=e.querySelector('.mdp-preview');return {titleBefore:t.getBoundingClientRect().bottom<=b.getBoundingClientRect().top,titleSize:parseFloat(getComputedStyle(t).fontSize),bodySize:parseFloat(getComputedStyle(b.querySelector('.mdp-preview-markdown')).fontSize),heading:!!b.querySelector('h1'),bold:!!b.querySelector('strong'),list:!!b.querySelector('li'),link:b.querySelector('a')?.textContent,raw:b.innerText}})()`);
 assert.ok(markup.titleBefore&&markup.titleSize>markup.bodySize&&markup.heading&&markup.bold&&markup.list);assert.equal(markup.link,'영상 설명');assert.ok(!markup.raw.includes('https://example.com/video'));
 await c.screenshot(dir+'/card.png');
 // Every new file is a new Sub tab; each repeated file reveals its existing tab.
 for(const name of ['자료.md','사진.png','정리.canvas','문서.pdf']){
  await click(card(name),'left',2);await wait(`${p}.subGroup?.children.some(l=>l.view.file?.path===${JSON.stringify(base+name)})&&!${p}.busy`);
 }
 const subIds=await js(`${p}.subGroup.children.map(l=>l.id)`);assert.equal(subIds.length,4);
 await click(card('사진.png'),'left',2);await wait(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file?.path==='${base}사진.png'`);assert.deepEqual(await js(`${p}.subGroup.children.map(l=>l.id)`),subIds);
 await click(card('정리.canvas'),'right');const menu=await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`);assert.ok(menu.includes('Sub Space에서 열기'));assert.ok(!menu.some(t=>t.includes('Reference')));await key('Escape','Escape',27);
 // New Main through its actual tab menu keeps all old tabs and drops Sub roles.
 await js(`window.revisionOldSub=${p}.subGroup;window.revisionLeaves=[];app.workspace.iterateAllLeaves(l=>window.revisionLeaves.push(l.id));true`);
 await js(`(async()=>{let leaf=app.workspace.getLeavesOfType('markdown').find(l=>l.view.file?.path==='${base}Main-B.md');if(!leaf)leaf=app.workspace.createLeafBySplit(${p}.mainGroup.children[${p}.mainGroup.currentTab],'horizontal');await leaf.openFile(app.vault.getAbstractFileByPath('${base}Main-B.md'));return true})()`);
 await mainTab('Main-B.md');assert.equal(await js(`!!${p}.subGroup`),false);assert.equal(await js(`window.revisionOldSub.containerEl.querySelectorAll('.mdp-space-icon').length`),0);
 assert.ok(await js(`(()=>{const ids=[];app.workspace.iterateAllLeaves(l=>ids.push(l.id));return window.revisionLeaves.every(id=>ids.includes(id))})()`));
 await textClick('.mdp-link-tabs button','Folder');assert.equal(await js(`${p}.folders.folders.length`),0);
 const b=await create('여행 준비');await drag(file('자료.md'),folder(b));assert.equal(await js(`${p}.folders.positions['${base}자료.md']`),b);
 // Returning to A starts empty and never imports B's folders or placement.
 await mainTab('Main-A.md');await textClick('.mdp-link-tabs button','Folder');assert.equal(await js(`${p}.folders.folders.length`),0);assert.equal(await js(`${p}.folders.positions['${base}자료.md']??null`),null);
 const a=await create('플러그인 정리');await drag(file('자료.md'),folder(a));await click(folder(a),'left',2);await wait(`${p}.folders.current==='${a}'`);
 await wait(`!!document.querySelector(${JSON.stringify(file('자료.md')+' .mdp-preview-markdown')})`);
 assert.ok(await js(`(()=>{const e=document.querySelector(${JSON.stringify(file('자료.md'))});return e.querySelector('.mdp-file-title').getBoundingClientRect().bottom<=e.querySelector('.mdp-preview').getBoundingClientRect().top})()`));
 await c.screenshot(dir+'/folder.png');
 await mainTab('Main-B.md');assert.equal(await js(`${p}.folders.positions['${base}자료.md']`),b);assert.deepEqual(await js(`${p}.folders.folders.map(f=>f.name)`),['여행 준비']);assert.equal(await js(`document.querySelector('[aria-label="뒤로"]').disabled`),true);
 await mainTab('Main-A.md');assert.equal(await js(`${p}.folders.positions['${base}자료.md']`),a);assert.equal(await js(`${p}.folders.current`),a);
 await click(file('자료.md'),'left',2);await wait(`!!${p}.subGroup&&!${p}.busy`);
 await js(`window.revisionLeaves=[];app.workspace.iterateAllLeaves(l=>window.revisionLeaves.push(l.id));${p}.mainGroup.children[${p}.mainGroup.currentTab].tabHeaderEl.dataset.unsetTarget='true';true`);
 await click('[data-unset-target="true"]','right');await textClick('.menu-item-title','메인 스페이스 지정 해제');await wait(`!${p}.mainGroup&&!${p}.busy`);
 assert.equal(await js(`document.querySelectorAll('.mdp-space-icon').length`),0);assert.equal(await js(`document.querySelector('.mdp-main-context').textContent`),'Main 없음');assert.ok(await js(`(()=>{const ids=[];app.workspace.iterateAllLeaves(l=>ids.push(l.id));return window.revisionLeaves.every(id=>ids.includes(id))})()`));await c.screenshot(dir+'/unset.png');
 assert.deepEqual(await js(`Object.keys(app.commands.commands).filter(k=>k.startsWith('md-palette:')).sort()`),['md-palette:open-sidebar','md-palette:open-sub','md-palette:set-main','md-palette:unset-main'].sort());
 await mainTab('Main-A.md');await textClick('.mdp-link-tabs button','Card');await click(card('정리.canvas'),'left',2);await wait(`${p}.subGroup?.children[0]?.view.file?.extension==='canvas'&&!${p}.busy`);
 assert.deepEqual(c.errors,[]);await writeFile(dir+'/ui-result.json',JSON.stringify({passed:true,markdown:markup,allFileTypesInSub:true,deduplication:true,tabsPreserved:true,unset:true,perDocumentFolders:true,ids:{a,b},errors:c.errors},null,2));
 console.log('PASS real UI: Markdown/title, Sub file tabs and dedup, Main change/unset, per-document folders and native drag');
}finally{c.close()}
