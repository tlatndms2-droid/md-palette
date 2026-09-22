import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),js=s=>c.evaluate(s),p="app.plugins.plugins['md-palette']",dir='.artifacts/sub-rules';
try{
 // Compact only the test display after preservation checks: every leaf remains.
 let layout;try{layout=JSON.parse(await readFile(dir+'/before-review-layout.json','utf8'))}catch{layout=await js('app.workspace.getLayout()');await writeFile(dir+'/before-review-layout.json',JSON.stringify(layout))}
 const ids=await js(`({main:${p}.mainGroup.id,sub:${p}.subGroup.id,parent:${p}.subGroup.parent.id})`);
 const allLeaves=n=>n.type==='leaf'?[n]:(n.children??[]).flatMap(allLeaves);
 const before=allLeaves(layout.main).map(l=>({id:l.id,file:l.state.state?.file})).sort((a,b)=>a.id.localeCompare(b.id));
 const main=layout.main.children.find(n=>n.id===ids.main),column=layout.main.children.find(n=>n.id===ids.parent);
 assert.ok(main&&column);
 const normal=layout.main.children.filter(n=>n!==main&&n!==column);
 const normalLeaves=normal.flatMap(allLeaves),tabs={id:normal.find(n=>n.type==='tabs').id,type:'tabs',children:normalLeaves,currentTab:0};
 layout.main.children=[main,column,tabs];for(const node of layout.main.children)node.width=33.333;
 await js(`${p}.flushState();${p}.saveChain.then(()=>true)`);await js(`app.plugins.unloadPlugin('md-palette').then(()=>true)`);
 await js(`app.workspace.changeLayout(${JSON.stringify(layout)}).then(()=>true)`);await new Promise(r=>setTimeout(r,400));
 await js(`app.plugins.loadPlugin('md-palette').then(()=>true)`);await new Promise(r=>setTimeout(r,600));
 const actual=await js(`(()=>{const a=[];app.workspace.iterateAllLeaves(l=>{const file=l.getViewState().state?.file;if(file&&l.getRoot()!==app.workspace.leftSplit&&l.getRoot()!==app.workspace.rightSplit)a.push({id:l.id,file,group:l.parent.id})});return a})()`);
 assert.deepEqual(actual.map(({id,file})=>({id,file})).sort((a,b)=>a.id.localeCompare(b.id)),before);
 assert.equal(await js(`${p}.subGroup.id`),ids.sub);
 const icon=await js(`(()=>{const e=document.querySelector('[aria-label="Sub Space"]'),r=e.getBoundingClientRect(),h=e.closest('.workspace-tab-header').getBoundingClientRect();return{width:r.width,height:r.height,left:r.left,right:r.right,headerLeft:h.left,headerRight:h.right}})()`);
 assert.ok(icon.width>0&&icon.height>0&&icon.left>=icon.headerLeft&&icon.right<=icon.headerRight);
 await writeFile(dir+'/expected.json',JSON.stringify({group:ids.sub,parent:ids.parent,leaves:actual,main:await js(`app.vault.read(${p}.mainFile)`)}));
 await c.screenshot(dir+'/review.png');console.log({passed:true,leavesPreserved:actual.length,icon});
}finally{c.close()}
