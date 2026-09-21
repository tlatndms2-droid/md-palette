import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/revision2';
try {
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 await mkdir(dir);await cp(vault+'/.obsidian',dir+'/backup/.obsidian',{recursive:true});
 const paths=await c.evaluate('app.vault.getFiles().map(f=>f.path)');const originals=[];
 for(const path of paths)originals.push({path,sha256:createHash('sha256').update(await readFile(vault+'/'+path)).digest('hex')});
 await writeFile(dir+'/originals.json',JSON.stringify(originals));
 const base='Revision2-Review';await c.evaluate(`app.vault.createFolder('${base}').then(()=>true)`);
 const fixtures={
 'Main.md':'---\nrelated:\n  - "[[Revision2-Review/Property.md]]"\nwebsite: https://example.com\n---\n# Main 유지\n\n[[Revision2-Review/Body.md#Target|본문 링크]]\n\n[[Revision2-Review/Board.canvas|캔버스]]\n\n![[Revision2-Review/Picture.svg]]\n\n[웹 자료](https://example.com)\n\n==강조 내용==\n\n- [ ] 할 일\n',
 'Body.md':'# Body 참고\n\n첫 문단입니다.\n\n## Target\n\n미리보기 내용입니다.\n\n[[Revision2-Review/Property.md]]\n',
 'Property.md':'# Property 참고\n\n속성 링크 대상입니다.\n',
 'Other.md':'# 일반 문서\n\n[[Revision2-Review/Body.md]]\n',
 'Board.canvas':'{"nodes":[],"edges":[]}',
 'Picture.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#8661cc"/></svg>'};
 for(const [name,text] of Object.entries(fixtures))await c.evaluate(`app.vault.create(${JSON.stringify(base+'/'+name)},${JSON.stringify(text)}).then(()=>true)`);
 console.log({vault,originalFiles:originals.length,backup:dir+'/backup'});
}finally{c.close()}
