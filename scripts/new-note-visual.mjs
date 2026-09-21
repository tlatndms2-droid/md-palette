import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {c,p,js,pause,click,key,type,textClick,wait} from './stage4-helpers.mjs';
const dir='.artifacts/new-note';
try {
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 const theme=await js(`app.vault.getConfig('theme')`);
 await js(`app.workspace.rightSplit.setSize(240);true`);await pause(250);
 const bounds=await js(`(()=>{const a=document.querySelector('.mdp-connection-actions');return {width:a.clientWidth,scroll:a.scrollWidth,buttons:[...a.children].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,scroll:e.scrollWidth,client:e.clientWidth}})}})()`);
 assert.ok(bounds.scroll<=bounds.width+1);assert.ok(bounds.buttons[1].y>bounds.buttons[0].y);for(const b of bounds.buttons)assert.ok(b.scroll<=b.client+1);
 await click('.mdp-add-connection');await wait(`document.querySelector('.prompt-input')`);assert.ok((await js(`document.querySelector('.prompt-input').placeholder`)).includes('기존'));await key('Escape','Escape',27);
 await click('.mdp-new-linked-note');await type('좁은 화면 취소');await c.screenshot(dir+'/narrow-dialog.png');await textClick('.modal button','취소');
 await js(`app.vault.setConfig('theme','moonstone');app.updateTheme();app.workspace.rightSplit.setSize(440);true`);await pause(400);await click('.mdp-new-linked-note');await type('밝은 테마 취소');await c.screenshot(dir+'/light-dialog.png');await textClick('.modal button','취소');
 await js(`app.vault.setConfig('theme',${JSON.stringify(theme)});app.updateTheme();true`);await pause(350);
 await click('.mdp-card[data-path="새 링크 루트.md"] .mdp-card-name','left',2);await pause(400);
 assert.equal(await js(`${p}.subGroup.children[${p}.subGroup.currentTab].view.file.path`),'새 링크 루트.md');assert.equal(await js(`${p}.mainFile.path`),'NewNote-Review/Main.md');
 await c.screenshot(dir+'/ready.png');assert.equal(c.errors.length,0);
 await writeFile(dir+'/visual-result.json',JSON.stringify({passed:true,narrowWidth:240,buttonsWrap:true,existingPickerPreserved:true,lightAndDark:true,newFileOpensInSub:true},null,2));
 console.log('240px buttons wrap; old picker works; light/dark dialogs; new note opens in Sub');
} finally {c.close()}
