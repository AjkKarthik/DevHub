import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './type-module-is-deferred-by-default.html',
  styleUrl: './type-module-is-deferred-by-default.scss'
})
export class TypeModuleIsDeferredByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A <script type="module"> with NO defer attribute at all still behaves exactly like a deferred script',
      points: [
        'The main page states this as a fact — module scripts are deferred by default. This is directly verifiable using the exact same proof technique as a plain vs. defer comparison: check <code>document.readyState</code> and how much of the DOM exists at the moment the script runs.',
        'Measured directly: a <code>&lt;script type="module" src="..."&gt;</code> placed in <code>&lt;head&gt;</code>, with no <code>defer</code> attribute anywhere on it, still sees a FULLY parsed document — every element present, <code>readyState: "interactive"</code> — exactly matching a plain deferred classic script, and completely unlike a blocking classic script placed at the same spot.',
      ]
    },
    {
      heading: 'Adding defer to a module script is redundant, not wrong — and this only applies to EXTERNAL module scripts',
      points: [
        'Since modules are deferred implicitly, writing <code>&lt;script type="module" defer src="..."&gt;</code> is not an error, but the <code>defer</code> attribute adds nothing — the behaviour is identical either way.',
        'This default-deferred behaviour is specific to scripts with a <code>src</code> attribute (external modules). An INLINE <code>&lt;script type="module"&gt;...&lt;/script&gt;</code> (no src) still executes at its position in the document once its own dependency graph is ready — but since it has no separate network fetch to wait for, this distinction rarely matters in practice for a simple inline module.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>type=module is deferred by default</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="output"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Same technique as the previous subtopic: build a fresh iframe document so we
// can observe genuine parser state, this time comparing a plain classic script
// against a type="module" script that has NO defer attribute of its own.
const log: any[] = [];
(window as any).__log = log;

const iframe = document.createElement('iframe');
iframe.style.cssText = 'width:1px;height:1px;';

const manyPs = Array.from({ length: 15 }, (_, i) => \`<p>item \${i}</p>\`).join('');

const blockingScript = encodeURIComponent(
  "parent.__log.push({name:'plain classic script', readyState: document.readyState, bodyChildCount: document.body.children.length});"
);
const moduleScript = encodeURIComponent(
  "parent.__log.push({name:'type=module (NO defer attribute)', readyState: document.readyState, bodyChildCount: document.body.children.length});"
);

iframe.srcdoc = \`<!doctype html>
<html><head>
<script type="module" src="data:text/javascript,\${moduleScript}"></scr\` + \`ipt>
</head><body>
<scr\` + \`ipt src="data:text/javascript,\${blockingScript}"></scr\` + \`ipt>
\${manyPs}
</body></html>\`;

document.querySelector('#output')!.appendChild(iframe);

setTimeout(() => {
  console.log('execution order and document state at each point:');
  for (const entry of log) {
    console.log(' -', entry.name, '| readyState:', entry.readyState, '| body children seen:', entry.bodyChildCount);
  }
  console.log('the module script has NO defer attribute, yet still sees the FULLY parsed document — deferred by default.');
}, 800);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer migrates an app entry point from <code>&lt;script defer src="app.js"&gt;&lt;/script&gt;</code> to ES modules: <code>&lt;script type="module" src="app.mjs"&gt;&lt;/script&gt;</code>, and deliberately drops the <code>defer</code> attribute since "modules don\'t need it". A teammate reviewing the change flags it, worried the script might now block the parser like an old-fashioned plain script. Who is right?',
    hint: 'Ask what determines deferred behaviour for a module script — is it the presence of the defer keyword, or the type="module" attribute itself?',
    solution: 'The developer who dropped defer is correct — module scripts are deferred by default per the HTML specification, with or without the defer attribute present. Removing defer from a type="module" script does not change its loading behaviour at all; it will still download in parallel with parsing and execute only after the document is fully parsed, exactly like a script with defer. The teammate\'s concern would be valid for a PLAIN classic script (no type="module", no defer) but does not apply here.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'type="module" scripts need an explicit defer attribute to avoid blocking the parser, the same way a plain classic script would without one.',
      reality: 'Deferred behaviour is automatic for any external module script regardless of the defer attribute — this subtopic\'s demo shows a module script with NO defer attribute still seeing a fully parsed document, identical to an explicitly deferred classic script.'
    },
    {
      thought: 'Since type="module" and defer produce the same behaviour, writing type="module" defer together is a mistake or a contradiction that browsers might handle inconsistently.',
      reality: 'It is simply redundant, not a conflict — defer on a module script has no additional effect since the module is already deferred by the type="module" mechanism itself; browsers handle it identically to type="module" alone.'
    },
    {
      thought: 'This default-deferred behaviour applies to ALL <script type="module"> tags, including inline ones with no src attribute.',
      reality: 'The deferred-by-default guarantee is specifically about external scripts (with a src) that need a separate network fetch — an inline module script has no fetch to defer past, so it runs at its position in the document once its dependencies (if any, via import) are ready, which is a related but distinct mechanism.'
    }
  ];
}
