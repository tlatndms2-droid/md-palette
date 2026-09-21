import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {c,p,js,pause,wait,point,click,key,textClick,markdownPoint,drag} from './stage6-helpers.mjs';
const dir='.artifacts/revision4',checks=[];
const value=()=>js('r4Sub.view.editor.getValue()');
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await js(`${p}.selectView('metadata');true`);await pause(200);
 let before=await value();await drag('.mdp-meta-footnotes',await markdownPoint('r4Sub'));
 await js(`window.r4Save=r4Sub.view.save;r4Sub.view.save=async()=>{throw Error('revision4 injected save failure')};true`);
 try{await textClick('실제 각주로 추가');await wait(`!${p}.reuseDrag.pending`);assert.equal(await value(),before);assert.equal(await js('app.vault.read(r4Sub.view.file)'),before)}finally{await js('r4Sub.view.save=r4Save;delete window.r4Save;true')}
 checks.push('footnote save failure rolls back reference and definition, editor and disk');
 await drag('.mdp-meta-links',await markdownPoint('r4Sub'));await js(`r4Sub.view.editor.replaceRange(${JSON.stringify('새 편집\n')},{line:0,ch:0});true`);await textClick('주소 그대로 삽입');await wait(`!${p}.reuseDrag.pending`);assert.equal(await value(),'새 편집\n'+before);checks.push('URL target conflict preserves intervening edit');
 await js('r4Sub.view.save().then(()=>true)');
 await click('.mdp-footnote-edit');assert.ok(await js(`!!document.querySelector('.mdp-footnote-input')`));
 await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;let pt=await point('.mdp-meta-footnotes');await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...pt});for(let i=1;i<9;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:pt.x+i*4,y:pt.y+i*3});await pause(200);assert.equal(c.dragEvents.length,0);await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...pt});await c.send('Input.setInterceptDrags',{enabled:false});await js(`document.querySelector('.mdp-footnote-actions button:last-child').click();true`);checks.push('footnote draft prevents drag');
 const canvasBefore=await js('JSON.stringify(r4Canvas.view.canvas.getData())');await js(`${p}.selectView('link','card');true`);await pause(250);pt=await js(`(()=>{const r=r4Canvas.view.canvas.wrapperEl.getBoundingClientRect();return{x:r.x+r.width*.3,y:r.y+r.height*.6}})()`);await drag('.mdp-card[data-path="Revision4-Review/D.md"] .mdp-card-name',pt);assert.equal(await js('!!document.querySelector(".menu")'),false);assert.equal(await js('JSON.stringify(r4Canvas.view.canvas.getData())'),canvasBefore);checks.push('file card still rejected in Sub Canvas');
 const mainId=await js(`${p}.mainLeaf.id`),groups=await js(`${p}.subGroups.map(g=>g.id)`);
 for(let i=0;i<groups.length;i++){await js(`${p}.setMain(${p}.subGroups[${i}].children[0]).then(()=>true)`);assert.equal(await js(`${p}.mainLeaf.id`),mainId)}checks.push('all Sub groups reject Main assignment');
 const leaves=await js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{a.push(l.id)});return a.sort()})()`);
 await js(`window.r4Main=${p}.mainLeaf;${p}.unsetMain().then(()=>true)`);assert.equal(await js(`document.querySelectorAll('.mdp-space-icon').length`),0);assert.deepEqual(await js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{a.push(l.id)});return a.sort()})()`),leaves);checks.push('Main unset clears all roles/icons without closing any tab');
 await js(`(async()=>{const p=${p};await p.setMain(r4Main);const leaves=[];app.workspace.iterateAllLeaves(l=>{leaves.push(l)});p.subGroups=${JSON.stringify(groups)}.map(id=>leaves.find(l=>l.parent.id===id).parent);p.subGroup=p.subGroups[1];p.sync(false);app.workspace.setActiveLeaf(p.subGroups[1].children[0],{focus:true});p.selectView('metadata');p.flushState();await p.saveChain;app.workspace.requestSaveLayout();return true})()`);await pause(1500);
 const expected=await js(`(()=>{const p=${p};return{spaces:p.data.spaces,icons:document.querySelectorAll('.mdp-space-icon[aria-label="Sub Space"]').length,groups:p.subGroups.map(g=>({id:g.id,files:g.children.map(l=>l.view.file?.path)}))}})()`);
 expected.files={};for(const name of ['Main.md','A.md','B.md','Board.canvas'])expected.files[name]=await js(`app.vault.read(app.vault.getAbstractFileByPath('Revision4-Review/${name}'))`);
 await writeFile(dir+'/restart-expected.json',JSON.stringify(expected,null,2));
 assert.equal(c.errors.length,0);await writeFile(dir+'/guards-result.json',JSON.stringify({passed:true,checks},null,2));console.log(checks);
}finally{c.close()}
