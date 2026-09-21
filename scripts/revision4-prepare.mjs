import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/revision4';
try {
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));await mkdir(dir);await cp(vault+'/.obsidian',dir+'/backup/.obsidian',{recursive:true});
 const originals=[];for(const path of await c.evaluate('app.vault.getFiles().map(f=>f.path)'))originals.push({path,sha256:createHash('sha256').update(await readFile(vault+'/'+path)).digest('hex')});await writeFile(dir+'/originals.json',JSON.stringify(originals));
 await writeFile(dir+'/legacy-spaces.json',JSON.stringify(await c.evaluate(`app.plugins.plugins['md-palette'].data.spaces`)));
 const base='Revision4-Review';await c.evaluate(`app.vault.createFolder('${base}').then(()=>true)`);
 const fixtures={'Main.md':'# Main\n\n여기에 추가: \n\n설명 참조[^note]\n\n[^note]: 책 23쪽의 보충 설명\n    두 번째 줄\n\n[참고 사이트](https://example.com/reference?q=1#part)\n\n==강조 자료==\n\n블록 내용 ^block\n\n'+['A.md','B.md','C.md','D.md','Board.canvas','그림.svg'].map(n=>'[['+base+'/'+n+']]').join('\n')+'\n','A.md':'# A\n\n여기에 추가: \n\n[^mdp-1]: 기존 각주\n','B.md':'# B\n\n여기에 추가: \n','C.md':'# C\n\n여기에 추가: \n','D.md':'---\nproperty: keep\n---\n# D 자료\n\n재사용 본문\n','Board.canvas':'{"nodes":[],"edges":[]}','그림.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="purple"/></svg>'};
 for(const [name,text]of Object.entries(fixtures))await c.evaluate(`app.vault.create(${JSON.stringify(base+'/'+name)},${JSON.stringify(text)}).then(()=>true)`);await writeFile(dir+'/fixtures.json',JSON.stringify(fixtures));console.log({vault,originalFiles:originals.length});
}finally{c.close()}
