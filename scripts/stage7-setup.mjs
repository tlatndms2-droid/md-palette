import assert from 'node:assert/strict';
import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/stage7';
const fixtures={
 'Main.md':'---\nkeep: preserved\nchild note: "[[Review/B]]"\nlink note:\n  - "[[Review/A]]"\nurl: https://example.com/property\n---\n# 통합 검증 Main\n\n여기에 추가: \n\n[[Review/B]] [[Review/C]] [[Review/D]] [[Review/그림.svg]] [[Review/Board.canvas]]\n\n설명 참조[^note]\n\n[^note]: 보충 설명\n    두 번째 줄\n\n==강조 자료==\n\n- [ ] 해야 할 일\n- [x] 완료한 일\n\n블록 내용 ^block\n\n[참고 사이트](https://example.com/reference)\n',
 'A.md':'# A 자료\n\n여기에 추가: \n\n[[Review/Main]]\n\n[^mdp-1]: 기존 각주\n',
 'B.md':'# B 자료\n\n여기에 추가: \n',
 'C.md':'# C 자료\n\n여기에 추가: \n',
 'D.md':'---\nsecret: hidden\n---\n# D 자료\n\n재사용 본문\n',
 'Other Main.md':'# 다른 Main\n\n[[Review/A]] [[Review/B]]\n',
 'Ordinary.md':'# 일반 문서\n\n보존 대상\n',
 'Extra.md':'# 새로 연결할 자료\n',
 'Empty.md':'# 빈 문서\n',
 'Board.canvas':'{"nodes":[],"edges":[]}',
 '그림.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#194953"/><circle cx="120" cy="80" r="45" fill="#ffc75c"/></svg>'
};
try{
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');
 assert.equal(vault,'C:\\Users\\User\\AppData\\Local\\Temp\\MDPalette-Stage7-Sandbox-20260922');
 await mkdir(dir,{recursive:true});
 await cp(vault+'/.obsidian',dir+'/initial-backup/.obsidian',{recursive:true});
 const dest=vault+'/.obsidian/plugins/md-palette';await mkdir(dest,{recursive:true});
 const hashes={};for(const n of ['main.js','manifest.json','styles.css']){await cp(n,dest+'/'+n);const hash=p=>readFile(p).then(b=>createHash('sha256').update(b).digest('hex'));hashes[n]=await hash(n);assert.equal(await hash(dest+'/'+n),hashes[n]);}
 await writeFile(dir+'/install.json',JSON.stringify({vault,hashes},null,2));
 await c.evaluate(`(async()=>{await app.plugins.setEnable(true);await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return true})()`);
 assert.equal(await c.evaluate(`app.plugins.plugins['md-palette'].manifest.version`),'0.0.15');
 await c.evaluate(`(async()=>{if(app.vault.getAbstractFileByPath('Review'))throw Error('Fixture already exists');await app.vault.createFolder('Review');await app.vault.createFolder('Review/저장 폴더');for(const [n,t]of Object.entries(${JSON.stringify(fixtures)}))await app.vault.create('Review/'+n,t);return true})()`);
 await writeFile(dir+'/fixtures.json',JSON.stringify(fixtures,null,2));
 await c.evaluate(`(async()=>{const w=require('@electron/remote').getCurrentWindow();w.restore();w.setBounds({x:0,y:0,width:1700,height:1050});w.showInactive();const leaf=(id,file)=>({id,type:'leaf',state:{type:'markdown',state:{file:'Review/'+file,mode:'source',source:true}}});const l=app.workspace.getLayout();l.main.children=[{id:'review-left',type:'split',direction:'horizontal',children:[{id:'review-top',type:'tabs',children:[leaf('review-ordinary','Ordinary.md')]},{id:'review-main-group',type:'tabs',children:[leaf('review-main','Main.md'),leaf('review-inactive','Other Main.md')]}]}];l.main.direction='vertical';l.active='review-main';l.left.collapsed=true;l.right.width=450;await app.workspace.changeLayout(l);app.commands.executeCommandById('md-palette:open-sidebar');return true})()`);
 await c.screenshot(dir+'/installed.png');console.log({vault,version:'0.0.15',hashes,target:c.target.title});
}finally{c.close()}
