import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-preload-without-as-is-silently-ignored',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './preload-without-as-is-silently-ignored.html',
  styleUrl: './preload-without-as-is-silently-ignored.scss'
})
export class PreloadWithoutAsIsSilentlyIgnoredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'as= tells the browser the request\'s priority AND its content-type expectations',
      points: [
        'The main page\'s Common Mistake is explicit: "Without as=, the browser cannot determine the resource type, ignores the preload hint entirely, and logs a warning." The <code>as</code> value (font, script, style, image, etc.) is not just documentation — the browser actually uses it to decide the fetch\'s priority and the <code>Accept</code> header it sends.',
        'Without that information, the browser has no safe way to guess how urgently to fetch the resource or how to validate the response — so rather than fetching it wrong, it skips the preload entirely and falls back to discovering the resource normally, whenever the parser or another part of the page happens to need it.',
      ]
    },
    {
      heading: 'The failure is not silent to the DEVELOPER — just silent to the PAGE',
      points: [
        'The main page notes the browser "logs a warning" — this warning appears in the browser\'s own DevTools console, not as a JavaScript exception the page\'s own code could catch or react to. A page\'s runtime script has no way to detect that one of its own preload hints was rejected.',
        'This means the only reliable way to catch a broken preload during development is to actually open DevTools and read the console — an automated test or the page\'s own error handling will never surface it, since nothing in the page\'s execution model is disrupted by a silently-ignored resource hint.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>preload without as= is ignored</title>
    <!-- Missing as= — the browser should reject this and warn in the console -->
    <link rel="preload" href="/images/hero-demo.jpg">
    <!-- Correct: as= present -->
    <link rel="preload" href="/images/card-demo.jpg" as="image">
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) — a warning should appear for the first preload only.</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const warnings: string[] = [];

// Capture console.warn calls — this is literally the only channel a page's own
// script has for observing that a preload hint was rejected. There is no
// JS event, promise rejection, or exception for a discarded preload.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  warnings.push(args.map(String).join(' '));
  originalWarn(...args);
};

window.addEventListener('load', () => {
  setTimeout(() => {
    output.textContent =
      \`console.warn() calls captured since page load: \${warnings.length}\\n\\n\` +
      (warnings.length
        ? warnings.map((w, i) => \`  [\${i}] \${w}\`).join('\\n')
        : '(none captured in this sandbox — browsers vary in exact preload-warning wording/timing, but the underlying rule is universal: as= is mandatory.)') +
      \`\\n\\nEither way: a page's OWN script has no reliable way to detect a rejected preload\\nprogrammatically — console output is the only signal, and nothing else in the page's\\nexecution is disrupted by it.\`;
  }, 500);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The first preload above has no <code>as=</code> attribute. Predict: does removing that hint cause a JavaScript error your own script could catch with try/catch, or does it fail in a way your code has no way to detect at all?',
    hint: 'The main page describes this failure purely in terms of a browser console warning — never a thrown error, rejected promise, or fired event.',
    solution: `There is nothing a script can catch — no exception is thrown, no promise rejects, no event
fires. The only observable trace is a message in the browser's own DevTools console, which is
exactly why this class of bug tends to survive in production for a long time: automated tests and
runtime error monitoring have no visibility into a resource hint the browser silently declined to
honor. Catching it requires someone to actually open DevTools and read the console output by hand.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A preload tag with a missing or wrong <code>as=</code> value still fetches the resource, just without the priority boost.',
      reality: 'The main page is explicit: the browser "ignores the preload hint entirely" — there is no partial credit. The resource is not preloaded at all; it will only be requested later through whatever normal mechanism (an <code>&lt;img&gt;</code> tag, a CSS rule, etc.) actually needs it.'
    },
    {
      thought: 'You could detect a broken preload from application code with a try/catch around the resource load, the same way you would catch a fetch() failure.',
      reality: 'A rejected preload throws no exception and fires no error event on the page — it is invisible to the page\'s own JavaScript entirely. The console warning is a DEVTOOLS-only signal, not something the runtime exposes to scripts.'
    },
    {
      thought: 'Since the console warning is the only signal, this bug will always be caught quickly during normal development.',
      reality: 'It is easy to miss because nothing else about the page appears broken — content still renders, no functionality fails. A silently-discarded preload only costs a small performance regression, which rarely prompts anyone to go check the console.'
    },
  ];
}
