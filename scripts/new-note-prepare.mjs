import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),dir='.artifacts/new-note';
try {
  const vault=await c.evaluate('app.vault.adapter.getBasePath()');
  assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
  if (process.argv[2] !== 'fixtures') {
  await mkdir(dir);
  await cp(vault+'/.obsidian',dir+'/backup/.obsidian',{recursive:true});
  const originals=[];
  for(const path of await c.evaluate('app.vault.getFiles().map(f=>f.path)')) originals.push({path,sha256:createHash('sha256').update(await readFile(vault+'/'+path)).digest('hex')});
  await writeFile(dir+'/originals.json',JSON.stringify(originals));
  await writeFile(dir+'/settings.json',JSON.stringify(await c.evaluate(`({newFileLocation:app.vault.getConfig('newFileLocation'),newFileFolderPath:app.vault.getConfig('newFileFolderPath')})`)));
  console.log({vault,title:c.target.title,originalFiles:originals.length});
  }
  await c.evaluate(`(async()=>{await app.vault.createFolder('NewNote-Review');await app.vault.createFolder('NewNote-Review/지정 폴더');await app.vault.create('NewNote-Review/Main.md',${JSON.stringify('# 새 링크 파일 검증\n\n기존 본문 보존\n')});return true})()`);
} finally {c.close()}
