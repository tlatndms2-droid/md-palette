import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {c,p,js,pause,wait,point,tap,click,key} from './stage4-helpers.mjs';
const dir='.artifacts/stage6',base='Stage6-Review/',fixtures=JSON.parse(await readFile(dir+'/fixtures.json','utf8'));
const card=n=>`.mdp-card[data-path="${base+n}"] .mdp-card-name`;
const value=leaf=>js(`${leaf}.view.editor.getValue()`);
async function textClick(text){await tap(await js(`(()=>{const e=[...document.querySelectorAll('.menu-item-title')].find(e=>e.textContent===${JSON.stringify(text)});if(!e)throw Error('Missing menu '+${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));await pause(180)}
async function markdownPoint(leaf){return js(`(()=>{const e=${leaf}.view.editor,pos=e.getValue().indexOf('여기에 추가: ')+8;e.scrollIntoView({from:e.offsetToPos(pos),to:e.offsetToPos(pos)},true);const r=e.cm.coordsAtPos(pos);return{x:r.left+1,y:(r.top+r.bottom)/2,offset:e.posToOffset(e.posAtCoords(r.left+1,(r.top+r.bottom)/2))}})()`)}
async function drag(selector,pt){
 await c.send('Input.setInterceptDrags',{enabled:true});c.dragEvents.length=0;
 const a=await point(selector);await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...a});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...a});
 for(let i=1;i<=8;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:a.x+i*3,y:a.y+i*2});
 for(let i=0;i<30&&!c.dragEvents.length;i++)await pause(50);assert.ok(c.dragEvents.length,'native source drag');
 const data=c.dragEvents.at(-1).data;assert.ok(data.items.some(i=>i.mimeType==='application/x-md-palette-reuse'));
 for(const type of ['dragEnter','dragOver','drop'])await c.send('Input.dispatchDragEvent',{type,x:pt.x,y:pt.y,data});
 await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:pt.x,y:pt.y});await c.send('Input.setInterceptDrags',{enabled:false});await pause(300);
}
async function resetMain(){await key('Escape','Escape',27);await js(`(async()=>{const l=${p}.mainLeaf;await app.workspace.revealLeaf(l);await l.setViewState({...l.getViewState(),state:{...l.getViewState().state,mode:'source',source:true}});l.view.editor.setValue(${JSON.stringify(fixtures['Main.md'])});await l.view.save();${p}.selectView('link','card');return true})()`);await wait(`document.querySelector('.mdp-card-name')`);await pause(250)}
async function metadata(){await js(`${p}.metadataCollapsed=[];${p}.selectView('metadata');true`);await wait(`document.querySelector('.mdp-meta-highlights')`)}
export {c,p,js,pause,wait,point,tap,click,key,dir,base,fixtures,card,value,textClick,markdownPoint,drag,resetMain,metadata};
