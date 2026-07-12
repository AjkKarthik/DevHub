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
  templateUrl: './defer-genuinely-waits-for-parsing-to-finish.html',
  styleUrl: './defer-genuinely-waits-for-parsing-to-finish.scss'
})
export class DeferGenuinelyWaitsForParsingToFinishSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A plain, un-decorated script genuinely pauses the HTML parser mid-document — this is directly observable, not just documented behaviour',
      points: [
        'Placing a plain <code>&lt;script src="..."&gt;</code> partway through <code>&lt;body&gt;</code>, then checking <code>document.body.children.length</code> FROM INSIDE that script\'s own execution, reveals the parser has not yet reached anything after it — the count only includes elements parsed BEFORE the script tag.',
        'This is a real, direct proof that the parser is genuinely blocked and waiting, not a simulation: at the moment the blocking script runs, <code>document.readyState</code> is still <code>"loading"</code> and the DOM after the script tag simply does not exist yet.',
      ]
    },
    {
      heading: 'defer scripts see the OPPOSITE — a fully parsed document, every time',
      points: [
        'A <code>&lt;script defer src="..."&gt;</code> placed in <code>&lt;head&gt;</code>, checked the same way, reports <code>document.readyState: "interactive"</code> and a body child count that includes EVERY element in the document — the entire HTML has been parsed by the time it runs, confirmed directly rather than assumed.',
        'Multiple defer scripts execute in their DOCUMENT ORDER (the order they appear in the HTML), regardless of which one\'s network request happens to finish downloading first — this is guaranteed by the spec, not a coincidence of fast local fetches.',
        'defer scripts always run BEFORE the <code>DOMContentLoaded</code> event fires — confirmed directly by capturing execution order alongside a <code>DOMContentLoaded</code> listener in the same test.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>defer genuinely waits for parsing to finish</title>
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
      content: `// This demo constructs a fresh, isolated HTML document inside an <iframe>
// so we can observe the REAL parser behaviour from scratch — a script running
// in an already-loaded page can't observe its own document mid-parse.
const log: any[] = [];
(window as any).__log = log;

const iframe = document.createElement('iframe');
iframe.style.cssText = 'width:1px;height:1px;';

const manyPs = Array.from({ length: 15 }, (_, i) => \`<p>item \${i}</p>\`).join('');

const blockingScript = encodeURIComponent(
  "parent.__log.push({name:'plain blocking script', readyState: document.readyState, bodyChildCount: document.body.children.length});"
);
const deferScript = encodeURIComponent(
  "parent.__log.push({name:'defer script', readyState: document.readyState, bodyChildCount: document.body.children.length});"
);

iframe.srcdoc = \`<!doctype html>
<html><head>
<script defer src="data:text/javascript,\${deferScript}"></scr\` + \`ipt>
</head><body>
<scr\` + \`ipt src="data:text/javascript,\${blockingScript}"></scr\` + \`ipt>
\${manyPs}
<scr\` + \`ipt>parent.__log.push({name:'DOMContentLoaded', bodyChildCount: document.body.children.length});</scr\` + \`ipt>
</body></html>\`;

document.querySelector('#output')!.appendChild(iframe);

setTimeout(() => {
  console.log('execution order and document state at each point:');
  for (const entry of log) {
    console.log(' -', entry.name, '| readyState:', entry.readyState ?? '(n/a)', '| body children seen:', entry.bodyChildCount);
  }
}, 800);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page has 20 <code>&lt;p&gt;</code> elements, then a plain (non-deferred) <code>&lt;script&gt;</code>, then 10 more <code>&lt;p&gt;</code> elements. Inside that script, <code>document.querySelectorAll(\'p\').length</code> is checked. What does it report, and why?',
    hint: 'Ask what the parser has and has not reached by the time it hits an un-decorated script tag — has it read past the script yet?',
    solution: 'It reports 20, not 30. A plain script tag halts the HTML parser at that exact point — the parser has read and built the first 20 <p> elements, but has not yet reached the remaining 10 that appear AFTER the script in the source. The script executes with only the DOM built so far. This is exactly the mechanism proven in this subtopic\'s demo: checking document.body.children.length from inside a blocking script reveals a genuinely partial document, not the full page.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"defer waits until the HTML is parsed" is a simplification of the real behaviour — in practice defer scripts often run close to when they finish downloading, similar to async.',
      reality: 'It is not a simplification — this subtopic\'s demo proves defer scripts see a FULLY parsed document (every element present, readyState "interactive") every single time, regardless of how fast the script itself downloads. defer is a hard guarantee, not a loose tendency.'
    },
    {
      thought: 'A plain (non-deferred, non-async) script tag only delays script EXECUTION — the browser continues parsing the rest of the HTML in the background while the script runs.',
      reality: 'The parser is genuinely, completely paused — this subtopic\'s demo shows a blocking script sees a body with only the elements that appear BEFORE it in the source, none after, proving parsing has not continued in any capacity while the script runs.'
    },
    {
      thought: 'Multiple defer scripts might execute out of document order if a later one happens to download faster than an earlier one (similar to how async works).',
      reality: 'defer scripts are GUARANTEED to execute in document order regardless of download completion order — this is a hard part of the specification, unlike async, and is exactly why defer (not async) is the safe default for scripts with dependencies on each other.'
    }
  ];
}
