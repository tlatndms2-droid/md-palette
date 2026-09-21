import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,point,tap,click} from './stage4-helpers.mjs';
const dir='.artifacts/revision4',base='Revision4-Review/';
const card=n=>`.mdp-card[data-path="${base+n}"] .mdp-card-name`;
async function dbl(s,m=0){const pt=await point(s);await tap(pt,'left',1,m);await tap(pt,'left',2,m);await pause(450)}
const state=()=>js(`(()=>{const p=${p};return {main:p.mainFile?.path,last:p.subGroup?.id,groups:p.subGroups.map(g=>({id:g.id,active:g.children[g.currentTab]?.view.file?.path,leaves:g.children.map(l=>({id:l.id,file:l.view.file?.path}))})),icons:document.querySelectorAll('.mdp-space-icon[aria-label="Sub Space"]').length}})()`);
const report={version:'0.0.13',checks:[]};
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 const legacy=JSON.parse(await readFile(dir+'/legacy-spaces.json','utf8'));
 assert.equal(await js(`${p}.manifest.version`),report.version);
 const prior=await state();if(prior.main===legacy.main.activeFile){assert.ok(prior.groups.some(g=>g.id===legacy.sub.groupId));await writeFile(dir+'/upgrade-result.json',JSON.stringify(prior));}report.checks.push('legacy single Sub restoration checked before fixture setup');
 await js(`(async()=>{const w=require('@electron/remote').getCurrentWindow();w.restore();w.setBounds({x:0,y:0,width:2200,height:1100});w.showInactive();const p=${p},g=p.mainGroup;await p.unsetMain();const leaves=[];app.workspace.iterateAllLeaves(l=>{if(l.getRoot()===app.workspace.rootSplit&&l.parent!==g)leaves.push(l)});for(const l of leaves){l.parent.removeChild(l);g.insertChild(g.children.length,l)}const l=app.workspace.createLeafInParent(g,g.children.length);await l.openFile(app.vault.getAbstractFileByPath('${base}Main.md'));await p.setMain(l);p.cards.display='list';p.selectView('link','card');return true})()`);
 await wait(`document.querySelector(${JSON.stringify(card('A.md'))})`);
 await click(card('A.md'));assert.equal((await state()).groups.length,0);
 await click(card('B.md'),'left',1,2);assert.equal((await state()).groups.length,0);assert.equal(await js(`document.querySelectorAll('.mdp-card.is-selected').length`),2);report.checks.push('single click selects; Ctrl click selects multiple without opening');
 await dbl(card('A.md'));let s=await state();assert.equal(s.groups.length,1);const first=s.groups[0].id,leaf=s.groups[0].leaves[0].id;
 await dbl(card('B.md'));s=await state();assert.equal(s.groups[0].active,base+'B.md');assert.equal(s.groups[0].leaves.length,1);assert.equal(s.groups[0].leaves[0].id,leaf);report.checks.push('double click replaces same existing Sub leaf');
 await dbl(card('C.md'),2);s=await state();assert.equal(s.groups.length,1);assert.equal(s.groups[0].leaves.length,2);assert.equal(s.groups[0].active,base+'C.md');report.checks.push('Ctrl double click adds adjacent tab and keeps previous tab');
 await dbl(card('A.md'),10);await dbl(card('D.md'),10);s=await state();assert.equal(s.groups.length,3);assert.equal(s.icons,3);assert.equal(s.main,base+'Main.md');report.checks.push('repeated Ctrl Shift double click creates multiple Sub groups with icons');
 await js(`(()=>{document.querySelectorAll('[data-revision4-tab]').forEach(e=>e.removeAttribute('data-revision4-tab'));const g=${p}.subGroups[0];g.children[g.currentTab].tabHeaderEl.setAttribute('data-revision4-tab','first')})()`);await tap(await js(`(()=>{const r=document.querySelector('[data-revision4-tab="first"]').getBoundingClientRect();return {x:r.x+8,y:r.y+r.height/2}})()`));await dbl(card('그림.svg'));s=await state();assert.equal(s.last,first);assert.equal(s.groups[0].active,base+'그림.svg');assert.equal(s.groups[0].leaves.length,2);report.checks.push('last-used Sub receives replacement including image');
 await dbl(card('B.md'),2);s=await state();assert.equal(s.groups[0].leaves.length,2);assert.equal(s.groups[0].active,base+'B.md');report.checks.push('same file reuses existing tab in target group');
 await js(`${p}.selectView('link','folder');true`);await wait(`document.querySelector('[data-surface="folder"][data-key="f:${base}C.md"]')`);
 await dbl(`[data-surface="folder"][data-key="f:${base}C.md"]`);assert.equal((await state()).groups[0].active,base+'C.md');report.checks.push('Folder double click replaces last-used Sub');
 await js(`${p}.selectView('link','connections');true`);await pause(350);
 await dbl(`.mdp-connection-row[data-path="${base}D.md"]`);assert.equal((await state()).groups[0].active,base+'D.md');report.checks.push('Connections double click replaces last-used Sub');
 await js(`${p}.selectView('link','card');true`);
 await c.screenshot(dir+'/sub-groups.png');
 report.state=await state();report.passed=true;assert.equal(c.errors.length,0);await writeFile(dir+'/opening-result.json',JSON.stringify(report,null,2));console.log(report);
}finally{c.close()}

