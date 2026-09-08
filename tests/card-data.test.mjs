import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function moduleAt(name, dependencies = {}) {
  const exports = {};
  const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(js, {exports, require:(name)=>dependencies[name], Intl, Date});
  return exports;
}
const data = moduleAt('card-data');
const renderer = moduleAt('draw-card', {'./card-data':data});
test('dates preserve invalid input and convert CE to BE', () => {
  assert.equal(data.formatDate({day:'26',month:'11',year:'1999'},'th'), '26 พ.ย. 2542');
  assert.equal(data.validDate({day:'31',month:'2',year:'2024'}), false);
  assert.equal(data.validDate({day:'29',month:'2',year:'2024'}), true);
  assert.equal(data.validDate({day:'29',month:'2',year:'1900'}), false);
  assert.equal(data.formatDate({day:'31',month:'2',year:'2024'},'en'), '31 Feb. 2024');
  assert.equal(data.formatDate({day:'',month:'',year:''},'th'), '');
});
test('identifier formatting retains zeros and arbitrary negative-test strings', () => {
  assert.equal(renderer.displayId('0012345678901'), '0 0123 45678 90 1');
  assert.equal(renderer.displayId('abc000'), 'abc000');
  assert.equal(renderer.displayId(''), '');
});
test('baseline preserves original and restores warning last at both scales', () => {
  for (const scale of [1,2]) {
    const calls=[];
    const ctx = {scale(){},drawImage(...args){calls.push(args);}};
    const canvas = {getContext:()=>ctx};
    const assets = {reference:{},clean:{}};
    const warnings = renderer.drawCard(canvas,data.initialData,null,{zoom:1,x:50,y:50},scale,assets);
    assert.equal(canvas.width,1536*scale); assert.equal(canvas.height,1024*scale);
    assert.equal(warnings.length,0); assert.equal(calls.length,2);
    assert.equal(calls[0][0],assets.reference); assert.equal(calls[1][0],assets.reference);
    assert.deepEqual(calls[1].slice(1),[1098,0,438,38,1098,0,438,38]);
  }
});
test('clearing names and invalid dates produces warnings without validation mutation', () => {
  const fixture = {...data.initialData,idNumber:'00',firstTh:'',birth:{day:'31',month:'2',year:'1999'}};
  const before = JSON.stringify(fixture);
  assert.ok(data.dataWarnings(fixture).length >= 3);
  assert.equal(JSON.stringify(fixture),before);
});
