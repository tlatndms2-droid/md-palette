import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { connect } from './cdp.mjs';
const c=await connect(); const dir='.artifacts/stage2'; await mkdir(dir,{recursive:true});
const mode=process.argv[2]; const pause=ms=>new Promise(r=>setTimeout(r,ms));
const js=s=>c.evaluate(s);
async function click(selector,button='left',modifiers=0,count=1){
  const p=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button,clickCount:count,modifiers,...p});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button,clickCount:count,modifiers,...p});await pause(120);
}
async function textClick(selector,text){
  await waitFor(`[...document.querySelectorAll(${JSON.stringify(selector)})].some(e=>e.textContent.trim()===${JSON.stringify(text)})`);
  const p=await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing text '+${JSON.stringify(text)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});await pause(180);
}
async function key(key,code,modifiers=0){await c.send('Input.dispatchKeyEvent',{type:'keyDown',key,code,modifiers,...(key==='a'&&modifiers===2?{commands:['selectAll']}:{})});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key,code,modifiers});}
async function waitFor(expression){for(let i=0;i<35;i++){const r=await js(expression);if(r)return r;await pause(200);}throw Error('Timeout: '+expression);}
const card=name=>`.mdp-card[data-path="Stage2-Fixtures/${name}"]`;
const selection=()=>js(`[...document.querySelectorAll('.mdp-card.is-selected')].map(e=>e.dataset.path)`);
async function snap(name){await c.screenshot(`${dir}/${name}.png`);}
async function pick(name){await click('.mdp-add-connection');await c.send('Input.insertText',{text:name});await waitFor(`[...document.querySelectorAll('.suggestion-item')].some(e=>e.textContent.trim()==='Stage2-Fixtures/${name}')`);await textClick('.suggestion-item','Stage2-Fixtures/'+name);}
async function label(name,color){await textClick('.menu-item-title','새 Label 만들기');await click('input[aria-label="라벨 이름"]');await c.send('Input.insertText',{text:name});await js(`(()=>{const e=document.querySelector('input[type=color]');e.value=${JSON.stringify(color)};e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);await textClick('.modal button','만들기');}
async function selectValue(label,value){await click(`select[aria-label="${label}"]`);await key('Escape','Escape');await js(`(()=>{const e=document.querySelector('select[aria-label="${label}"]');e.value='${value}';e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);await pause(100);}
async function drag(from,to,cancel=false){
  c.dragEvents.length=0;await c.send('Input.setInterceptDrags',{enabled:true});
  const points=await js(`(()=>{const a=document.querySelector(${JSON.stringify(card(from))}),b=document.querySelector(${JSON.stringify(card(to))});a.scrollIntoView({block:'nearest'});const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return {a:{x:ar.x+ar.width/2,y:ar.y+ar.height/2},b:{x:br.x+br.width/2,y:br.bottom-8}}})()`);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...points.a});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...points.a});
  for(let i=1;i<=10;i++){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:points.a.x+(points.b.x-points.a.x)*i/10,y:points.a.y+(points.b.y-points.a.y)*i/10});await pause(35);}
  for(let i=0;i<10&&!c.dragEvents.length;i++)await pause(50);
  assert.ok(c.dragEvents.length,'Native HTML drag began');
  const data=c.dragEvents.at(-1).data;
  await c.send('Input.dispatchDragEvent',{type:'dragEnter',...points.b,data});await c.send('Input.dispatchDragEvent',{type:'dragOver',...points.b,data});
  await snap(cancel?'drag-cancel-preview':'drag-preview');
  if(cancel){await key('Escape','Escape');await c.send('Input.dispatchDragEvent',{type:'dragCancel',...points.b,data});}else await c.send('Input.dispatchDragEvent',{type:'drop',...points.b,data});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...points.b});await pause(250);
  await c.send('Input.setInterceptDrags',{enabled:false});
}
try {
  await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await c.send('Emulation.setDeviceMetricsOverride',{width:1500,height:1000,deviceScaleFactor:1,mobile:false});
  if(mode==='video-fixture') {
    await js(`(async()=>{window.testVideo?.remove();const canvas=document.createElement('canvas');canvas.width=240;canvas.height=160;const ctx=canvas.getContext('2d'),stream=canvas.captureStream(10),rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);rec.start();for(let i=0;i<12;i++){ctx.fillStyle='#336688';ctx.fillRect(0,0,240,160);ctx.fillStyle='white';ctx.font='24px sans-serif';ctx.fillText('Video '+i,20,90);stream.getVideoTracks()[0].requestFrame();await new Promise(r=>setTimeout(r,80));}await new Promise(r=>{rec.onstop=r;rec.stop()});stream.getTracks().forEach(t=>t.stop());await app.vault.modifyBinary(app.vault.getAbstractFileByPath('Stage2-Fixtures/Clip.webm'),await new Blob(chunks).arrayBuffer());return true})()`);
    const files=JSON.parse(await readFile(dir+'/fixture-originals.json','utf8'));
    files.find(f=>f.path.endsWith('/Clip.webm')).bytes=await js(`app.vault.readBinary(app.vault.getAbstractFileByPath('Stage2-Fixtures/Clip.webm')).then(b=>Array.from(new Uint8Array(b)))`);
    await writeFile(dir+'/fixture-originals.json',JSON.stringify(files));console.log('Video fixture bytes',files.find(f=>f.path.endsWith('/Clip.webm')).bytes.length);
  }
  if(mode==='setup') {
    await js(`(async()=>{
      if(!app.vault.getName().includes('Stage0-Sandbox'))throw Error('Wrong Vault');
      if(app.vault.getAbstractFileByPath('Stage2-Fixtures'))throw Error('Fixture exists');
      await app.vault.createFolder('Stage2-Fixtures');
      const files={
        'Main.md':'---\\nkeep: preserved\\nlink note:\\n  - "[[B]]"\\n---\\n# Main\\n\\n[[C]] ![[Image.svg]] [[Board.canvas]] [[Paper.pdf]] [[Clip.webm]] [[Other.xyz]] [[Broken.pdf]] [[Main]]\\n',
        'B.md':'---\\nsecret: MUST_NOT_APPEAR\\n---\\n# Project overview\\n\\nKorean 본문 미리보기. [[Main]]\\n',
        'C.md':'# C\\n\\nConnection C. [[Main]]\\n',
        'Backlink.md':'# Incoming\\n[[Main]]\\n',
        'Extra.md':'# Extra\\n새 연결 파일 본문.\\n',
        'OtherMain.md':'# Other Main\\n[[B]] [[C]] [[Main]]\\n',
        'Ordinary.md':'# Ordinary untouched\\n',
        'Image.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#194953"/><circle cx="220" cy="55" r="25" fill="#ffc75c"/><path d="M0 200 100 65 180 170 250 95 320 200" fill="#599e86"/></svg>',
        'Board.canvas':JSON.stringify({nodes:[{id:'a',type:'text',text:'Ideas',x:0,y:0,width:200,height:100},{id:'b',type:'text',text:'Research',x:250,y:180,width:220,height:100}],edges:[{id:'e',fromNode:'a',toNode:'b'}]}),
        'Other.xyz':'fallback fixture', 'Broken.pdf':'not a PDF'
      };
      for(const [name,text] of Object.entries(files))await app.vault.create('Stage2-Fixtures/'+name,text.replaceAll('\\\\n','\\n'));
      const leaf=(id,name)=>({id,type:'leaf',state:{type:'markdown',state:{file:'Stage2-Fixtures/'+name+'.md',mode:'source',source:false}}});
      const layout=app.workspace.getLayout();layout.main.children=[{id:'s2-main',type:'tabs',children:[leaf('s2-a','Main'),leaf('s2-inactive','OtherMain')]},{id:'s2-ordinary',type:'tabs',children:[leaf('s2-o','Ordinary')]}];layout.active='s2-a';layout.left.collapsed=true;layout.right.width=440;
      await app.workspace.changeLayout(layout);const p=app.plugins.plugins['md-palette'];p.data.preservedFixture={labels:['keep-me'],nested:{value:42}};await p.saveData(p.data);
      return true;
    })()`);
    // Minimal valid first-page PDF fixture, generated locally with proper xref offsets.
    const stream='BT /F1 24 Tf 40 200 Td (MD Palette PDF) Tj ET';
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 260] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
    let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    await js(`app.vault.createBinary('Stage2-Fixtures/Paper.pdf',Uint8Array.from(${JSON.stringify([...Buffer.from(pdf)])}).buffer).then(()=>true)`);
    await js(`(async()=>{const canvas=document.createElement('canvas');canvas.width=240;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#336688';ctx.fillRect(0,0,240,160);ctx.fillStyle='white';ctx.font='24px sans-serif';ctx.fillText('Video preview',20,90);const stream=canvas.captureStream(10),rec=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);await new Promise(resolve=>{rec.onstop=resolve;rec.start();setTimeout(()=>rec.stop(),800)});stream.getTracks().forEach(t=>t.stop());await app.vault.createBinary('Stage2-Fixtures/Clip.webm',await new Blob(chunks).arrayBuffer());return true})()`);
    await js(`app.commands.executeCommandById('md-palette:open-sidebar');true`);
    await pause(1600);
    const p=await js(`(()=>{const e=app.workspace.getLeafById('s2-a').tabHeaderEl;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'right',clickCount:1,...p});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'right',clickCount:1,...p});
  }
  if(mode==='setup'||mode==='setup-menu') {
    await textClick('.menu-item-title','메인 스페이스로 지정');
    await waitFor(`document.querySelectorAll('.mdp-card').length>=10`);await pause(1800);await snap('cards-initial');
    const files=await js(`Promise.all(app.vault.getFiles().filter(f=>f.path.startsWith('Stage2-Fixtures/')).map(async f=>({path:f.path,bytes:Array.from(new Uint8Array(await app.vault.readBinary(f)))})))`);
    await writeFile(dir+'/fixture-originals.json',JSON.stringify(files));
    console.log(await js(`({version:app.plugins.plugins['md-palette'].manifest.version,files:[...document.querySelectorAll('.mdp-card')].map(e=>e.dataset.path),previews:[...document.querySelectorAll('.mdp-preview')].map(e=>e.dataset.preview)})`));
  }
  if(mode==='ui') {
    await js(`app.plugins.plugins['md-palette'].cardsChanged();true`);
    await waitFor(`document.querySelectorAll('.mdp-card').length===10`);
    const paths=await js(`[...document.querySelectorAll('.mdp-card')].map(e=>e.dataset.path)`);
    assert.equal(new Set(paths).size,10);assert.ok(!paths.includes('Stage2-Fixtures/Main.md'));assert.equal(paths.filter(p=>p.endsWith('/B.md')).length,1);
    assert.ok(!(await js(`document.querySelector('.mdp-card-grid').innerText`)).includes('MUST_NOT_APPEAR'));
    // Force each media into view; wait for lazy work before asserting thumbnail types.
    for(const [name,type] of [['Image.svg','image'],['Board.canvas','canvas'],['Paper.pdf','pdf'],['Clip.webm','video'],['B.md','md']]) {
      await js(`document.querySelector(${JSON.stringify(card(name))}).scrollIntoView({block:'center'});true`);
      await waitFor(`document.querySelector(${JSON.stringify(card(name)+' .mdp-preview')}).dataset.preview==='${type}'`);
    }
    for(const name of ['Other.xyz','Broken.pdf']) {await js(`document.querySelector(${JSON.stringify(card(name))}).scrollIntoView({block:'center'});true`);await pause(1300);assert.equal(await js(`document.querySelector(${JSON.stringify(card(name)+' .mdp-preview')}).dataset.preview`),'fallback');}
    await snap('media-fallback');
    await click(card('B.md'));await click(card('C.md'),'left',2);assert.equal((await selection()).length,2);
    await click(card('B.md'),'right');await snap('multi-context');await label('Research','#5a97d1');
    let a=await js(`app.plugins.plugins['md-palette'].cards.assignments`);assert.ok(a['Stage2-Fixtures/B.md']===a['Stage2-Fixtures/C.md']);assert.equal(Object.keys(a).length,2);
    await click(card('Image.svg'));await click(card('Image.svg'),'right');await label('Design','#47a889');
    await textClick('.mdp-chip','Research');assert.equal(await js(`document.querySelectorAll('.mdp-card').length`),2);
    await textClick('.mdp-chip','Design');assert.equal(await js(`document.querySelectorAll('.mdp-card').length`),3);
    await textClick('.mdp-filter-toggle','Label 필터 ▾');assert.equal(await js(`document.querySelectorAll('.mdp-card').length`),3);
    await textClick('.mdp-filter-toggle','Label 필터 ▸');await textClick('.mdp-chip','All');assert.equal(await js(`document.querySelectorAll('.mdp-card').length`),10);
    await textClick('.mdp-chip','PDF');assert.equal(await js(`document.querySelectorAll('.mdp-card').length`),2);await textClick('.mdp-chip','전체');
    await click(card('B.md'));await click(card('Image.svg'),'left',8);assert.ok((await selection()).length>1);
    await click(card('B.md'),'left',0,2);await waitFor(`app.plugins.plugins['md-palette'].subGroup?.children.some(l=>l.getViewState().state.file==='Stage2-Fixtures/B.md')`);assert.equal((await selection()).length,1);
    await click(card('B.md'),'right');await textClick('.menu-item-title','Reference Space에서 열기');await pause(1200);
    assert.ok(await js(`app.plugins.plugins['md-palette'].referenceGroup.children.some(l=>l.getViewState().state.file==='Stage2-Fixtures/B.md')`));
    await click(card('Image.svg'),'left',0,2);await pause(800);assert.ok(await js(`app.plugins.plugins['md-palette'].referenceGroup.children.some(l=>l.getViewState().state.file==='Stage2-Fixtures/Image.svg')`));
    await pick('Extra.md');await waitFor(`!!document.querySelector(${JSON.stringify(card('Extra.md'))})`);
    const main=await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`);assert.ok(main.includes('link note:'));assert.ok(main.includes('Extra'));assert.ok(!main.includes('## link'));
    await pick('Extra.md');await pause(1300);assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`),main);
    await click('.mdp-add-connection');await key('Escape','Escape');assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`),main);
  }
  if(mode==='ui'||mode==='ui-resume') {
    await textClick('.mdp-chip','라벨 관리…');await snap('label-editor');await click('input[aria-label="라벨 이름"]');await key('a','KeyA',2);await c.send('Input.insertText',{text:'Reviewed'});await textClick('.modal button','적용');
    assert.equal(await js(`[...document.querySelectorAll('.mdp-label-badge')].filter(e=>e.textContent==='Reviewed').length`),2);
    for(const value of ['large','small','list','details','tiles','medium']) {await selectValue('보기 형식',value);assert.ok(await js(`!!document.querySelector('.mdp-display-${value}')`));await snap('display-'+value);}
    await selectValue('텍스트 크기','large');assert.ok(await js(`!!document.querySelector('.mdp-text-large')`));
    const point=await js(`(()=>{const r=document.querySelector('.mdp-card-grid').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+30}})()`);
    await c.send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:100,modifiers:2});await pause(200);assert.equal(await js(`app.plugins.plugins['md-palette'].cards.display`),'small');await selectValue('보기 형식','medium');
    await snap('cards-after-ui');assert.deepEqual(c.errors,[]);
    await writeFile(dir+'/ui-result.json',JSON.stringify({passed:true,version:'0.0.3',count:11,thumbnailTypes:['md','image','canvas','pdf','video','fallback'],selection:true,multiLabels:true,filterPersistenceWithinCollapse:true,openSubReference:true,frontmatterOnly:true,duplicateAndCancelUnchanged:true,viewModes:6,ctrlWheel:true,errors:c.errors},null,2));
    console.log('PASS core Card UI');
  }
  if(mode==='advanced') {
    await selectValue('보기 형식','list');
    await click(card('B.md'));await click(card('C.md'),'left',2);
    const before=await js(`app.plugins.plugins['md-palette'].cards.order`);
    await drag('B.md','Paper.pdf');
    const after=await js(`app.plugins.plugins['md-palette'].cards.order`);
    assert.notDeepEqual(after,before);assert.equal(after.indexOf('Stage2-Fixtures/C.md'),after.indexOf('Stage2-Fixtures/B.md')+1);assert.equal(after.indexOf('Stage2-Fixtures/B.md'),after.indexOf('Stage2-Fixtures/Paper.pdf')+1);
    await click(card('B.md'));await drag('B.md','Other.xyz');
    const single=await js(`app.plugins.plugins['md-palette'].cards.order`);assert.equal(single.indexOf('Stage2-Fixtures/B.md'),single.indexOf('Stage2-Fixtures/Other.xyz')+1);
    await drag('B.md','Paper.pdf',true);assert.deepEqual(await js(`app.plugins.plugins['md-palette'].cards.order`),single);
    // Replace mixed labels in a multiselection via the actual submenu.
    await click(card('B.md'));await click(card('Image.svg'),'left',2);await click(card('B.md'),'right');
    const hover=await js(`(()=>{const e=[...document.querySelectorAll('.menu-item')].find(e=>e.textContent.includes('Label 일괄 적용'));const r=e.getBoundingClientRect();return{x:r.x+r.width-14,y:r.y+r.height/2}})()`);
    await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...hover});await pause(350);await textClick('.menu-item-title','Reviewed');
    const labels=await js(`app.plugins.plugins['md-palette'].cards`);assert.equal(labels.labels.length,1);assert.equal(labels.assignments['Stage2-Fixtures/B.md'],labels.assignments['Stage2-Fixtures/Image.svg']);
    await click(card('B.md'),'right');await textClick('.menu-item-title','Label 일괄 제거');assert.equal(await js(`Object.keys(app.plugins.plugins['md-palette'].cards.assignments).length`),1);
    await click(card('C.md'),'right');await textClick('.menu-item-title','현재 Label 제거');assert.equal(await js(`app.plugins.plugins['md-palette'].cards.labels.length`),0);
    await click(card('B.md'),'right');await label('Keep','#9471db');
    await writeFile(dir+'/drag-label-result.json',JSON.stringify({before,after,single,passed:true,errors:c.errors},null,2));
  }
  if(mode==='advanced'||mode==='advanced-main') {
    const single=await js(`app.plugins.plugins['md-palette'].cards.order`);
    // Main switch hides current Main and restores its old place when it reappears.
    const mainLeaf=await js(`app.plugins.plugins['md-palette'].mainGroup.children[0].id`);
    if(await js(`app.plugins.plugins['md-palette'].mainFile.path!=='Stage2-Fixtures/B.md'`))await js(`app.commands.executeCommandById('md-palette:switch-main-sub');true`);
    await waitFor(`app.plugins.plugins['md-palette'].mainFile.path==='Stage2-Fixtures/B.md' && document.querySelector('.mdp-main-context').textContent.includes('B.md')`);
    assert.ok(!(await js(`[...document.querySelectorAll('.mdp-card')].map(e=>e.dataset.path)`)).includes('Stage2-Fixtures/B.md'));
    await js(`app.commands.executeCommandById('md-palette:switch-main-sub');true`);await waitFor(`app.plugins.plugins['md-palette'].mainFile.path==='Stage2-Fixtures/Main.md' && document.querySelector('.mdp-main-context').textContent.includes('Main.md')`);
    assert.equal((await js(`app.plugins.plugins['md-palette'].cards.order`)).indexOf('Stage2-Fixtures/B.md'),single.indexOf('Stage2-Fixtures/B.md'));
    // Rename events preserve global label and order. Rename back to retain fixture coverage.
    const bIndex=single.indexOf('Stage2-Fixtures/B.md');
    await js(`app.vault.rename(app.vault.getAbstractFileByPath('Stage2-Fixtures/B.md'),'Stage2-Fixtures/Renamed.md').then(()=>true)`);await pause(1000);
    assert.equal(await js(`app.plugins.plugins['md-palette'].cards.order[${bIndex}]`),'Stage2-Fixtures/Renamed.md');assert.ok(await js(`app.plugins.plugins['md-palette'].cards.assignments['Stage2-Fixtures/Renamed.md']`));
    await js(`app.vault.rename(app.vault.getAbstractFileByPath('Stage2-Fixtures/Renamed.md'),'Stage2-Fixtures/B.md').then(()=>true)`);await waitFor(`!!document.querySelector(${JSON.stringify(card('B.md'))})`);
    // Rejection in Obsidian's frontmatter write path must not mutate the source.
    const original=await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`);
    await js(`window.s2Process=app.fileManager.processFrontMatter;app.fileManager.processFrontMatter=async()=>{throw Error('Intentional write rejection')};true`);
    await pick('Ordinary.md');await pause(500);await js(`app.fileManager.processFrontMatter=window.s2Process;delete window.s2Process;true`);
    assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`),original);assert.ok(!(await js(`app.plugins.plugins['md-palette'].connectedFiles().map(f=>f.path)`)).includes('Stage2-Fixtures/Ordinary.md'));
    await js(`app.vault.setConfig('theme','obsidian');app.updateTheme();app.workspace.rightSplit.setSize(440);true`);await selectValue('보기 형식','medium');await pause(1000);await snap('dark-cards');
    await js(`app.workspace.rightSplit.setSize(220);true`);await pause(500);
    const bounds=await js(`(()=>{const e=document.querySelector('.mdp-sidebar');return {width:e.clientWidth,scroll:e.scrollWidth,grid:document.querySelector('.mdp-card-grid').getBoundingClientRect().toJSON()}})()`);assert.ok(bounds.scroll<=bounds.width);assert.ok(bounds.grid.height>100);await snap('narrow-cards');
    await js(`app.workspace.rightSplit.setSize(440);true`);await pause(300);await textClick('.mdp-chip','Keep');await textClick('.mdp-filter-toggle','Label 필터 ▾');await selectValue('보기 형식','tiles');await selectValue('텍스트 크기','large');
    await pause(1300);await js(`app.workspace.requestSaveLayout();true`);await pause(1500);
    const saved=await js(`({cards:app.plugins.plugins['md-palette'].cards,spaces:app.plugins.plugins['md-palette'].data.spaces,unknown:app.plugins.plugins['md-palette'].data.preservedFixture})`);
    await writeFile(dir+'/restart-expected.json',JSON.stringify(saved,null,2));
    await writeFile(dir+'/advanced-result.json',JSON.stringify({passed:true,multiDrag:true,singleDrag:true,escapeUnchanged:true,mixedLabelsReplace:true,unusedLabelsVanish:true,mainHiddenOrder:true,renamePreserved:true,failedWriteUnchanged:true,narrowBounds:bounds,errors:c.errors},null,2));
    console.log('PASS drag, labels, Main switch, rename, write failure, dark/narrow UI');
  }
  if(mode==='restart') {
    await js(`app.commands.executeCommandById('md-palette:open-sidebar');true`);await pause(1200);
    const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8'));
    const actual=await js(`({version:app.plugins.plugins['md-palette'].manifest.version,cards:app.plugins.plugins['md-palette'].cards,spaces:app.plugins.plugins['md-palette'].data.spaces,unknown:app.plugins.plugins['md-palette'].data.preservedFixture,visible:[...document.querySelectorAll('.mdp-card')].map(e=>e.dataset.path),labelCollapsed:!document.querySelector('.mdp-filter-chips .mdp-chip')})`);
    assert.equal(actual.version,'0.0.3');assert.deepEqual(actual.cards,expected.cards);assert.deepEqual(actual.spaces,expected.spaces);assert.deepEqual(actual.unknown,expected.unknown);assert.deepEqual(actual.visible,['Stage2-Fixtures/B.md']);assert.deepEqual(c.errors,[]);
    await snap('restart');await writeFile(dir+'/restart-result.json',JSON.stringify({...actual,passed:true,errors:c.errors},null,2));console.log('PASS actual process restart and persisted Card state');
  }
  if(mode==='performance') {
    const saved=await js(`({main:app.plugins.plugins['md-palette'].mainFile.path,cards:structuredClone(app.plugins.plugins['md-palette'].cards)})`);
    saved.text=await js(`app.vault.read(app.vault.getAbstractFileByPath(${JSON.stringify(saved.main)}))`);await writeFile(dir+'/performance-backup.json',JSON.stringify(saved,null,2));
    await js(`(async()=>{if(!app.vault.getAbstractFileByPath('Stage2-Fixtures/Bulk'))await app.vault.createFolder('Stage2-Fixtures/Bulk');return true})()`);
    for(let start=0;start<2000;start+=50) await js(`Promise.all(Array.from({length:50},async(_,j)=>{const i=${start}+j,path='Stage2-Fixtures/Bulk/Note-'+String(i).padStart(4,'0')+'.md';if(app.vault.getAbstractFileByPath(path)||await app.vault.adapter.exists(path))return;try{await app.vault.create(path,'# Note '+i+'\\n\\nPerformance fixture 내용.\\n')}catch(e){if(!await app.vault.adapter.exists(path))throw e;}})).then(()=>true)`);
    const mainText=saved.text+'\n'+Array.from({length:400},(_,i)=>`[[Bulk/Note-${String(i).padStart(4,'0')}]]`).join('\n')+'\n';
    await js(`app.vault.modify(app.vault.getAbstractFileByPath(${JSON.stringify(saved.main)}),${JSON.stringify(mainText)}).then(()=>true)`);
    await js(`(()=>{const p=app.plugins.plugins['md-palette'];p.cards.labelFilter=[];p.cards.labelCollapsed=false;p.cards.display='medium';p.cardsChanged();return true})()`);
  }
  if(mode==='performance'||mode==='performance-resume') {
    const saved=JSON.parse(await readFile(dir+'/performance-backup.json','utf8'));
    await waitFor(`document.querySelectorAll('.mdp-card').length===411`);
    const render=await js(`(()=>{const p=app.plugins.plugins['md-palette'],t=performance.now();p.cardsChanged();return performance.now()-t})()`);
    const filterStart=performance.now();await textClick('.mdp-chip','PDF');assert.equal(await js(`document.querySelectorAll('.mdp-card').length`),2);const filterMs=performance.now()-filterStart;await textClick('.mdp-chip','전체');
    const scrollStart=performance.now();const point=await js(`(()=>{const r=document.querySelector('.mdp-card-grid').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await c.send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:1000});await pause(150);const scrollTop=await js(`document.querySelector('.mdp-card-grid').scrollTop`);assert.ok(scrollTop>0);const scrollMs=performance.now()-scrollStart;
    // Type through the real CodeMirror editor while the 411-card view is present.
    await js(`(()=>{const p=app.plugins.plugins['md-palette'],leaf=p.mainGroup.children[p.mainGroup.currentTab];app.workspace.setActiveLeaf(leaf);leaf.view.editor.setCursor({line:leaf.view.editor.lastLine(),ch:0});leaf.view.editor.focus();return true})()`);
    const typeStart=performance.now();await c.send('Input.insertText',{text:'typing responsiveness 시험'});await waitFor(`app.plugins.plugins['md-palette'].mainGroup.children[app.plugins.plugins['md-palette'].mainGroup.currentTab].view.editor.getValue().includes('typing responsiveness 시험')`);const typingMs=performance.now()-typeStart;
    await snap('performance-411-cards');
    const report={passed:true,vaultFiles:await js(`app.vault.getFiles().length`),connectedCards:411,renderSynchronousMs:render,filterCdpRoundTripMs:filterMs,scrollCdpRoundTripMs:scrollMs,typingCdpRoundTripMs:typingMs,scrollTop,notes:'CDP interaction timings include driver overhead; not whole-user latency or CPU benchmarks.',errors:c.errors};
    assert.ok(render<1000);assert.ok(typingMs<1000);assert.deepEqual(c.errors,[]);
    await js(`app.vault.modify(app.vault.getAbstractFileByPath(${JSON.stringify(saved.main)}),${JSON.stringify(saved.text)}).then(()=>true)`);await pause(1500);
    await js(`(()=>{const p=app.plugins.plugins['md-palette'];p.cards=${JSON.stringify(saved.cards)};p.cardsChanged();return true})()`);await pause(1200);
    await writeFile(dir+'/performance-result.json',JSON.stringify(report,null,2));console.log(report);
  }
  if(mode==='final-regression') {
    const saved=await js(`structuredClone(app.plugins.plugins['md-palette'].cards)`);
    await textClick('.mdp-filter-toggle','Label 필터 ▸');await textClick('.mdp-chip','All');await selectValue('보기 형식','medium');await selectValue('텍스트 크기','normal');
    await waitFor(`document.querySelectorAll('.mdp-card').length===11`);
    for(const [name,type] of [['Paper.pdf','pdf'],['Clip.webm','video'],['Image.svg','image'],['Board.canvas','canvas'],['B.md','md']]) {
      await js(`document.querySelector(${JSON.stringify(card(name))}).scrollIntoView({block:'center'});true`);
      await waitFor(`document.querySelector(${JSON.stringify(card(name)+' .mdp-preview')}).dataset.preview==='${type}'`);
    }
    await snap('final-media');
    const mainText=await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`);
    const pref=await js(`app.vault.getConfig('useMarkdownLinks')`);await js(`app.vault.setConfig('useMarkdownLinks',true);true`);
    await pick('Ordinary.md');await waitFor(`!!document.querySelector(${JSON.stringify(card('Ordinary.md'))})`);
    const linked=await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`);assert.ok(linked.includes('[[Stage2-Fixtures/Ordinary.md]]'));
    await pick('Ordinary.md');await pause(300);assert.equal(await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'))`),linked);
    await js(`app.vault.setConfig('useMarkdownLinks',${JSON.stringify(pref)});true`);await js(`app.vault.modify(app.vault.getAbstractFileByPath('Stage2-Fixtures/Main.md'),${JSON.stringify(mainText)}).then(()=>true)`);
    await waitFor(`document.querySelectorAll('.mdp-card').length===11`);
    const bText=await js(`app.vault.read(app.vault.getAbstractFileByPath('Stage2-Fixtures/B.md'))`);
    await js(`document.querySelector(${JSON.stringify(card('B.md'))}).scrollIntoView({block:'center'});true`);
    const scrollBefore=await js(`document.querySelector('.mdp-card-grid').scrollTop`);
    await js(`app.vault.modify(app.vault.getAbstractFileByPath('Stage2-Fixtures/B.md'),${JSON.stringify(bText.replace('Project overview','UPDATED PREVIEW'))}).then(()=>true)`);
    await waitFor(`document.querySelector(${JSON.stringify(card('B.md'))}).innerText.includes('UPDATED PREVIEW')`);
    const scrollAfter=await js(`document.querySelector('.mdp-card-grid').scrollTop`);assert.ok(Math.abs(scrollAfter-scrollBefore)<50);
    await js(`app.vault.modify(app.vault.getAbstractFileByPath('Stage2-Fixtures/B.md'),${JSON.stringify(bText)}).then(()=>true)`);await waitFor(`document.querySelector(${JSON.stringify(card('B.md'))}).innerText.includes('Project overview')`);
    // Recheck real drag after the offscreen rendering optimization; restore fixture order afterward.
    await selectValue('보기 형식','list');await click(card('B.md'));await click(card('C.md'),'left',2);const before=await js(`app.plugins.plugins['md-palette'].cards.order`);
    await drag('B.md','Paper.pdf');const after=await js(`app.plugins.plugins['md-palette'].cards.order`);assert.notDeepEqual(before,after);assert.equal(after.indexOf('Stage2-Fixtures/C.md')+1,after.indexOf('Stage2-Fixtures/B.md'));
    await drag('C.md','Other.xyz',true);assert.deepEqual(await js(`app.plugins.plugins['md-palette'].cards.order`),after);
    await js(`(()=>{const p=app.plugins.plugins['md-palette'];p.cards=${JSON.stringify(saved)};p.cardsChanged();return true})()`);await pause(1300);await js(`app.workspace.requestSaveLayout();true`);await pause(1300);
    const expected=await js(`({cards:app.plugins.plugins['md-palette'].cards,spaces:app.plugins.plugins['md-palette'].data.spaces,unknown:app.plugins.plugins['md-palette'].data.preservedFixture})`);await writeFile(dir+'/restart-expected.json',JSON.stringify(expected,null,2));
    assert.deepEqual(c.errors,[]);await writeFile(dir+'/final-regression.json',JSON.stringify({passed:true,finalMedia:true,markdownLinkPreference:true,duplicateUnchanged:true,modifiedPreviewRefreshed:true,scrollBefore,scrollAfter,multiDrag:true,cancelUnchanged:true,errors:c.errors},null,2));console.log('PASS final build media, properties, live refresh, scrolling and drag');
  }
  if(mode==='reset-regression') {
    const files=JSON.parse(await readFile(dir+'/fixture-originals.json','utf8')),b=files.find(f=>f.path.endsWith('/B.md'));
    await js(`app.vault.modify(app.vault.getAbstractFileByPath(${JSON.stringify(b.path)}),${JSON.stringify(Buffer.from(b.bytes).toString('utf8'))}).then(()=>true)`);await pause(700);
    const expected=JSON.parse(await readFile(dir+'/restart-expected.json','utf8'));
    await js(`(()=>{const p=app.plugins.plugins['md-palette'];p.cards=${JSON.stringify(expected.cards)};p.cardsChanged();return true})()`);await pause(1200);
    console.log('Restored regression fixture only');
  }
} finally {c.close();}
