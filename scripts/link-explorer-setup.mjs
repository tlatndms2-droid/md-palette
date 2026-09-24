import {connect} from './cdp.mjs';
import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const c=await connect(),dir='.artifacts/link-explorer';
try{
 const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Link-Sandbox-20260924'));
 await mkdir(dir,{recursive:true});await cp(vault+'/.obsidian',dir+'/before-obsidian',{recursive:true});
 const folder=vault+'/.obsidian/plugins/md-palette';await mkdir(folder,{recursive:true});
 for(const name of ['main.js','manifest.json','styles.css']){await cp(name,folder+'/'+name);assert.deepEqual(await readFile(name),await readFile(folder+'/'+name));}
 await c.evaluate(`(async()=>{await app.plugins.setEnable(true);await app.plugins.loadManifests();await app.plugins.enablePluginAndSave('md-palette');return true})()`);
 assert.equal(await c.evaluate(`app.plugins.plugins['md-palette'].manifest.version`),'0.1.11');
 const fixtures={
  '나의 글쓰기.md':'# 나의 글쓰기\n\n[[관찰의 기록]]\n[[문장 수집]]\n\n==Main의 강조==\n',
  '관찰의 기록.md':'# 관찰의 기록\n\n[[산책 메모]]\n\n==관찰은 구체적인 장면에서 시작한다.==\n',
  '문장 수집.md':'# 문장 수집\n\n[[산책 메모]]\n==다시 읽고 싶은 문장==\n',
  '산책 메모.md':'# 산책 메모\n\n[[빛과 그림자]]\n==같은 길도 시간과 시선에 따라 다른 장면을 보여준다.==\n\n- [ ] 인상적인 장면 하나 고르기\n\n산책에서 본 장면[^산책]\n\n[^산책]: 작은 변화를 관찰한다.\n\n장면의 기록 ^scene\n\nhttps://example.com\n',
  '글쓰기 아이디어.md':'# 글쓰기 아이디어\n\n[[관찰의 기록]]\n==작은 변화를 첫 장면으로==\n',
  '빛과 그림자.md':'# 빛과 그림자\n\n[[관찰의 기록]]\n==빛의 방향에 따라 장면이 달라진다.==\n',
  '초안.md':'# 초안\n\n[[나의 글쓰기]]\n\n여기에 글을 이어 씁니다.\n',
  '미연결.md':'# 연결되지 않은 자료\n',
  '자료.canvas':JSON.stringify({nodes:[],edges:[]})
 };
 await c.evaluate(`(async()=>{for(const [path,body] of Object.entries(${JSON.stringify(fixtures)})){if(app.vault.getAbstractFileByPath(path))throw Error('Fixture exists');await app.vault.create(path,body)}return true})()`);
 await writeFile(dir+'/fixture-originals.json',JSON.stringify(fixtures,null,2));
 await writeFile(dir+'/fixture-hashes.json',JSON.stringify(Object.fromEntries(Object.entries(fixtures).map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')])),null,2));
 await new Promise(r=>setTimeout(r,600));
 await c.evaluate(`(async()=>{const p=app.plugins.plugins['md-palette'];const leaf=app.workspace.getLeaf(false);await leaf.openFile(app.vault.getAbstractFileByPath('나의 글쓰기.md'));await p.setMain(leaf);await p.openIn('sub',app.vault.getAbstractFileByPath('초안.md'));await p.openSidebar();await p.changeFolders(s=>{s.folders.push({id:'writing',name:'글쓰기 자료',parent:''});s.positions['관찰의 기록.md']='writing';s.positions['문장 수집.md']='writing';s.current='writing'});p.selectView('link','card');p.flushState();await p.saveChain;return true})()`);
 await cp(folder+'/data.json',dir+'/fixture-data.json');
 await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1000,deviceScaleFactor:1,mobile:false});
 console.log({vault,version:'0.1.11',fixtures:Object.keys(fixtures).length});
}finally{c.close()}
