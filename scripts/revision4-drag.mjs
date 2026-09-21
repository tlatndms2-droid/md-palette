import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,point,tap,click,key,textClick,markdownPoint,drag} from './stage6-helpers.mjs';
const dir='.artifacts/revision4',base='Revision4-Review/',fixtures=JSON.parse(await readFile(dir+'/fixtures.json','utf8'));
const report={version:'0.0.13',checks:[]},url='https://example.com/reference?q=1#part',note='책 23쪽의 보충 설명\n두 번째 줄';
const card=n=>`.mdp-card[data-path="${base+n}"] .mdp-card-name`;
const value=l=>js(`${l}.view.editor.getValue()`);
async function reset(l,name){await key('Escape','Escape',27);await js(`(async()=>{const l=${l};await l.openFile(app.vault.getAbstractFileByPath('${base+name}'));await l.setViewState({...l.getViewState(),state:{...l.getViewState().state,mode:'source',source:true}});l.view.editor.setValue(${JSON.stringify(fixtures[name])});await l.view.save();app.workspace.setActiveLeaf(l,{focus:true});return true})()`);await pause(300)}
async function metadata(){await js(`${p}.metadataCollapsed=[];${p}.selectView('metadata');true`);await wait(`document.querySelector('.mdp-meta-footnotes')`);await pause(150)}
async function insert(selector,leaf,mode,expected){const before=await value(leaf),pt=await markdownPoint(leaf);await drag(selector,pt);await textClick(mode);await wait(`!${p}.reuseDrag.pending`);assert.equal(await value(leaf),typeof expected==='function'?expected(before,pt.offset):before.slice(0,pt.offset)+expected+before.slice(pt.offset));report.checks.push(mode+' '+leaf+' exact drop');}
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await js(`(()=>{const p=${p};window.r4Sub=p.subGroups[0].children[p.subGroups[0].currentTab];window.r4Other=p.subGroups[1].children[0];window.r4Canvas=p.subGroups[2].children[0];return true})()`);
 await reset(`${p}.mainLeaf`,'Main.md');await reset('r4Sub','A.md');
 for(const [mode,expected] of [['링크 삽입','[[D]]'],['임베드 삽입','![[D]]'],['본문 Markdown 삽입','# D 자료\n\n재사용 본문\n']]){
  await reset('r4Sub','A.md');await js(`${p}.selectView('link','card');true`);await pause(150);await insert(card('D.md'),'r4Sub',mode,expected);
 }
 await reset('r4Sub','A.md');await metadata();await insert('.mdp-meta-footnotes','r4Sub','텍스트로 삽입',note);
 await reset('r4Sub','A.md');await metadata();const before=await value('r4Sub');
 await insert('.mdp-meta-footnotes','r4Sub','실제 각주로 추가',(s,o)=>s.slice(0,o)+'[^mdp-2]'+s.slice(o)+'\n\n[^mdp-2]: 책 23쪽의 보충 설명\n    두 번째 줄\n');
 await c.screenshot(dir+'/footnote-result.png');
 await js('r4Sub.view.editor.focus();true');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'z',code:'KeyZ',windowsVirtualKeyCode:90,modifiers:2});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'z',code:'KeyZ',windowsVirtualKeyCode:90,modifiers:2});await pause(200);assert.equal(await value('r4Sub'),before);report.checks.push('one Undo removes reference and definition together');
 for(const leaf of ['r4Sub',`${p}.mainLeaf`]){
  for(const [mode,expected] of [['주소 그대로 삽입',url],['제목이 있는 링크 삽입',`[참고 사이트](<${url}>)`]]){
   await reset(leaf,leaf==='r4Sub'?'A.md':'Main.md');await metadata();await insert('.mdp-meta-links',leaf,mode,expected);
  }
 }
 await reset(`${p}.mainLeaf`,'Main.md');await metadata();await insert('.mdp-meta-footnotes',`${p}.mainLeaf`,'실제 각주로 추가',(s,o)=>s.slice(0,o)+'[^mdp-1]'+s.slice(o)+'\n\n[^mdp-1]: 책 23쪽의 보충 설명\n    두 번째 줄\n');
 await reset(`${p}.mainLeaf`,'Main.md');await reset('r4Other','B.md');await metadata();await js(`app.workspace.setActiveLeaf(r4Sub,{focus:true});true`);await insert('.mdp-meta-links','r4Other','주소 그대로 삽입',url);report.checks.push('drop into another managed Sub even when it is not last-used');
 await metadata();const cancelBefore=await value('r4Other');await drag('.mdp-meta-footnotes',await markdownPoint('r4Other'));await textClick('취소');assert.equal(await value('r4Other'),cancelBefore);report.checks.push('cancel leaves target unchanged');
 await js(`(async()=>{await r4Canvas.openFile(app.vault.getAbstractFileByPath('${base}Board.canvas'));app.workspace.setActiveLeaf(r4Canvas,{focus:true});return true})()`);await pause(350);await metadata();
 for(const [selector,mode,expected] of [['.mdp-meta-footnotes','텍스트 카드 만들기',note],['.mdp-meta-footnotes','각주 카드 만들기','[^mdp-1]\n\n[^mdp-1]: 책 23쪽의 보충 설명\n    두 번째 줄\n'],['.mdp-meta-links','주소 텍스트 카드 만들기',url],['.mdp-meta-links','제목 링크 카드 만들기',`[참고 사이트](<${url}>)`]]){
  const ids=await js('[...r4Canvas.view.canvas.nodes.keys()]'),pt=await js(`(()=>{const c=r4Canvas.view.canvas,r=c.wrapperEl.getBoundingClientRect();return{x:r.x+r.width*.3,y:r.y+r.height*.35}})()`);
  await drag(selector,pt);await textClick(mode);await wait(`!${p}.reuseDrag.pending`);const node=await js(`r4Canvas.view.canvas.getData().nodes.find(n=>!${JSON.stringify(ids)}.includes(n.id))`);assert.ok(node);assert.equal(node.text,expected);report.checks.push(mode+' Sub Canvas');
 }
 await c.screenshot(dir+'/canvas-result.png');
 assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('${base}D.md'))`),fixtures['D.md']);
 assert.equal(c.errors.length,0);report.passed=true;await writeFile(dir+'/drag-result.json',JSON.stringify(report,null,2));console.log(report);
}finally{c.close()}

