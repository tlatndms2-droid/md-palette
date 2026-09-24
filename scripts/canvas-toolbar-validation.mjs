import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,tap,textClick,key} from './stage4-helpers.mjs';
const dir='.artifacts/canvas-toolbar',checks=[],mode=process.argv[2]||'ui';
const check=s=>{checks.push(s);console.log('PASS',s)};
const at=(x,y)=>js(`(()=>{const c=targetLeaf.view.canvas,p=c.domFromPos({x:${x},y:${y}});return{x:p.x+c.canvasRect.cx,y:p.y+c.canvasRect.cy}})()`);
async function geometry(){return js(`(()=>{const s=${p}.canvasInsert.session,b=s.panel.getBoundingClientRect(),h=s.view.canvas.wrapperEl.getBoundingClientRect(),r=e=>e.getBoundingClientRect().toJSON();return{bar:b.toJSON(),host:h.toJSON(),tools:[...s.view.canvas.wrapperEl.querySelectorAll('.canvas-controls,.canvas-card-menu')].map(r),buttons:[...s.panel.querySelectorAll('button')].map(e=>({text:e.textContent,visible:document.elementFromPoint(e.getBoundingClientRect().x+e.clientWidth/2,e.getBoundingClientRect().y+e.clientHeight/2)===e}))}})()`)}
function checkRect(g){assert.ok(Math.abs(g.bar.top-g.host.top-16)<2);assert.ok(Math.abs(g.bar.left-g.host.left-16)<2);assert.ok(g.host.right-g.bar.right>=63);for(const t of g.tools)assert.ok(!(g.bar.left<t.right&&g.bar.right>t.left&&g.bar.top<t.bottom&&g.bar.bottom>t.top),'native toolbar overlap');assert.ok(g.buttons.every(b=>b.visible));}
try{
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Canvas-Sandbox-20260924'));assert.equal(await js(`${p}.manifest.version`),'0.1.10');
 await js(`(()=>{const w=require('@electron/remote').getCurrentWindow();w.restore();w.showInactive();w.webContents.setBackgroundThrottling(false);return true})()`);
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1600,height:1100,deviceScaleFactor:1,mobile:false});
 await js(`window.targetLeaf=app.workspace.getLeavesOfType('canvas').find(l=>l.getViewState().state.file==='Review-Target.canvas');app.workspace.setActiveLeaf(targetLeaf,{focus:false});true`);await pause(250);
 const before=await js('targetLeaf.view.canvas.getData()');
 await js(`${p}.canvasInsert.folder('root-a');true`);await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...await at(0,600)});await pause(150);
 const first=await geometry();checkRect(first);await c.screenshot(dir+'/'+mode+'.png');
 check('top-left status and buttons visible; right and bottom native tools do not overlap');
 await js('targetLeaf.view.canvas.setViewport(400,850,-2);true');await pause(200);const zoomed=await geometry();checkRect(zoomed);assert.equal(zoomed.bar.top,first.bar.top);assert.equal(zoomed.bar.left,first.bar.left);
 check('panel remains screen-fixed while Canvas pans and zooms');
 await textClick('.mdp-canvas-insert-bar button','취소');assert.equal(await js(`!!${p}.canvasInsert.session`),false);assert.deepEqual(await js('targetLeaf.view.canvas.getData()'),before);
 check('top cancel button works without Canvas edits');
 if(mode==='ui'){
  await js(`${p}.canvasInsert.files(['Review-A.md']);true`);await tap(await at(0,1200));await pause(250);assert.equal(await js('targetLeaf.view.canvas.getData().nodes.length'),before.nodes.length+1);
  await js(`${p}.canvasInsert.files(['Review-A.md']);true`);await textClick('.mdp-canvas-insert-bar button','마지막 삽입 되돌리기');await pause(250);assert.deepEqual(await js('targetLeaf.view.canvas.getData()'),before);
  check('top undo button restores last insertion; click-to-place remains functional');
 }
 await js(`${p}.canvasInsert.files(['Review-A.md']);true`);await key('Escape','Escape',27);assert.equal(await js(`!!${p}.canvasInsert.session`),false);
 const assets=[];for(const name of ['main.js','manifest.json','styles.css']){const local=await readFile(name);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),local);assets.push({name,sha256:createHash('sha256').update(local).digest('hex')});}
 assert.equal(c.errors.length,0);await writeFile(dir+'/'+mode+'-result.json',JSON.stringify({version:'0.1.10',passed:true,checks,geometry:first,assets},null,2));
}finally{c.close()}

