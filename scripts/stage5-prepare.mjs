import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/stage5';
try {
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 await mkdir(dir+'/backup',{recursive:true});await cp(vault+'/.obsidian',dir+'/backup/.obsidian',{recursive:true});
 const paths=await c.evaluate('app.vault.getFiles().map(f=>f.path)');const originals=[];
 for(const path of paths)originals.push({path,sha256:createHash('sha256').update(await readFile(vault+'/'+path)).digest('hex')});
 await writeFile(dir+'/originals.json',JSON.stringify(originals));
 for(const name of ['main.js','manifest.json','styles.css']) {const bytes=await readFile(name);await writeFile(vault+'/.obsidian/plugins/md-palette/'+name,bytes);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),bytes);}
 await c.evaluate(`(async()=>{await app.plugins.disablePlugin('md-palette');await app.plugins.enablePlugin('md-palette');return true})()`);
 await c.evaluate(`(async()=>{if(!app.vault.getAbstractFileByPath('Stage5-Review'))await app.vault.createFolder('Stage5-Review');return true})()`);
 const fixtures={
 'Main.md':'---\nlink note:\n  - "[[Stage5-Review/자료.md]]"\nwebsite: https://example.com\n---\n# 메타데이터 검증\n\n이 문서의 기준은 유지됩니다.[^note]\n\n==여러 줄의 강조\n전체를 보여줍니다.==\n\n- [ ] 해야 할 일\n- [x] 끝낸 일\n\n첫 번째 블록입니다. ^same\n\n두 번째 블록입니다. ^same\n\n[[Stage5-Review/자료.md|참고 자료]]\n[같은 자료](자료.md)\n[웹 자료](https://example.com)\n![[Stage5-Review/그림.svg]]\n[[Stage5-Review/없는파일]]\n\n[^note]: 각주 첫 줄\n    각주 두 번째 줄\n',
 '자료.md':'# 참고 자료\n\nMain으로 자동 변경되면 안 됩니다.\n',
 'Empty.md':'# 항목이 없는 문서\n',
 '그림.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#8661cc"/><text x="20" y="55" fill="white">Stage 5</text></svg>'};
 for(const [name,text] of Object.entries(fixtures))await c.evaluate(`app.vault.create(${JSON.stringify('Stage5-Review/'+name)},${JSON.stringify(text)}).then(()=>true)`);
 console.log({vault,version:await c.evaluate(`app.plugins.plugins['md-palette'].manifest.version`),backup:dir+'/backup',originalFiles:originals.length});
}finally{c.close()}
