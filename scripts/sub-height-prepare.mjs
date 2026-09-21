import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {c,p,js,pause,click} from './stage4-helpers.mjs';
const dir='.artifacts/sub-height';
try{
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 await mkdir(dir);await cp(vault+'/.obsidian',dir+'/backup/.obsidian',{recursive:true});
 const originals=[];for(const path of await js('app.vault.getFiles().map(f=>f.path)'))originals.push({path,sha256:createHash('sha256').update(await readFile(vault+'/'+path)).digest('hex')});await writeFile(dir+'/originals.json',JSON.stringify(originals));
 await js(`(async()=>{await app.vault.createFolder('SubHeight-Review');for(const [n,t]of Object.entries(${JSON.stringify({'Main.md':'# Main\n\n[[SubHeight-Review/학습 노트]]\n[[SubHeight-Review/다른 노트]]','학습 노트.md':'# 학습 노트\n\n1. Vertex\n2. Edge\n3. Face','다른 노트.md':'# 다른 노트'})}))await app.vault.create('SubHeight-Review/'+n,t);const p=${p};await p.unsetMain();const leaves=[];app.workspace.iterateAllLeaves(l=>{if(l.getRoot()===app.workspace.rootSplit)leaves.push(l)});const g=leaves[0].parent;for(const l of leaves){if(l.parent!==g){l.parent.removeChild(l);g.insertChild(g.children.length,l)}}const top=app.workspace.createLeafInParent(g,g.children.length);await top.openFile(app.vault.getAbstractFileByPath('Revision-Review/영상.webm'));const main=app.workspace.createLeafBySplit(top,'horizontal');await main.openFile(app.vault.getAbstractFileByPath('SubHeight-Review/Main.md'));await p.setMain(main);p.cards.display='list';p.selectView('link','card');const w=require('@electron/remote').getCurrentWindow();w.restore();w.setBounds({x:0,y:0,width:1550,height:1000});w.showInactive();return true})()`);
 await pause(600);await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await click('.mdp-card[data-path="SubHeight-Review/학습 노트.md"] .mdp-card-name','left',2);await pause(500);
 const result=await js(`(()=>{const p=${p};return {version:p.manifest.version,main:p.mainGroup.containerEl.getBoundingClientRect().toJSON(),sub:p.subGroup.containerEl.getBoundingClientRect().toJSON(),root:app.workspace.rootSplit.containerEl.getBoundingClientRect().toJSON()}})()`);assert.ok(result.sub.height<result.root.height*.7);await c.screenshot(dir+'/before.png');await writeFile(dir+'/before.json',JSON.stringify(result));console.log({reproduced:true,subHeight:result.sub.height,rootHeight:result.root.height,originalFiles:originals.length});
}finally{c.close()}
