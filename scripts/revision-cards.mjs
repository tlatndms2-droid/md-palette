import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,click,textClick,drag} from './stage4-helpers.mjs';
const dir='.artifacts/revision',card=n=>`.mdp-card-grid [data-path="Revision-Review/${n}"]`;
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await textClick('.mdp-link-tabs button','Card');await wait(`!!document.querySelector(${JSON.stringify(card('자료.md')+' .mdp-preview-markdown')})`);
 await click(card('자료.md'));await click(card('사진.png'),'left',1,2);assert.equal(await js(`document.querySelectorAll('.mdp-card.is-selected').length`),2);
 await js(`window.cardIdentity=[...document.querySelectorAll('.mdp-card')];true`);await drag(card('사진.png'),card('정리.canvas'));
 assert.ok(await js(`window.cardIdentity.every(e=>e.isConnected)`));const order=await js(`${p}.cards.order`);assert.equal(order.indexOf('Revision-Review/자료.md'),order.indexOf('Revision-Review/정리.canvas')+1);
 const saved=await js(`JSON.stringify(${p}.cards.order)`);await drag(card('사진.png'),card('문서.pdf'),{cancel:true});assert.equal(await js(`JSON.stringify(${p}.cards.order)`),saved);
 // Card settings affect appearance without burying the title or changing structure.
 for(const mode of ['large','medium','small','list','details','tiles']){
  await js(`${p}.cards.display=${JSON.stringify(mode)};${p}.cardsChanged();true`);await pause(80);
  assert.ok(await js(`(()=>{const e=document.querySelector(${JSON.stringify(card('자료.md'))}),r=e.getBoundingClientRect(),t=e.querySelector('.mdp-file-title').getBoundingClientRect();return t.x>=r.x&&t.right<=r.right+1&&t.y>=r.y})()`));
 }
 await js(`${p}.cards.display='medium';${p}.cardsChanged();true`);
 // Linked-note edits refresh preview, while unrelated Main typing does not replace cards.
 const original=await js(`app.vault.read(app.vault.getAbstractFileByPath('Revision-Review/자료.md'))`);
 await js(`app.vault.modify(app.vault.getAbstractFileByPath('Revision-Review/자료.md'),${JSON.stringify('# 새 미리보기\n\n**갱신 확인**')}).then(()=>true)`);await wait(`document.querySelector(${JSON.stringify(card('자료.md')+' .mdp-preview-markdown')})?.textContent.includes('갱신 확인')`);
 await js(`app.vault.modify(app.vault.getAbstractFileByPath('Revision-Review/자료.md'),${JSON.stringify(original)}).then(()=>true)`);await wait(`document.querySelector(${JSON.stringify(card('자료.md')+' .mdp-preview-markdown')})?.textContent.includes('굵은 강조')`);
 await js(`window.stableCard=document.querySelector('.mdp-card');true`);const mainBody=await js(`app.vault.read(${p}.mainFile)`);await js(`app.vault.modify(${p}.mainFile,${JSON.stringify(mainBody+'\n일반 문장만 추가\n')}).then(()=>true)`);await pause(700);assert.ok(await js(`window.stableCard.isConnected`));await js(`app.vault.modify(${p}.mainFile,${JSON.stringify(mainBody)}).then(()=>true)`);
 await js(`app.workspace.rightSplit.setSize(240);true`);await pause(400);assert.ok(await js(`(()=>{const e=document.querySelector('.mdp-card-view');return e.scrollWidth<=e.clientWidth+2})()`));await c.screenshot(dir+'/narrow.png');
 await js(`app.workspace.rightSplit.setSize(540);true`);await pause(300);const rect=await js(`document.querySelector('.mdp-sidebar').getBoundingClientRect().toJSON()`);const shot=await c.send('Page.captureScreenshot',{format:'png',clip:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,scale:1}});await writeFile(dir+'/card-sidebar.png',Buffer.from(shot.data,'base64'));
 // Non-Markdown-only Sub is the restart case; close only its generated Markdown test tab.
 await js(`(()=>{for(const l of [...${p}.subGroup.children])if(l.view.file?.path==='Revision-Review/자료.md')l.detach();return true})()`);
 await click(card('정리.canvas'),'left',2);await wait(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file?.extension==='canvas'`);
 await textClick('.mdp-link-tabs button','Folder');
 assert.deepEqual(c.errors,[]);await writeFile(dir+'/cards-result.json',JSON.stringify({passed:true,selectionAndNativeReorder:true,escapePreserved:true,sixLayoutsFit:true,linkedPreviewRefresh:true,unchangedMainCardsReused:true,narrowFit:true,errors:c.errors},null,2));console.log('PASS final Card build: selection/reorder, layouts, preview refresh, Main typing and narrow sidebar');
}finally{c.close()}
