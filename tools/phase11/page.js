// Phase 11 topic/reference page generator.
// Usage: node tools/phase11/page.js <rust|qa> [slug ...]   (no slugs = every spec in tools/phase11/pages/<hub>/)
// Spec shape (module.exports): { slug, subtitle, readingTime, since?, quickRef, theory, codeTabs,
//   mistakes?, challenge?, quiz?, qna, revision?, apis?, tip?, gotchas?, prerequisites? }
// Title, difficulty and group come from the hub config. Strings are serialized with JSON.stringify,
// so specs never need TS/template escaping. Static HTML text is entity-escaped here.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const cfg = require(path.join(__dirname, process.argv[2] + '.config.js'));
const writeDataFile = require('./datafile');
const dir = path.join(__dirname, 'pages', cfg.key);
const want = process.argv.slice(3);
const pascal = s => s.split(/[^a-zA-Z0-9]/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('');
const esc = s => s.replace(/&/g, '&amp;').replace(/@/g, '&#64;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const J = v => JSON.stringify(v, null, 2).replace(/\n/g, '\n  ');
const topics = cfg.topics, P = cfg.prefix;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).filter(f => !want.length || want.includes(f.replace(/\.js$/, '')));
for (const f of files) {
  const s = require(path.join(dir, f));
  const t = topics.find(x => x.slug === s.slug);
  if (!t) throw new Error('slug not in config: ' + s.slug);
  const ref = !!t.reference;
  // Prose convention in specs: wrap inline code in backticks.
  // innerHTML-bound fields (theory points, QnA answers, revision card) get HTML-escaped and
  // backticks turned into <code>; plain-interpolation fields just drop the backticks.
  const html = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`([^`]+)`/g, '<code>$1</code>');
  const plain = x => x.replace(/`([^`]+)`/g, '$1');
  s.theory = s.theory.map(th => ({ heading: plain(th.heading), points: th.points.map(html) }));
  s.qna = s.qna.map(q => ({ q: plain(q.q), a: html(q.a) }));
  if (s.revision) s.revision = { oneLiner: html(s.revision.oneLiner), mustKnow: s.revision.mustKnow.map(html), interviewFocus: s.revision.interviewFocus.map(html) };
  s.quickRef = s.quickRef.map(q => Object.assign({}, q, { desc: plain(q.desc) }));
  if (s.quiz) s.quiz = s.quiz.map(q => ({ q: plain(q.q), options: q.options.map(plain), answer: q.answer, explanation: plain(q.explanation) }));
  if (s.mistakes) s.mistakes = s.mistakes.map(m => ({ title: plain(m.title), wrong: m.wrong, right: m.right, explanation: plain(m.explanation) }));
  if (s.codeTabs) s.codeTabs = s.codeTabs.map(({ label, code, language }) => language ? { label, code, language } : { label, code });
  if (s.challenge) { const { checkStarter, test, run, ...c } = s.challenge; s.challenge = c; }
  if (s.challenge) s.challenge = Object.assign({}, s.challenge, { description: plain(s.challenge.description), hints: (s.challenge.hints || []).map(plain) });
  const idx = topics.indexOf(t);
  const next = topics.slice(idx + 1).find(x => !x.reference);
  const cls = cfg.className + pascal(t.slug);
  const out = path.join(root, 'src/app/components', cfg.folder, t.slug);
  fs.mkdirSync(out, { recursive: true });
  // validation
  const need = ref ? ['quickRef', 'theory', 'qna'] : ['quickRef', 'theory', 'codeTabs', 'mistakes', 'challenge', 'quiz', 'qna', 'revision'];
  for (const n of need) if (!s[n]) throw new Error(`${s.slug}: missing ${n}`);
  (s.quiz || []).forEach((q, i) => { if (!(q.answer >= 0 && q.answer < q.options.length)) throw new Error(`${s.slug}: quiz ${i} answer out of range`); });
  if (s.challenge && s.challenge.difficulty) throw new Error('Challenge must not have difficulty');
  const imports = [
    ['PageMetaComponent', null, 'page-meta/page-meta'],
    s.prerequisites && ['PrerequisitesComponent', 'Prerequisite', 'prerequisites/prerequisites'],
    ['QuickRefComponent', 'QuickRefItem', 'quick-ref/quick-ref'],
    ['TheoryBlockComponent', 'TheoryPoint', 'theory-block/theory-block'],
    s.codeTabs && ['CodeBlockComponent', 'CodeTab', 'code-block/code-block'],
    s.mistakes && ['CommonMistakesComponent', 'CommonMistake', 'common-mistakes/common-mistakes'],
    s.challenge && ['ChallengeBlockComponent', 'Challenge', 'challenge-block/challenge-block'],
    s.quiz && ['QuizBlockComponent', 'QuizQuestion', 'quiz-block/quiz-block'],
    ['QnaBlockComponent', 'QnaItem', 'qna-block/qna-block'],
    !ref && ['RevisionCardComponent', 'RevisionSummary', 'revision-card/revision-card'],
    !ref && ['PageCompleteComponent', null, 'page-complete/page-complete'],
  ].filter(Boolean);
  const fields = [];
  if (s.prerequisites) fields.push(`  prerequisites: Prerequisite[] = ${J(s.prerequisites)};`);
  fields.push(`  quickRef: QuickRefItem[] = ${J(s.quickRef)};`);
  fields.push(`  theory: TheoryPoint[] = ${J(s.theory)};`);
  if (s.codeTabs) fields.push(`  codeTabs: CodeTab[] = ${J(s.codeTabs)};`);
  if (s.mistakes) fields.push(`  mistakes: CommonMistake[] = ${J(s.mistakes)};`);
  if (s.challenge) fields.push(`  challenge: Challenge = ${J(s.challenge)};`);
  if (s.quiz) fields.push(`  quiz: QuizQuestion[] = ${J(s.quiz)};`);
  fields.push(`  qna: QnaItem[] = ${J(s.qna)};`);
  if (!ref) fields.push(`  revision: RevisionSummary = ${J(s.revision)};`);
  const ts = `import { Component } from '@angular/core';
${imports.map(([c, ty, p]) => `import { ${ty ? c + ', ' + ty : c} } from '../../../shared/${p}';`).join('\n')}

@Component({
  selector: 'app-${P}-${t.slug}',
  standalone: true,
  imports: [${imports.map(i => i[0]).join(', ')}],
  templateUrl: './${t.slug}.html',
  styleUrl: './${t.slug}.scss'
})
export class ${cls} {
  readingTime = ${s.readingTime || 15};
  difficulty: 'beginner' | 'intermediate' | 'advanced' = '${t.difficulty}';
  since = ${JSON.stringify(s.since || cfg.since)};
${ref ? '' : `  route = '${cfg.searchPrefix}${t.slug}';
  nextRoute = '${next ? `/${cfg.route}/${next.slug}` : `/${cfg.route}`}';
  nextLabel = ${JSON.stringify(next ? next.title : cfg.name + ' Home')};
`}
${fields.join('\n\n')}
}
`;
  const page = `<div class="${P}-page">
  <div class="page-header-icon ${P}-icon">${cfg.icon}</div>
  <h1 class="page-title">${esc(t.title)}</h1>
  <p class="page-subtitle">${esc(s.subtitle)}</p>
  <app-page-meta [readingTime]="readingTime" [difficulty]="difficulty" [since]="since" tech="${cfg.tech}" />
${s.prerequisites ? '  <app-prerequisites [items]="prerequisites" />\n' : ''}  <app-quick-ref [items]="quickRef" />
  <app-theory-block [sections]="theory" />
${s.codeTabs ? `  <section class="${P}-section"><h2>${ref ? 'Reference Examples' : 'Code Examples'}</h2><app-code-block [tabs]="codeTabs" /></section>\n` : ''}${s.mistakes ? '  <app-common-mistakes [items]="mistakes" />\n' : ''}${s.challenge ? '  <app-challenge-block [item]="challenge" />\n' : ''}${s.quiz ? '  <app-quiz-block [items]="quiz" />\n' : ''}  <app-qna-block [items]="qna" />
${ref ? '' : '  <app-revision-card [summary]="revision" />\n  <app-page-complete [route]="route" [nextRoute]="nextRoute" [nextLabel]="nextLabel" />\n'}</div>
`;
  const scss = `$accent: ${cfg.accent};
$tint: ${cfg.tint};

.${P}-page { max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
.page-header-icon.${P}-icon { background: $accent; color: #fff; font-size: 1.25rem; font-weight: 800; }
.page-subtitle code { background: $tint; color: $accent; padding: 1px 5px; border-radius: 4px; }
.${P}-section { margin-bottom: 2rem; h2 { font-size: 1.4rem; font-weight: 700; color: $accent; margin-bottom: 1rem; } }

:host-context(body.dark) {
  .page-header-icon.${P}-icon { background: ${cfg.darkText}; color: ${cfg.darkBg}; }
  .page-subtitle code { background: ${cfg.darkBg}; color: ${cfg.darkText}; }
  .${P}-section h2 { color: ${cfg.darkText}; }
}
`;
  const scssDev = `$accent: ${cfg.accent};
$tint: ${cfg.tint};

.${P}-page { max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
.${P}-section { margin-bottom: 2rem; h2 { font-size: 1.4rem; font-weight: 700; color: $accent; margin-bottom: 1rem; } }
:host-context(body.dark) { .${P}-section h2 { color: ${cfg.darkText}; } }
`;
  fs.writeFileSync(path.join(out, t.slug + '.ts'), ts);
  fs.writeFileSync(path.join(out, t.slug + '.html'), page);
  fs.writeFileSync(path.join(out, t.slug + '.scss'), cfg.devStyle ? scssDev : scss);
  console.log('page', cfg.key, t.slug);
}
if (!cfg.noDataFile) writeDataFile(cfg, root);
