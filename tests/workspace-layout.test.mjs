import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {transform} from 'esbuild';
class Split {
 constructor(workspace,direction){this.workspace=workspace;this.direction=direction;this.children=[];this.type='split'}
 setDirection(d){this.direction=d}
 insertChild(i,c){this.children.splice(i,0,c);c.parent=this}
 removeChild(c){this.children.splice(this.children.indexOf(c),1);c.parent=undefined;if(this.parent&&this.children.length===1){const parent=this.parent,index=parent.children.indexOf(this),only=this.children.pop();parent.children.splice(index,1,only);only.parent=parent;this.parent=undefined}}
}
globalThis.__layoutTest={WorkspaceSplit:Split,TFile:class{}};
const source=(await readFile('src/workspace-adapter.ts','utf8')).replace(/^import .* from 'obsidian';/m,'const {WorkspaceSplit,TFile}=globalThis.__layoutTest;');
const {code}=await transform(source,{loader:'ts',format:'esm'});const {arrange}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
function setup(dir='horizontal'){const app={workspace:{requestSaveLayout(){}}},root=new Split(app.workspace,dir);const group=id=>({id,type:'tabs',currentTab:0,children:[{getRoot:()=>root}]});const put=(p,...children)=>children.forEach(c=>p.insertChild(p.children.length,c));return {app,root,group,put}}
test('extract nested Sub to full-height right without breaking video/Main stack',()=>{
 const {app,root,group,put}=setup(),video=group('video'),main=group('main'),sub=group('sub'),bottom=new Split(app.workspace,'vertical');put(bottom,main,sub);put(root,video,bottom);
 assert.equal(arrange(app,main,[sub]),true);assert.equal(root.direction,'vertical');assert.deepEqual(root.children[0].children,[video,main]);assert.equal(root.children[1],sub);assert.equal(arrange(app,main,[sub]),false);
});
test('nested left column retains its ordinary groups while multiple Subs keep order',()=>{
 const {app,root,group,put}=setup('vertical'),left=new Split(app.workspace,'horizontal'),video=group('video'),main=group('main'),sub=group('sub'),sub2=group('sub2'),ordinary=group('ordinary'),row=new Split(app.workspace,'vertical');put(row,main,sub);put(left,video,row);put(root,left,ordinary,sub2);
 arrange(app,main,[sub,sub2]);assert.deepEqual(root.children,[left,sub,sub2,ordinary]);assert.deepEqual(left.children,[video,main]);assert.equal(arrange(app,main,[sub,sub2]),false);
});
test('already adjacent full-height groups retain layout without mutation',()=>{
 const {app,root,group,put}=setup('vertical'),main=group('main'),sub=group('sub'),ordinary=group('ordinary');put(root,main,sub,ordinary);assert.equal(arrange(app,main,[sub]),false);assert.deepEqual(root.children,[main,sub,ordinary]);
});
