import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {c,p,js,pause,wait,dir,base,metadata,drag,textClick} from './stage6-helpers.mjs';
try {
 await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await wait(`!!${p}?.mainFile`);
 assert.equal(await js(`${p}.manifest.version`),'0.0.12');assert.equal(await js(`${p}.mainFile.path`),base+'Main.md');assert.ok(await js(`!!${p}.subGroup`));
 const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8'));
 const vault=await js('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
 for(const [name,text]of Object.entries(expected))assert.equal(await readFile(vault+'/'+base+name,'utf8'),text,'restart saved '+name);
 await metadata();await js(`(async()=>{await ${p}.openIn('sub',app.vault.getAbstractFileByPath('${base}Board.canvas'));window.s6Canvas=app.workspace.getMostRecentLeaf();s6Canvas.view.canvas.setViewport(0,0,0);return true})()`);await pause(200);
 const before=await js('JSON.stringify(s6Canvas.view.canvas.getData())');
 const pt=await js(`(()=>{const r=s6Canvas.view.canvas.wrapperEl.getBoundingClientRect();return{x:r.x+r.width*.6,y:r.y+r.height*.4}})()`);
 await drag('.mdp-meta-highlights',pt);assert.deepEqual(await js(`[...document.querySelectorAll('.menu-item-title')].map(e=>e.textContent)`),['텍스트 카드 만들기','출처 링크 포함 카드 만들기','취소']);await textClick('취소');assert.equal(await js('JSON.stringify(s6Canvas.view.canvas.getData())'),before);
 const originals=JSON.parse(await readFile(dir+'/originals.json','utf8'));for(const f of originals)assert.equal(createHash('sha256').update(await readFile(vault+'/'+f.path)).digest('hex'),f.sha256,f.path);
 const advanced=JSON.parse(await readFile(dir+'/advanced-result.json','utf8')),ui=JSON.parse(await readFile(dir+'/ui-result.json','utf8'));assert.ok(advanced.passed&&ui.passed);
 for(const a of advanced.assets){assert.equal(createHash('sha256').update(await readFile(a.name)).digest('hex'),a.sha256);assert.equal(createHash('sha256').update(await readFile(vault+'/.obsidian/plugins/md-palette/'+a.name)).digest('hex'),a.sha256)}
 await c.screenshot(dir+'/restart.png');assert.equal(c.errors.length,0);
 const result={version:'0.0.12',passed:true,restoredMain:true,restoredSub:true,savedMarkdownAndCanvas:true,dragAfterRestart:true,originalFilesUnchanged:originals.length,assets:advanced.assets,errors:c.errors};
 await writeFile(dir+'/restart-result.json',JSON.stringify(result,null,2));await writeFile(dir+'/release-ready.json',JSON.stringify(result,null,2));console.log(result);
}finally{c.close()}
