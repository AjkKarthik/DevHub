// Compile (and optionally run) every Rust code tab + challenge code in a Rust page spec.
// Usage: node tools/phase11/rscheck.js <slug> [--run]
// Needs a cargo project (with tokio/axum/serde/clap/thiserror/anyhow/proptest deps) at $RSCHECK.
// Tab flags (stripped by page.js): check:false = skip, run:false = compile only, test:true = cargo test.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const proj = process.env.RSCHECK;
const slug = process.argv[2], run = process.argv.includes('--run');
const spec = require(path.join(__dirname, 'pages/rust', slug + '.js'));
const bins = path.join(proj, 'src/bin'); fs.rmSync(bins, { recursive: true, force: true }); fs.mkdirSync(bins, { recursive: true });
const items = [];
(spec.codeTabs || []).forEach((t, i) => { if (t.language === 'rust' && t.check !== false) items.push({ name: `t${i}`, label: t.label, code: t.code, run: t.run !== false, test: !!t.test }); });
if (spec.challenge && spec.challenge.language === 'rust') {
  if (spec.challenge.checkStarter !== false) items.push({ name: 'starter', label: 'starter', code: spec.challenge.starterCode, run: false, test: false });
  items.push({ name: 'solution', label: 'solution', code: spec.challenge.solution, run: true, test: !!spec.challenge.test });
}
(spec.mistakes || []).forEach((m, i) => {
  if (m.checkWrong) items.push({ name: `mw${i}`, label: 'mistake wrong: ' + m.title, code: m.prelude ? m.prelude + '\n' + m.wrong : m.wrong, run: false, expectFail: true, wrapFn: m.wrapFn });
  if (m.checkRight) items.push({ name: `mr${i}`, label: 'mistake right: ' + m.title, code: m.prelude ? m.prelude + '\n' + m.right : m.right, run: false, wrapFn: m.wrapFn });
});
let fail = 0;
for (const it of items) {
  let code = it.wrapFn ? `fn __snippet() ${it.wrapFn === true ? '' : it.wrapFn}{\n${it.code}\n}` : it.code;
  if (!/fn main\s*\(|criterion_main!/.test(code)) code += '\n#[allow(dead_code)]\nfn main() {}\n';
  const name = slug.replace(/-/g, '_') + '_' + it.name;
  fs.writeFileSync(path.join(bins, name + '.rs'), '#![allow(dead_code, unused_variables, unused_imports, unused_mut)]\n' + code);
  try {
    const cmd = it.test ? `cargo test -q --bin ${name} 2>&1` : `cargo build -q --bin ${name} 2>&1`;
    const out = execSync(cmd, { cwd: proj, encoding: 'utf8', timeout: 300000 });
    if (it.expectFail) { fail++; console.log(`FAIL ${it.label}: expected a compile error but it compiled`); continue; }
    console.log(`OK   ${it.label}${out.trim() ? '\n' + out.trim().split('\n').slice(-15).join('\n') : ''}`);
    if (run && it.run && !it.test) {
      const r = execSync(`timeout 20 ./target/debug/${name} 2>&1 || true`, { cwd: proj, encoding: 'utf8' });
      console.log('---- output ----\n' + r.trim().split('\n').slice(0, 40).join('\n') + '\n----------------');
    }
  } catch (e) {
    if (it.expectFail) { const m = (e.stdout || '').match(/error(\[E\d+\])?: [^\n]*/); console.log(`OK   ${it.label} -> ${m ? m[0] : 'compile error'}`); continue; }
    fail++; console.log(`FAIL ${it.label}\n${(e.stdout || e.message).split('\n').slice(0, 40).join('\n')}`); }
}
console.log(fail ? `${fail} FAILED` : 'ALL OK', `(${items.length} items)`);
process.exit(fail ? 1 : 0);
