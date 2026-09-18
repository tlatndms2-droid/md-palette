import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';import {c,p,dir,js,pause,wait,point,tap,click,textClick,key,type,file,folder,drag,view,sort,create} from './stage4-helpers.mjs';
try{
await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1100,deviceScaleFactor:1,mobile:false});
await js(`(async()=>{const p=${p};await p.mainGroup.children[p.mainGroup.currentTab].openFile(app.vault.getAbstractFileByPath('Folder-Review/Main.md'));p.cards.fileType='all';await p.changeFolders(s=>{s.folders=[];s.positions={};s.order=[];s.current='';s.mode='composite';s.sort='manual';s.treeSort='manual';s.display='medium';s.layout='vertical';s.collapsed=[]});p.selectView('link','folder');app.workspace.rightSplit.setSize(520);return true})()`);await pause(500);
const a=await create('공부'),b=await create('자료'),child=await create('하위',folder(a,'tree'));
await click(folder(b,'tree'),'right');await textClick('.menu-item-title','이름 변경');await type('참고');await textClick('.modal button','저장');await wait(`${p}.folders.folders.some(f=>f.name==='참고')`);
await click(file('Alpha.md'));await click(file('Beta.md'),'left',1,2);assert.equal(await js(`document.querySelectorAll('.mdp-folder-grid .is-selected').length`),2);assert.equal(await js(`document.querySelectorAll('.mdp-folder-tree .is-selected').length`),1);
await drag(file('Alpha.md'),folder(a,'tree'));assert.equal(await js(`${p}.folders.positions['Folder-Review/Alpha.md']`),a);assert.equal(await js(`${p}.folders.positions['Folder-Review/Beta.md']`),a);
await drag(folder(a,'tree'),folder(child,'tree'),{forbidden:true});assert.equal(await js(`${p}.folders.folders.find(f=>f.id==='${a}').parent`),'');
await drag(folder(child,'tree'),folder(b,'tree'));assert.equal(await js(`${p}.folders.folders.find(f=>f.id==='${child}').parent`),b);
await click(folder(a,'tree'),'left',2);await wait(`${p}.folders.current==='${a}'`);
await drag(file('Alpha.md'),'.mdp-folder-breadcrumb [data-folder=""]');assert.equal(await js(`${p}.folders.positions['Folder-Review/Alpha.md']`),'');
await click('[aria-label="뒤로"]');await wait(`${p}.folders.current===''`);await click('[aria-label="앞으로"]');await wait(`${p}.folders.current==='${a}'`);await click('[aria-label="상위 폴더"]');await wait(`${p}.folders.current===''`);
const before=await js(`JSON.stringify(${p}.folders)`);await drag(file('Gamma.md'),folder(a,'tree'),{cancel:true});assert.equal(await js(`JSON.stringify(${p}.folders)`),before);
await drag(file('Gamma.md'),file('Alpha.md'),{edge:true});const manual=await js(`${p}.folders.order`);assert.ok(manual.indexOf('f:Folder-Review/Gamma.md')<manual.indexOf('f:Folder-Review/Alpha.md'));
for(const name of ['이름','유형','수정 날짜','크기']){await sort(name);assert.equal(await js(`${p}.folders.sort`),{'이름':'name','유형':'type','수정 날짜':'mtime','크기':'size'}[name]);}
await sort('내림차순');assert.equal(await js(`${p}.folders.descending`),true);
const auto=await js(`JSON.stringify(${p}.folders)`);await drag(file('Gamma.md'),file('Alpha.md'),{edge:true,forbidden:true});assert.equal(await js(`JSON.stringify(${p}.folders)`),auto);
await drag(file('Gamma.md'),folder(b,'tree'));assert.equal(await js(`${p}.folders.positions['Folder-Review/Gamma.md']`),b);await sort('사용자 지정');assert.ok((await js(`${p}.folders.order`)).includes('f:Folder-Review/Alpha.md'));
await click('[aria-label="현재 폴더에서 검색"]');await type('Gamma');await wait(`document.querySelectorAll('.mdp-folder-grid [data-key]').length===1`);assert.ok((await js(`document.querySelector('.mdp-folder-grid').innerText`)).includes('참고'));
await click('.mdp-folder-breadcrumb [data-folder=""]');await wait(`document.querySelector('[type=search]').value===''`);
for(const name of ['큰 아이콘','중간 아이콘','작은 아이콘','목록','자세히','타일'])await view(name);
await view('Tree뷰');assert.equal(await js(`!!document.querySelector('.mdp-folder-grid')`),false);await view('Folder뷰');assert.equal(await js(`!!document.querySelector('.mdp-folder-tree')`),false);await view('복합뷰');await view('중간 아이콘');
await click(file('Alpha.md'),'left',2);await wait(`${p}.subGroup.children.some(l=>l.view.file?.path==='Folder-Review/Alpha.md')`);
await click(file('Drawing.canvas'),'left',2);await wait(`${p}.referenceGroup.children.some(l=>l.view.file?.path==='Folder-Review/Drawing.canvas')`);
await click(folder(b,'tree'),'right');await textClick('.menu-item-title','가상 폴더 삭제 (내용은 한 단계 위로)');await wait(`!${p}.folders.folders.some(f=>f.id==='${b}')`);assert.equal(await js(`${p}.folders.folders.find(f=>f.id==='${child}').parent`),'');assert.equal(await js(`${p}.folders.positions['Folder-Review/Gamma.md']`),'');
await click(folder(a,'tree')+' button');assert.equal(await js(`${p}.folders.collapsed.includes('${a}')`),true);await click(folder(a,'tree')+' button');
await c.screenshot(dir+'/core-ui.png');assert.deepEqual(c.errors,[]);await writeFile(dir+'/ui-result.json',JSON.stringify({passed:true,ids:{a,child},modes:true,sortOptions:true,nativeDrag:true,multi:true,navigation:true,search:true,deletion:true,errors:c.errors},null,2));console.log('PASS core Folder UI');
}finally{c.close()}
