// Wire generated pages into an EXISTING hub (routes, labels, search, sidebar, nav, home card, progress total).
// Usage: node tools/phase11/wire.js <rust|qa> slug...   (idempotent: skips entries that already exist)
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const cfg = require(path.join(__dirname, process.argv[2] + '.config.js'));
const slugs = process.argv.slice(3);
const F = p => path.join(root, p);
const rd = p => fs.readFileSync(F(p), 'utf8'), wr = (p, s) => fs.writeFileSync(F(p), s);
const pascal = s => s.split(/[^a-zA-Z0-9]/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('');
const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const ins = (file, anchor, text, after = true) => {
  let s = rd(file); const i = s.indexOf(anchor); if (i < 0) throw new Error(`${file}: anchor not found: ${anchor}`);
  const at = after ? i + anchor.length : i; wr(file, s.slice(0, at) + text + s.slice(at));
};
const navEsc = s => s.replace(/&/g, '&amp;');
for (const slug of slugs) {
  const t = cfg.topics.find(x => x.slug === slug); if (!t) throw new Error('no topic ' + slug);
  const spec = require(path.join(__dirname, 'pages', cfg.key, slug + '.js'));
  const key = cfg.searchPrefix + slug, url = `/${cfg.route}/${slug}`, cls = cfg.className + pascal(slug);
  // routes: insert before the closing of the hub children block
  let r = rd('src/app/app.routes.ts');
  if (!r.includes(`components/${cfg.folder}/${slug}/${slug}'`)) {
    const start = r.indexOf(`{ path: '${cfg.route}', children: [`); if (start < 0) throw new Error('route block');
    const m2 = /\n  \]\s*\},?/g; m2.lastIndex = start; const mm = m2.exec(r); if (!mm) throw new Error('route block end'); const end = mm.index;
    r = r.slice(0, end) + `\n    { path: '${slug}', loadComponent: () => import('./components/${cfg.folder}/${slug}/${slug}').then(m => m.${cls}) },` + r.slice(end);
    wr('src/app/app.routes.ts', r);
  }
  // breadcrumb labels map
  let b = rd('src/app/components/shared/breadcrumb/breadcrumb.ts');
  const lm = `const ${cfg.constName}_LABELS: Record<string, string> = {`;
  const li = b.indexOf(lm), le = b.indexOf('\n};', li);
  if (!b.slice(li, le).includes(`'${slug}':`)) { b = b.slice(0, le) + `\n  '${slug}': ${q(t.title)},` + b.slice(le); wr('src/app/components/shared/breadcrumb/breadcrumb.ts', b); }
  // search index
  let si = rd('src/app/services/search.service.ts');
  if (!si.includes(`route: '${key}'`)) {
    const last = [...si.matchAll(new RegExp(`\\n  \\{ route: '${cfg.searchPrefix}[^\\n]*`, 'g'))].pop();
    const at = last.index + last[0].length;
    si = si.slice(0, at) + `\n  { route: '${key}', title: ${q(t.title)}, section: ${q(cfg.sectionLabel)}, difficulty: '${t.difficulty}', keywords: ${q(t.keywords)} },` + si.slice(at);
    wr('src/app/services/search.service.ts', si);
  }
  // sidebar
  let sb = rd('src/app/components/shared/page-sidebar/page-sidebar.ts');
  const sk = `'${cfg.route}/${slug}': {`;
  if (!sb.includes(sk)) {
    const idx = cfg.topics.indexOf(t);
    const near = [cfg.topics[idx - 1], cfg.topics[idx + 1]].filter(Boolean);
    const related = [{ label: `${cfg.name} Home`, route: `/${cfg.route}` }, ...near.map(n => ({ label: n.title, route: `/${cfg.route}/${n.slug}` }))];
    const D = `${cfg.constName}_DEFAULT`;
    const entry = `\n  ${sk}\n    apis: ${JSON.stringify(spec.apis || [])},\n    docs: ${D}.docs, resources: ${D}.resources,\n    related: [\n${related.map(x => `      { label: ${q(x.label)}, route: '${x.route}' },`).join('\n')}\n    ],\n    tip: ${q(spec.tip || '')},\n    gotchas: [\n${(spec.gotchas || []).map(g => `      ${q(g.replace(/`/g, ''))},`).join('\n')}\n    ],\n  },`;
    const anchor = cfg.sidebarAnchor; // a key line inside the hub's SIDEBAR_MAP block
    const ai = sb.indexOf(anchor); if (ai < 0) throw new Error('sidebar anchor');
    sb = sb.slice(0, ai) + entry.slice(1) + '\n' + sb.slice(ai);
    wr('src/app/components/shared/page-sidebar/page-sidebar.ts', sb);
  }
  // nav
  let nv = rd(cfg.navFile);
  if (!nv.includes(`routerLink="${url}"`)) {
    const link = `      <a routerLink="${url}" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">\n        <span class="nl-text">${navEsc(t.title)}</span>\n${t.reference ? '' : `        @if (p.isDone('${key}')) {<span class="nl-done">✓</span>}\n        @if (d('${key}'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}\n`}      </a>\n`;
    const gl = `<p class="nav-group-label">${navEsc(t.group)}</p>\n`;
    const gi = nv.indexOf(gl);
    if (gi >= 0) { const ge = nv.indexOf('\n    </div>\n', gi) + 1; nv = nv.slice(0, ge) + link + nv.slice(ge); }
    else { const end = nv.indexOf('  `,\n  styles'); nv = nv.slice(0, end) + `\n    <div class="nav-group">\n      ${gl}${link}    </div>\n` + nv.slice(end); }
    wr(cfg.navFile, nv);
  }
  // home card
  let h = rd(cfg.homeFile);
  const re = new RegExp(`(route: '${url.replace(/\//g, '\\/')}', badge: '[^']*', available: )false`);
  if (re.test(h)) { h = h.replace(re, '$1true'); wr(cfg.homeFile, h); }
  else if (!h.includes(`route: '${url}'`)) throw new Error('home card missing for ' + url);
}
// progress total = number of non-reference topics that have a component on disk
const done = cfg.topics.filter(t => !t.reference && fs.existsSync(F(`src/app/components/${cfg.folder}/${t.slug}/${t.slug}.ts`))).length;
let pr = rd('src/app/services/progress.service.ts');
pr = pr.replace(new RegExp(`readonly ${cfg.progressKey}Total\\s*= \\d+;`), m => m.replace(/\d+;$/, done + ';'));
wr('src/app/services/progress.service.ts', pr);
console.log('wired', slugs.join(', '), `| ${cfg.progressKey}Total =`, done);
