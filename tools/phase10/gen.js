// Generic Phase 10 subtopic generator. Usage: node gen.js spec.js
const fs = require('fs'), path = require('path');
const spec = require(path.resolve(process.argv[2]));
const H = spec.hub; // { root, prefix, icon, accent, tint, darkAccent, darkBg, sectionBorder, tech, topicSlug, topicLabel, topicRoute, selPrefix }
const J = (v) => JSON.stringify(v, null, 2).replace(/\n/g, '\n  ');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/@/g, '&#64;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => { if (/["']/.test(s)) throw new Error('quote in label: ' + s); return s; };
spec.subs.forEach((s, i) => {
  const prev = spec.subs[i - 1], next = spec.subs[i + 1];
  const dir = path.join(H.root, H.topicSlug, 'subtopics', s.folder);
  fs.mkdirSync(dir, { recursive: true });
  const ts = `import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-${H.selPrefix}-${s.folder}',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './${s.folder}.html',
  styleUrl: './${s.folder}.scss'
})
export class ${s.cls}Subtopic {
  theory: TheoryPoint[] = ${J(s.theory)};

  codeTabs: CodeTab[] = ${J(s.codeTabs)};

  exercise: TryItExercise = ${J(s.exercise)};

  misconceptions: Misconception[] = ${J(s.misconceptions)};
}
`;
  const nav = (k, o) => o ? `\n    [${k}]="{ label: '${attr(o.title)}', route: '${H.topicRoute}/${o.route}' }"` : '';
  const html = `<div class="${H.prefix}-page subtopic-page">
  <app-subtopic-eyebrow topicLabel="${attr(H.topicLabel)}" topicRoute="${H.topicRoute}"
    subtopicLabel="${attr(s.title)}" />
  <div class="page-header-icon ${H.prefix}-icon">${H.icon}</div>
  <h1 class="page-title">${esc(s.title)}</h1>
  <p class="page-subtitle">${esc(s.subtitle)}</p>
  <app-page-meta [readingTime]="${s.reading || 6}" difficulty="${s.difficulty || 'intermediate'}" since="${H.since}" tech="${H.tech}" />

  <app-theory-block [sections]="theory" />

  <section class="${H.prefix}-section">
    <h2>Code Examples</h2>
    <app-code-block [tabs]="codeTabs" />
  </section>

  <app-try-it [exercise]="exercise" />
  <app-misconceptions [items]="misconceptions" />

  <section class="${H.prefix}-section">
    <h2>Where this fits</h2>
    <p>${esc(s.fits)}</p>
  </section>

  <app-subtopic-nav topicLabel="${attr(H.topicLabel)}" topicRoute="${H.topicRoute}"${nav('prev', prev)}${nav('next', next)} />
</div>
`;
  fs.writeFileSync(path.join(dir, s.folder + '.ts'), ts);
  fs.writeFileSync(path.join(dir, s.folder + '.html'), html);
  fs.writeFileSync(path.join(dir, s.folder + '.scss'), H.scss);
});
// print wiring snippets
const out = { routes: [], subtopics: [], labels: [], sidebar: [], search: [] };
for (const s of spec.subs) {
  const rel = `./components/${H.routeImportBase}/${H.topicSlug}/subtopics/${s.folder}/${s.folder}`;
  out.routes.push(`        { path: '${s.route}', loadComponent: () => import('${rel}').then(m => m.${s.cls}Subtopic) },`);
  out.subtopics.push(`    { label: ${JSON.stringify(s.title)}, route: '${H.topicRoute}/${s.route}' },`);
  out.labels.push(`  ${JSON.stringify(H.topicSlug + '/' + s.route)}: ${JSON.stringify(s.title)},`);
  out.search.push(`  { route: ${JSON.stringify(H.searchPrefix + H.topicSlug + '/' + s.route)}, title: ${JSON.stringify(s.title)}, section: ${JSON.stringify(H.searchSection)}, difficulty: '${s.difficulty || 'intermediate'}', keywords: ${JSON.stringify(s.keywords)} },`);
  const related = [];
  const idx = spec.subs.indexOf(s);
  if (spec.subs[idx - 1]) related.push(`{ label: ${JSON.stringify(spec.subs[idx - 1].title)}, route: '${H.topicRoute}/${spec.subs[idx - 1].route}' }`);
  if (spec.subs[idx + 1]) related.push(`{ label: ${JSON.stringify(spec.subs[idx + 1].title)}, route: '${H.topicRoute}/${spec.subs[idx + 1].route}' }`);
  related.push(`{ label: ${JSON.stringify(H.topicLabel + ' (overview)')}, route: '${H.topicRoute}' }`);
  out.sidebar.push(`  ${JSON.stringify(H.sidebarBase + '/' + H.topicSlug + '/' + s.route)}: {
    apis: ${H.defaultConst}.apis, docs: ${H.defaultConst}.docs, resources: ${H.defaultConst}.resources,
    related: [
      ${related.join(',\n      ')},
    ],
    tip: ${JSON.stringify(s.tip)},
    gotchas: ${JSON.stringify(s.gotchas)},
  },`);
}
fs.writeFileSync(path.resolve(process.argv[2]) + '.wiring.json', JSON.stringify(out, null, 1));
console.log('ok', spec.subs.length);
