import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,point,click,textClick,key} from './stage4-helpers.mjs';
async function drop(selector,pt){await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;const a=await point(selector);await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...a});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...a});for(let i=1;i<=9;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:a.x+i*4,y:a.y+i*2});for(let i=0;i<30&&!c.dragEvents.length;i++)await pause(50);assert.ok(c.dragEvents.length,'native drag started');const data=c.dragEvents.at(-1).data;for(const type of ['dragEnter','dragOver','drop'])await c.send('Input.dispatchDragEvent',{type,x:pt.x,y:pt.y,data});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:pt.x,y:pt.y});await c.send('Input.setInterceptDrags',{enabled:false});await pause(200)}
const dir='.artifacts/stage7',checks=[];
try{
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1700,height:1100,deviceScaleFactor:1,mobile:false});
 await js(`(async()=>{const p=${p};await p.openIn('sub',app.vault.getAbstractFileByPath('Review/Board.canvas'));window.s7Canvas=app.workspace.getMostRecentLeaf();p.selectView('metadata');return true})()`);await pause(300);
 for(const viewport of [[100,120,-.7],[-200,180,.4]]){
  await js(`s7Canvas.view.canvas.setViewport(${viewport.join(',')});true`);await pause(200);
  const ids=await js('[...s7Canvas.view.canvas.nodes.keys()]'),pt=await js(`(()=>{const r=s7Canvas.view.canvas.wrapperEl.getBoundingClientRect();return{x:r.x+r.width*.3,y:r.y+r.height*.4}})()`);
  await drop('.mdp-meta-highlights',pt);await textClick('.menu-item-title','텍스트 카드 만들기');await wait(`!${p}.reuseDrag.pending`);
  const node=await js(`s7Canvas.view.canvas.getData().nodes.find(n=>!${JSON.stringify(ids)}.includes(n.id))`);assert.equal(node.text,'강조 자료');
  const bounds=await js(`s7Canvas.view.canvas.nodes.get('${node.id}').nodeEl.getBoundingClientRect().toJSON()`);assert.ok(Math.abs(bounds.x-pt.x)<2&&Math.abs(bounds.y-pt.y)<2,JSON.stringify({pt,bounds}));checks.push('Canvas zoom/pan '+viewport+' drop within 2 screen pixels');
 }
 const before=await js('JSON.stringify(s7Canvas.view.canvas.getData())'),pt=await js(`(()=>{const r=s7Canvas.view.canvas.wrapperEl.getBoundingClientRect();return{x:r.x+r.width*.3,y:r.y+r.height*.4}})()`);
 await drop('.mdp-meta-highlights',pt);await key('Escape','Escape',27);assert.equal(await js('JSON.stringify(s7Canvas.view.canvas.getData())'),before);checks.push('Canvas menu Escape leaves nodes unchanged');
 await drop('.mdp-meta-highlights',pt);await js(`window.s7CanvasSave=s7Canvas.view.save;window.s7SaveCount=0;s7Canvas.view.save=async function(){if(!s7SaveCount++)throw Error('stage7 Canvas save fault');return s7CanvasSave.call(this)};true`);
 try{await textClick('.menu-item-title','텍스트 카드 만들기');await wait(`!${p}.reuseDrag.pending`);assert.equal(await js('JSON.stringify(s7Canvas.view.canvas.getData())'),before)}finally{await js('s7Canvas.view.save=s7CanvasSave;true')};checks.push('Canvas save fault removes only new node');
 await pause(5500);
 for(const name of ['그림.svg','Paper.pdf','Video.webm']){
  await js(`(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath(${JSON.stringify('Review/'+name)}));window.s7Unsupported=app.workspace.getMostRecentLeaf();return true})()`);await pause(200);
  const pt=await js(`(()=>{const r=s7Unsupported.view.containerEl.getBoundingClientRect();return{x:r.x+r.width*.3,y:r.y+r.height*.6}})()`);await drop('.mdp-meta-highlights',pt);assert.equal(await js('!!document.querySelector(".menu")'),false);checks.push('unsupported drop rejected: '+name);
 }
 await js(`${p}.selectView('link','card');true`);await c.screenshot(dir+'/canvas-guards.png');assert.equal(c.errors.length,0);await writeFile(dir+'/canvas-guards-result.json',JSON.stringify({passed:true,checks},null,2));console.log(checks);
}finally{c.close()}
