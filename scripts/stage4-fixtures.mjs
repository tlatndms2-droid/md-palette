import {connect} from './cdp.mjs';
const c=await connect();try{
const files={'Main.md':'# Folder Main\n\n[[Alpha]]\n[[Beta]]\n[[Gamma]]\n[[Drawing.canvas]]\n','Second.md':'# Second\n[[Alpha]]\n[[Beta]]','Alpha.md':'# Alpha\nSmall','Beta.md':'# Beta\nLonger text for sorting','Gamma.md':'# Gamma','Add.md':'# Added connection','Fail.md':'# Failure fixture','Drawing.canvas':'{"nodes":[],"edges":[]}'};
console.log(await c.evaluate(`(async()=>{await app.plugins.loadManifests();await app.plugins.enablePlugin('md-palette');await app.vault.createFolder('Folder-Review');for(const [n,t]of Object.entries(${JSON.stringify(files)}))await app.vault.create('Folder-Review/'+n,t);const p=app.plugins.plugins['md-palette'],leaf=p.mainGroup?.children[p.mainGroup.currentTab]??app.workspace.getLeaf(false);await leaf.openFile(app.vault.getAbstractFileByPath('Folder-Review/Main.md'));if(!p.mainGroup)await p.setMain(leaf);p.cards.fileType='all';p.selectView('link','folder');await p.openSidebar();app.workspace.rightSplit.setSize(520);return {version:p.manifest.version}})()`));
await new Promise(r=>setTimeout(r,700));await c.screenshot('.artifacts/stage4/initial.png');
}finally{c.close()}
