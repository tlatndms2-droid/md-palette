import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/stage6';
try {
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 await mkdir(dir);await cp(vault+'/.obsidian',dir+'/backup/.obsidian',{recursive:true});
 const originals=[];for(const path of await c.evaluate('app.vault.getFiles().map(f=>f.path)')) originals.push({path,sha256:createHash('sha256').update(await readFile(vault+'/'+path)).digest('hex')});
 await writeFile(dir+'/originals.json',JSON.stringify(originals));
 const base='Stage6-Review';await c.evaluate(`app.vault.createFolder('${base}').then(()=>true)`);
 const fixtures={
  'Main.md':'# Main 공부 계획\n\n여기에 추가: \n\n==첫 강조 문장\n두 번째 줄==\n\n블록의 첫 줄\n블록의 두 번째 줄 ^study\n\n[[Stage6-Review/자료.md]]\n[[Stage6-Review/그림.svg]]\n[[Stage6-Review/Board.canvas]]\n\n- [ ] 작업은 드래그하지 않음\n',
  '자료.md':'---\nprivate: frontmatter 제외\n---\n# 자료 제목\n\n재사용할 **본문**입니다.\n',
  'Sub.md':'# Sub 자료 정리\n\n여기에 추가: \n\n끝\n',
  'Ordinary.md':'# 일반 문서\n\n허용되지 않는 대상\n',
  'Board.canvas':'{"nodes":[],"edges":[]}',
  '그림.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="purple"/></svg>'
 };
 for(const [name,text] of Object.entries(fixtures)) await c.evaluate(`app.vault.create(${JSON.stringify(base+'/'+name)},${JSON.stringify(text)}).then(()=>true)`);
 await writeFile(dir+'/fixtures.json',JSON.stringify(fixtures));
 await c.evaluate(`(async()=>{const p=app.plugins.plugins['md-palette'];const l=app.workspace.createLeafInParent(p.mainGroup,p.mainGroup.children.length);await l.openFile(app.vault.getAbstractFileByPath('${base}/Main.md'));await p.setMain(l);await l.setViewState({...l.getViewState(),state:{...l.getViewState().state,mode:'source'}});p.selectView('link','card');await p.openIn('sub',app.vault.getAbstractFileByPath('${base}/Board.canvas'));app.workspace.leftSplit.collapse();app.workspace.rightSplit.setSize(400);const w=require('@electron/remote').getCurrentWindow();w.restore();w.setBounds({x:20,y:20,width:1800,height:1050});w.showInactive();return true})()`);
 console.log({vault,originalFiles:originals.length});
}finally{c.close()}
