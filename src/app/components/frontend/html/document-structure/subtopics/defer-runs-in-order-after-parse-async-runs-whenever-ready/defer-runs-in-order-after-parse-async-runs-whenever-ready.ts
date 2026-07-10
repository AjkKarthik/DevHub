import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-defer-vs-async-order-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './defer-runs-in-order-after-parse-async-runs-whenever-ready.html',
  styleUrl: './defer-runs-in-order-after-parse-async-runs-whenever-ready.scss',
})
export class ScriptDeferVsAsyncExecutionOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Claim, Proven With Real Script Tags and Timestamps',
      points: [
        'The main page states the rule directly: "<code>defer</code> runs scripts after HTML parsing completes, preserving document order. <code>async</code> runs each script as soon as it downloads, ignoring order." This subtopic loads two DEFERRED scripts and one ASYNC script — with the async one deliberately given the SMALLEST file (so it downloads fastest) — and logs each one\'s execution time relative to the moment HTML parsing actually finishes.',
        'This is directly observable in a real browser, not just a documented rule: <code>defer</code> scripts always execute AFTER the HTML document has been fully parsed (right around <code>DOMContentLoaded</code>), and multiple <code>defer</code> scripts always run in the exact order they appear in the markup — but an <code>async</code> script can execute at ANY point, including possibly before parsing even finishes, entirely dictated by how fast its own file downloads.',
      ],
    },
    {
      heading: 'Why This Ordering Guarantee Exists (or Doesn\'t)',
      points: [
        'A plain <code>&lt;script&gt;</code> tag with no attributes blocks the HTML parser entirely — the parser must stop, fetch the script, execute it, and only then resume parsing the rest of the document. Both <code>defer</code> and <code>async</code> exist specifically to let the BROWSER keep parsing HTML while the script downloads in the background, in parallel — the difference is only in what happens once the download finishes.',
        '<code>defer</code> scripts are collected and held until parsing completes, then run one-by-one in their ORIGINAL document order — this predictability is exactly why the main page recommends <code>defer</code> as "the recommended default for page scripts," since your own application code usually needs a guaranteed, stable execution order relative to other scripts and the fully-parsed DOM.',
        '<code>async</code> deliberately has NO ordering guarantee relative to other scripts (or even to parsing completion) — this is fine, even DESIRABLE, for genuinely independent scripts like analytics or ad tags that don\'t depend on anything else on the page and don\'t need anything else to depend on them.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>defer vs async execution order demo</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script>
      window.__startTime = performance.now();
      console.log('t=0ms: HTML parsing begins');
    </script>
    <script defer src="./first-deferred.js"></script>
    <script async src="./tiny-async.js"></script>
    <script defer src="./second-deferred.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const t = (performance.now() - window.__startTime).toFixed(1);
        console.log('t=' + t + 'ms: DOMContentLoaded fired -- parsing is fully complete NOW');
      });
    </script>
  </body>
</html>
`,
    },
    {
      path: 'first-deferred.js',
      content: `const t = (performance.now() - window.__startTime).toFixed(1);
console.log('t=' + t + 'ms: [first-deferred.js] running -- always AFTER parsing, always FIRST among defer scripts');`,
    },
    {
      path: 'second-deferred.js',
      content: `const t = (performance.now() - window.__startTime).toFixed(1);
console.log('t=' + t + 'ms: [second-deferred.js] running -- always AFTER first-deferred.js, in document order');`,
    },
    {
      path: 'tiny-async.js',
      content: `const t = (performance.now() - window.__startTime).toFixed(1);
console.log('t=' + t + 'ms: [tiny-async.js] running -- as soon as IT downloads, with NO ordering guarantee relative to the defer scripts or parsing');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The <code>tiny-async.js</code> file is deliberately tiny (fast to download), while the two deferred scripts are placed around it in the markup. Does <code>tiny-async.js</code> reliably run BEFORE, BETWEEN, or AFTER the two deferred scripts?',
    hint: 'Ask what determines exactly when an async script executes -- its position in the markup, or purely how fast its own network request finishes, completely independent of anything else on the page?',
    solution: `There is no reliable answer -- and that unpredictability IS the
point. tiny-async.js's execution point relative to the two deferred
scripts is NOT determined by its position in the markup at all; it's
determined purely by how quickly ITS OWN file finishes downloading
relative to the other two files and to when HTML parsing itself
completes. Reloading the page (especially with a throttled network
in DevTools) can genuinely show tiny-async.js firing before parsing
even finishes, sandwiched between the two defer scripts, or
after both -- all "correct" behavior for async.

What IS completely reliable, every single time: first-deferred.js
always logs before second-deferred.js (their document order is
strictly preserved), and BOTH defer scripts always log at or after
the same general time as DOMContentLoaded -- defer scripts are
specifically held back until parsing is done, then run strictly in
order.

This is exactly the distinction the main page draws: defer gives
you two guarantees (runs after parsing, runs in document order)
that async deliberately does not provide. If your code depends on
running after the DOM is ready, or depends on running in a specific
order relative to another script, defer is the only one of the two
that actually promises that -- async trades away both guarantees in
exchange for potentially starting sooner.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'both defer and async scripts execute in the order they appear in the HTML markup, since that\'s the order the browser encounters and starts downloading them in.',
      reality: 'only defer scripts are guaranteed to execute in document order — async scripts execute in whatever order their downloads happen to finish in, completely independent of their position in the markup.',
    },
    {
      thought: 'an async script is guaranteed to run only after HTML parsing has finished, the same way a defer script is — the only difference is that async doesn\'t preserve relative order between multiple scripts.',
      reality: 'async has NO guarantee relative to parsing completion at all — an async script can execute WHILE the HTML is still being parsed if its download finishes quickly enough, unlike defer which is specifically held back until parsing is fully done.',
    },
    {
      thought: 'since both defer and async avoid blocking the HTML parser during download, they behave essentially the same way in practice, with the ordering difference being a minor, rarely-relevant detail.',
      reality: 'the ordering and timing guarantees are the ENTIRE reason to choose one over the other — defer\'s predictable "after parse, in order" behavior is essential for page scripts with dependencies on each other or the DOM, while async\'s unpredictable timing is specifically why it\'s reserved for genuinely independent third-party scripts.',
    },
  ];
}
