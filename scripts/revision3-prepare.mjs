import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/revision3',p="app.plugins.plugins['md-palette']";
try{
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 await mkdir(dir);await cp(vault+'/.obsidian',dir+'/backup/.obsidian',{recursive:true});
 const paths=await c.evaluate('app.vault.getFiles().map(f=>f.path)'),originals=[];
 for(const path of paths)originals.push({path,sha256:createHash('sha256').update(await readFile(vault+'/'+path)).digest('hex')});
 await writeFile(dir+'/originals.json',JSON.stringify(originals));
 await writeFile(dir+'/previous-folders.json',JSON.stringify(await c.evaluate(`${p}.foldersByMain`)));
 const base='Revision3-Review';await c.evaluate(`app.vault.createFolder('${base}').then(()=>true)`);
 const long='다빈치 리졸브 초보자를 위한 에디트 페이지 핵심 가이드.md';
 const fixtures={'Main.md':`# 제목 카드 시험\n\n[[${base}/${long}]]\n[[${base}/계획법.md]]\n[[${base}/프로젝트.canvas]]\n[[${base}/그림.svg]]\n`,'Other.md':'# 다른 Main\n','계획법.md':'# 계획법\n\nCtrl 미리보기 내용\n',[long]:'# 긴 제목 본문\n\n제목 카드에서는 이 본문을 읽지 않습니다.\n','프로젝트.canvas':'{"nodes":[],"edges":[]}','그림.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="purple"/></svg>'};
 for(const [name,text] of Object.entries(fixtures))await c.evaluate(`app.vault.create(${JSON.stringify(base+'/'+name)},${JSON.stringify(text)}).then(()=>true)`);
 await c.evaluate(`app.hotkeyManager.setHotkeys('md-palette:set-main',[{modifiers:['Mod','Shift'],key:'M'}]);app.hotkeyManager.save();true`);
 console.log({originalFiles:originals.length,vault});
}finally{c.close()}
