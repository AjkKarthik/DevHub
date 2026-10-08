// Type-strip and RUN TypeScript code tabs / challenge solution of a spec (QA hub).
// Usage: node tools/phase11/tscheck.js <hub> <slug>    Tabs with run:false (or non-TS) are skipped.
const path = require('path'), vm = require('vm'), ts = require(path.resolve(__dirname, '../../node_modules/typescript'));
const spec = require(path.join(__dirname, 'pages', process.argv[2], process.argv[3] + '.js'));
const items = [];
(spec.codeTabs || []).forEach(t => { if (t.language === 'typescript' && t.run !== false) items.push([t.label, t.code]); });
if (spec.challenge && spec.challenge.run !== false) items.push(['challenge solution', spec.challenge.solution]);
let fail = 0;
for (const [label, code] of items) {
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const out = [];
  const ctx = vm.createContext({ console: { log: (...a) => out.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')), table: x => out.push(JSON.stringify(x)) }, require, module: {}, exports: {}, setTimeout, Promise, Date, Math, JSON });
  try { vm.runInContext(js, ctx, { timeout: 10000 }); console.log(`OK   ${label}\n` + out.map(l => '  ' + l).join('\n')); }
  catch (e) { fail++; console.log(`FAIL ${label}: ${e.message}`); }
}
console.log(fail ? fail + ' FAILED' : 'ALL OK', `(${items.length})`);
