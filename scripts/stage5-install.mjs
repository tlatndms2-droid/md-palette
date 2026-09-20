import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {connect} from './cdp.mjs';
const c=await connect();try{
const vault=await c.evaluate('app.vault.adapter.getBasePath()');assert.ok(vault.endsWith('MDPalette-Stage0-Sandbox-20260918'));
const manifest=JSON.parse(await readFile('manifest.json','utf8'));
assert.ok((await readFile('main.js','utf8')).startsWith(`/* MD Palette ${manifest.version} */`));
for(const name of ['main.js','manifest.json','styles.css']){const bytes=await readFile(name);await writeFile(vault+'/.obsidian/plugins/md-palette/'+name,bytes);assert.deepEqual(await readFile(vault+'/.obsidian/plugins/md-palette/'+name),bytes)}
await c.evaluate(`(async()=>{await app.plugins.disablePlugin('md-palette');app.plugins.manifests['md-palette']={...${JSON.stringify(manifest)},dir:'.obsidian/plugins/md-palette'};await app.plugins.enablePlugin('md-palette');return true})()`);
console.log(await c.evaluate(`({version:app.plugins.plugins['md-palette'].manifest.version,metadata:typeof app.plugins.plugins['md-palette'].patchMain})`));
}finally{c.close()}
