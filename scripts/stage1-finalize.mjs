import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { connect } from './cdp.mjs';

const dir='.artifacts/stage1';
const reports=['ui-result','lifecycle-result','restart-result','restore-cases','visual-result','drag-result','nested-result','failure-result'];
for(const name of reports){
  const report=JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));
  assert.deepEqual(report.exceptions??report.uncaught??[],[],name);
}
const c=await connect();
try {
  const live=await c.evaluate(`({version:app.plugins.plugins['md-palette'].manifest.version,vault:app.vault.adapter.getBasePath(),data:app.plugins.plugins['md-palette'].data,files:app.vault.getFiles().map(f=>f.path)})`);
  assert.equal(live.version,'0.0.2');
  assert.deepEqual(live.data.preservedFixture,{labels:['keep-me'],nested:{value:42}});
  assert.equal(live.files.length,9);
  for(const name of ['A','A-inactive','B','B-inactive','C','Ordinary','Ordinary-inactive']) {
    assert.equal(await readFile(`${live.vault}/Stage1-Fixtures/${name}.md`,'utf8'),`# ${name}\n\n원본 본문 보존. [[B]] 및 [[Board.canvas]]\n`);
  }
  assert.deepEqual(JSON.parse(await readFile(`${live.vault}/Stage1-Fixtures/Board.canvas`,'utf8')),{nodes:[],edges:[]});
  assert.equal(await readFile(`${live.vault}/Stage1-Fixtures/Image.svg`,'utf8'),'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="teal"/></svg>');
  const assets=[];
  for(const name of ['main.js','manifest.json','styles.css']) {
    const local=await readFile(name),installed=await readFile(`${live.vault}/.obsidian/plugins/md-palette/${name}`);
    assert.deepEqual(installed,local);
    assets.push({name,sha256:createHash('sha256').update(local).digest('hex'),bytes:local.length});
  }
  const report={version:'0.0.2',passed:true,reports,assets,markdownFilesUnchanged:7,imageUnchanged:true,canvasDataUnchanged:true,unknownDataPreserved:true};
  await writeFile(`${dir}/release-ready.json`,JSON.stringify(report,null,2));
  console.log(report);
} finally {c.close();}
