import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),js=s=>c.evaluate(s),p="app.plugins.plugins['md-palette']",dir='.artifacts/sub-rules',j=JSON.stringify;
try{
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Metadata-Sandbox-20260922'));await mkdir(dir,{recursive:true});
 const backup=dir+'/backup-'+Date.now();await cp(vault+'/.obsidian',backup+'/.obsidian',{recursive:true});
 const originals=[];for(const path of await js('app.vault.getFiles().map(f=>f.path)')){const bytes=await readFile(vault+'/'+path);originals.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});if(path.endsWith('.canvas')){await mkdir(backup+'/files/'+path.slice(0,path.lastIndexOf('/')+1),{recursive:true});await cp(vault+'/'+path,backup+'/files/'+path)}}
 await writeFile(dir+'/backup.json',j({backup,originals}));
 const root='SubRules-Review-'+Date.now();await writeFile(dir+'/fixture.json',j({root}));
 await js(`(async()=>{await app.vault.createFolder(${j(root)});for(const [name,text] of Object.entries({'Main.md':'# Sub 규칙 검증','자료 A.md':'# 자료 A','자료 B.md':'# 자료 B','지도.canvas':JSON.stringify({nodes:[],edges:[]}),'미연결.md':'# 미연결','아래 일반.md':'# 아래 일반'}))await app.vault.create(${j(root)}+'/'+name,text);const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII='),c=>c.charCodeAt(0));await app.vault.createBinary(${j(root+'/사진.png')},bytes.buffer);await app.vault.createBinary(${j(root+'/미연결 사진.png')},bytes.buffer);const l=${p}.mainLeaf;await ${p}.unsetMain();await l.openFile(app.vault.getAbstractFileByPath(${j(root+'/Main.md')}));await ${p}.setMain(l);for(const name of ['자료 A.md','자료 B.md','사진.png','지도.canvas'])await ${p}.addConnection(${p}.mainFile,app.vault.getAbstractFileByPath(${j(root)}+'/'+name),true);${p}.selectView('link','card');return true})()`);
 await new Promise(r=>setTimeout(r,600));
 // Observe the legacy implementation while its views change (including native tab replacement).
 await js(`window.subTrace=[];window.originalSubSync=${p}.sync;${p}.sync=function(...args){const snap=()=>({group:this.subGroup?.id,subs:this.subGroups.map(g=>g.id),views:this.subGroups.flatMap(g=>g.children.map(l=>({type:l.getViewState().type,file:l.getViewState().state?.file})))});const before=snap();const value=window.originalSubSync.apply(this,args);window.subTrace.push({before,after:snap()});return value};true`);
 const transitions=[];
 for(const name of ['자료 A.md','사진.png','지도.canvas','자료 B.md']){
  await js(`new Promise(resolve=>${p}.run(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath(${j(root+'/'+name)}));resolve(true)}))`);await new Promise(r=>setTimeout(r,300));
  transitions.push(await js(`({name:${j(name)},group:${p}.subGroup?.id,subs:${p}.subGroups.map(g=>g.id),icons:document.querySelectorAll('[aria-label="Sub Space"]').length})`));
 }
 // Native switching is outside the plugin busy guard.
 for(const name of ['사진.png','지도.canvas','자료 A.md']){
  await js(`(async()=>{const g=${p}.subGroup??app.workspace.getLeavesOfType('markdown').find(l=>l.view.file?.path===${j(root+'/자료 B.md')})?.parent;window.legacySubLeaf=g.children[g.currentTab];await legacySubLeaf.openFile(app.vault.getAbstractFileByPath(${j(root+'/'+name)}));return true})()`);await new Promise(r=>setTimeout(r,350));
  transitions.push(await js(`({native:${j(name)},group:${p}.subGroup?.id,subs:${p}.subGroups.map(g=>g.id),icons:document.querySelectorAll('[aria-label="Sub Space"]').length})`));
 }
 await writeFile(dir+'/before.json',j({transitions,trace:await js('window.subTrace')}));console.log(transitions);
}finally{await js(`if(window.originalSubSync){${p}.sync=window.originalSubSync;delete window.originalSubSync}true`).catch(()=>{});c.close()}
