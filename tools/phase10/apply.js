// Applies wiring from spec.wiring.json. Usage: node apply.js spec.js   (run from repo root)
const fs = require('fs'), path = require('path');
const specPath = path.resolve(process.argv[2]);
const spec = require(specPath); const H = spec.hub;
const W = JSON.parse(fs.readFileSync(specPath + '.wiring.json', 'utf8'));
const rd = f => fs.readFileSync(f, 'utf8'); const wr = (f, s) => fs.writeFileSync(f, s);
const fail = m => { throw new Error(m); };
// 0 pre-check: refuse before touching any file
{ const k = H.subtopicsKey; if (new RegExp(`^\\s*'?${k}'?:`, 'm').test(rd('src/app/data/subtopics.ts'))) fail('subtopics key exists ' + k + ' (set a hub-prefixed subtopicsKey)'); }
// 1 routes (skipped if already converted)
if (!rd('src/app/app.routes.ts').includes(`${H.routeImportBase}/${H.topicSlug}/subtopics/`)) { const f = 'src/app/app.routes.ts'; let s = rd(f); const lines = s.split('\n');
  const hubIdx = lines.findIndex(l => l.includes(`path: '${H.hubRoutePath}'`)); if (hubIdx < 0) fail('hub route');
  const re = new RegExp(`\\{ path: '${H.topicSlug}',\\s*loadComponent: (.*?) \\},\\s*$`);
  let i = hubIdx; for (; i < lines.length; i++) if (re.test(lines[i])) break; if (i >= lines.length) fail('topic route');
  const m = lines[i].match(re); const ind = lines[i].match(/^\s*/)[0];
  lines.splice(i, 1, `${ind}{ path: '${H.topicSlug}', children: [`, `${ind}  { path: '', loadComponent: ${m[1]} },`, ...W.routes.map(r => ind + r.trimStart().replace(/^/, '  ')), `${ind}] },`);
  wr(f, lines.join('\n')); }
// 2 subtopics map
{ const f = 'src/app/data/subtopics.ts'; let s = rd(f); const k = H.subtopicsKey;
  if (new RegExp(`^\\s*'?${k}'?:`, 'm').test(s)) fail('subtopics key exists ' + k);
  const end = s.lastIndexOf('};'); s = s.slice(0, end) + `  '${k}': [\n${W.subtopics.join('\n')}\n  ],\n` + s.slice(end); wr(f, s); }
// 3 breadcrumb labels
{ const f = 'src/app/components/shared/breadcrumb/breadcrumb.ts'; const lines = rd(f).split('\n');
  const mi = lines.findIndex(l => l.includes(`const ${H.labelsMap}`)); if (mi < 0) fail('labels map');
  let i = mi; for (; i < lines.length; i++) if (lines[i].match(new RegExp(`^\\s*'${H.topicSlug}':`))) break; if (i >= lines.length || lines.slice(mi, i).some(l => /^};/.test(l))) fail('label base');
  lines.splice(i + 1, 0, ...W.labels); wr(f, lines.join('\n')); }
// 4 sidebar
{ const f = 'src/app/components/shared/page-sidebar/page-sidebar.ts'; const lines = rd(f).split('\n');
  let i = lines.findIndex(l => l.startsWith(`  '${H.sidebarBase}/${H.topicSlug}': {`)); if (i < 0) fail('sidebar base');
  for (; i < lines.length; i++) if (lines[i] === '  },') break;
  lines.splice(i + 1, 0, ...W.sidebar); wr(f, lines.join('\n')); }
// 5 search
{ const f = 'src/app/services/search.service.ts'; const lines = rd(f).split('\n');
  const i = lines.findIndex(l => l.includes(`{ route: '${H.searchPrefix}${H.topicSlug}',`)); if (i < 0) fail('search base');
  lines.splice(i + 1, 0, ...W.search); wr(f, lines.join('\n')); }
// 6 nav
{ const f = H.navFile; const lines = rd(f).split('\n'); const k = H.subtopicsKey;
  const i = lines.findIndex(l => l.includes(`routerLink="${H.topicRoute}"`)); if (i < 0) fail('nav link');
  const ln = lines[i]; if (!ln.trimEnd().endsWith('</a>')) fail('nav link not single line');
  const ind = ln.match(/^\s*/)[0]; const v = k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()) + 'Subs';
  const toggle = `@if (subtopicsOf('${k}'); as ${v}) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('${k}', $event)">{{ isSubtopicsExpanded('${k}') ? '▾' : '▸' }}</button>}`;
  const a = ln.trimEnd().replace(/<\/a>$/, toggle + '</a>');
  lines.splice(i, 1, a, `${ind}@if (subtopicsOf('${k}'); as ${v}) {`, `${ind}  @if (isSubtopicsExpanded('${k}')) {`, `${ind}    <div class="nav-subtopics">`,
    `${ind}      @for (sub of ${v}; track sub.route) {`, `${ind}        <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>`,
    `${ind}      }`, `${ind}    </div>`, `${ind}  }`, `${ind}}`);
  wr(f, lines.join('\n')); }
console.log('wired', H.topicSlug);
