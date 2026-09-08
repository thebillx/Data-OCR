import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const output=fileURLToPath(new URL('../dist-pages/',import.meta.url));
const html=readFileSync(path.join(output,'index.html'),'utf8');

test('static entry and its assets resolve at a root domain and a project subpath',()=>{
  assert.match(html,/<html lang="th">/);
  assert.match(html,/<title>Mock Card Studio/);
  assert.ok(existsSync(path.join(output,'.nojekyll')));
  assert.ok(!existsSync(path.join(output,'server')));
  for(const base of ['https://example.test/','https://example.test/Data-OCR/']) {
    for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url=new URL(match[1],base);
      assert.ok(url.href.startsWith(base),`Asset escapes the deployment path: ${url}`);
      assert.ok(existsSync(path.join(output,url.href.slice(base.length))),`Missing asset: ${url}`);
    }
    for(const name of ['card-clean.png','card-reference.jpeg']) {
      const url=new URL(`./${name}`,base);
      assert.ok(url.href.startsWith(base));
      assert.ok(existsSync(path.join(output,name)));
    }
  }
});

test('static CSS loads each self-hosted card font within the deployment path',()=>{
  const fonts=new Set();
  for(const name of readdirSync(path.join(output,'assets')).filter(n=>n.endsWith('.css'))) {
    const css=readFileSync(path.join(output,'assets',name),'utf8');
    for(const match of css.matchAll(/url\(([^)]*\.ttf)\)/g)) {
      const ref=match[1].replace(/["']/g,'');
      const url=new URL(ref,`https://example.test/Data-OCR/assets/${name}`);
      assert.ok(url.pathname.startsWith('/Data-OCR/'));
      assert.ok(existsSync(path.join(output,url.pathname.slice('/Data-OCR/'.length))));
      fonts.add(path.basename(url.pathname));
    }
  }
  assert.deepEqual([...fonts].sort(),['CardThai-Looped-Bold.ttf','Sarabun-Regular.ttf','Sarabun-SemiBold.ttf']);
});
