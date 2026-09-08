import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function moduleAt(name, dependencies = {}, globals = {}) {
  const exports = {};
  const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(js, {exports, require:(name)=>dependencies[name], Intl, Date, ...globals});
  return exports;
}
const data = moduleAt('card-data');
function context(calls = [], texts = []) {
  return {scale(){},save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},
    drawImage(...args){calls.push(args);}, measureText(value){return {width:value.length*10};},
    fillText(value,x,y){texts.push({value,x,y,font:this.font});}};
}
const renderer = moduleAt('draw-card', {'./card-data':data}, {
  document:{createElement:()=>({getContext:()=>context()})}
});
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
test('baseline and edited names use one clean plate and Thai font at both scales', () => {
  for (const scale of [1,2]) {
    for (const fixture of [data.initialData,{...data.initialData,title:'miss',firstTh:'ทดสอบ',lastTh:'ข้อมูลจำลอง'}]) {
    const calls=[];
    const texts=[];
    const ctx = context(calls,texts);
    const canvas = {getContext:()=>ctx};
    const assets = {reference:{},clean:{}};
    const warnings = renderer.drawCard(canvas,fixture,null,{zoom:1,x:50,y:50},scale,assets);
    assert.equal(canvas.width,1536*scale); assert.equal(canvas.height,1024*scale);
    assert.equal(warnings.length,0);
    assert.equal(calls[0][0],assets.clean); assert.equal(calls.at(-1)[0],assets.reference);
    assert.deepEqual(calls.at(-1).slice(1),[1098,0,438,38,1098,0,438,38]);
    assert.equal(texts.find(t=>t.value===data.fullName(fixture,'th')).font,'700 54px CardThai, sans-serif');
    }
  }
});
test('dropdown dates clamp to the selected month and leap year without mutation', () => {
  const leap={day:'29',month:'2',year:'2024'};
  assert.equal(data.selectDatePart(leap,'year','2025').day,'28');
  assert.equal(leap.day,'29');
  assert.equal(data.selectDatePart({day:'31',month:'3',year:'2026'},'month','4').day,'30');
  assert.equal(data.daysInMonth('2','2000'),29);
  assert.equal(data.daysInMonth('2','1900'),28);
  assert.equal(data.selectableDate({day:'',month:'',year:''}),true);
  assert.equal(data.selectableDate({day:'',month:'2',year:'2024'}),true);
  assert.equal(data.selectableDate({day:'31',month:'2',year:'2024'}),false);
  assert.equal(data.selectableDate({day:'ABC',month:'2',year:'2024'}),false);
});
test('defaults use local today, preserve mock birth, and add eight test years', () => {
  const now=new Date(2026,8,8,1,0);
  const fixture=data.defaultData(now);
  assert.equal(JSON.stringify(fixture.issue),JSON.stringify({day:'8',month:'9',year:'2026'}));
  assert.equal(fixture.expiry.year,'2034');
  assert.equal(fixture.birth.year,'1996');
  assert.equal(fixture.title,null);
  assert.equal(fixture.expiryMode,'date');
  assert.notEqual(fixture.birth,data.initialData.birth);
  assert.equal(data.addTestYears({day:'29',month:'2',year:'2096'},8).day,'29');
  assert.equal(data.addTestYears({day:'29',month:'2',year:'2096'},4).day,'28');
  assert.equal(data.addTestYears({day:'31',month:'2',year:'2024'},8).year,'2024');
});
test('clearing all editable text cannot restore original name or date pixels', () => {
  const fixture=Object.fromEntries(Object.keys(data.initialData).map(key=>[key,['birth','issue','expiry'].includes(key)?{day:'',month:'',year:''}: key==='title'?null:key==='expiryMode'?'date':'']));
  const calls=[],texts=[],ctx=context(calls,texts),assets={reference:{},clean:{}};
  renderer.drawCard({getContext:()=>ctx},fixture,null,{zoom:1,x:50,y:50},1,assets);
  assert.ok(texts.every(t=>t.value===''));
  assert.equal(calls.filter(c=>c[0]===assets.reference).length,1);
  assert.deepEqual(calls.at(-1).slice(1),[1098,0,438,38,1098,0,438,38]);
});
test('clearing names and invalid dates produces warnings without validation mutation', () => {
  const fixture = {...data.initialData,idNumber:'00',firstTh:'',birth:{day:'31',month:'2',year:'1999'}};
  const before = JSON.stringify(fixture);
  assert.ok(data.dataWarnings(fixture).length >= 3);
  assert.equal(JSON.stringify(fixture),before);
});
test('lifetime skips only expiry warnings and preserves the stored date', () => {
  for (const expiry of [
    {day:'31',month:'2',year:'2024'},
    {day:'1',month:'1',year:'2000'},
    {day:'1',month:'1',year:'2569'},
    {day:'',month:'',year:''},
  ]) {
    const dated={...data.defaultData(new Date(2026,8,8)),birth:{day:'31',month:'2',year:'1996'},expiry};
    const lifetime={...dated,expiryMode:'lifetime'};
    const before=JSON.stringify(lifetime);
    assert.ok(data.dataWarnings(dated).some(w=>w.includes('หมดอายุ')));
    assert.ok(data.dataWarnings(lifetime).some(w=>w.includes('วันเกิด')));
    assert.ok(data.dataWarnings(lifetime).every(w=>!w.includes('หมดอายุ')));
    assert.equal(data.formatExpiry(lifetime,'th'),'ตลอดชีพ');
    assert.equal(data.formatExpiry(lifetime,'en'),'LIVELONG');
    assert.equal(data.formatExpiry({...lifetime,expiryMode:'date'},'en'),data.formatDate(expiry,'en'));
    assert.equal(JSON.stringify(lifetime),before);
  }
});
test('date, lifetime and cleared expiry redraw both languages at full export dimensions', () => {
  for (const scale of [1,2]) {
    const calls=[],texts=[],ctx=context(calls,texts),canvas={getContext:()=>ctx};
    const assets={reference:{},clean:{}};
    const states=[
      {...data.initialData,expiryMode:'lifetime'},
      {...data.initialData,expiryMode:'date'},
      {...data.initialData,expiryMode:'date',expiry:{day:'',month:'',year:''}},
    ];
    for (const fixture of states) {
      calls.length=0; texts.length=0;
      const warnings=renderer.drawCard(canvas,fixture,null,{zoom:1,x:50,y:50},scale,assets);
      assert.equal(canvas.width,1536*scale); assert.equal(canvas.height,1024*scale);
      assert.equal(warnings.length,0);
      assert.equal(calls[0][0],assets.clean);
      assert.deepEqual(texts.filter(t=>t.x===808).map(t=>t.value),[data.formatExpiry(fixture,'th'),data.formatExpiry(fixture,'en')]);
      assert.equal(calls.at(-1)[0],assets.reference);
    }
  }
});
test('a single nullable title maps both names without changing typed names', () => {
  const expected=[['mr','นาย','Mr.'],['mrs','นาง','Mrs.'],['miss','นางสาว','Miss'],['boy','เด็กชาย','Master'],['girl','เด็กหญิง','Miss']];
  for (const [title,th,en] of expected) {
    const fixture={...data.initialData,title};
    const before=JSON.stringify(fixture);
    assert.equal(data.fullName(fixture,'th'),`${th} กิตติพงศ์ ศรีสมบัติเอ็นซีบีดี`);
    assert.equal(data.fullName(fixture,'en'),`${en} Kittipong SrisombatNCBD`);
    assert.equal(JSON.stringify(fixture),before);
  }
  assert.equal(data.initialData.title,null);
  assert.equal(data.fullName(data.initialData,'th'),'กิตติพงศ์ ศรีสมบัติเอ็นซีบีดี');
  assert.equal(data.fullName(data.initialData,'en'),'Kittipong SrisombatNCBD');
  const onlyTitle={...data.initialData,title:'mr',firstTh:'',middleTh:'',lastTh:'',firstEn:'',middleEn:'',lastEn:''};
  assert.equal(data.fullName(onlyTitle,'th'),'นาย');
  assert.equal(data.fullName(onlyTitle,'en'),'Mr.');
});
test('canvas titles are paired and an ID-only edit leaves other text drawing unchanged', () => {
  const render=(fixture)=>{
    const texts=[],ctx=context([],texts);
    renderer.drawCard({getContext:()=>ctx},fixture,null,{zoom:1,x:50,y:50},1,{reference:{},clean:{}});
    return texts;
  };
  for (const title of [null,'mr','mrs','miss','boy','girl']) {
    const fixture={...data.initialData,title};
    const before=render(fixture),after=render({...fixture,idNumber:'310922325406'});
    assert.deepEqual(before.slice(2),after.slice(2));
    assert.equal(before[2].value,data.fullName(fixture,'th'));
    assert.equal(before[3].value,[data.titleText(title).en,fixture.firstEn,fixture.middleEn].filter(Boolean).join(' '));
    assert.equal(before[4].value,fixture.lastEn);
  }
});
