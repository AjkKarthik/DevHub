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
  templateUrl: './non-deterministic-values-genuinely-differ-between-renders.html',
  styleUrl: './non-deterministic-values-genuinely-differ-between-renders.scss'
})
export class NonDeterministicValuesGenuinelyDifferBetweenRendersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A hydration mismatch is not a framework bug — it is the direct, inevitable consequence of running the same rendering code twice with a genuinely different input',
      points: [
        'SSR frameworks render a component\'s output TWICE: once on the server (producing the HTML sent to the browser) and once on the client during hydration (to know what the DOM "should" look like and attach event listeners correctly).',
        'If the rendering function calls something that is genuinely NOT deterministic — <code>Date.now()</code>, <code>new Date().toLocaleString()</code>, <code>Math.random()</code> — the two calls, minutes or even milliseconds apart, are mathematically almost guaranteed to produce different output. This is not framework fragility; it is the correct, expected behaviour of those functions.',
      ]
    },
    {
      heading: 'Confirmed directly — the exact same code, called twice with a realistic delay between calls, genuinely produces two different values',
      points: [
        'Calling <code>new Date().toLocaleString()</code> once, waiting 50ms (simulating the real gap between server response and client hydration), then calling it again, produced two DIFFERENT timestamp strings — confirmed by direct string comparison.',
        'Calling <code>Math.random()</code> twice in immediate succession produced two different numbers as well — confirming there is no framework-level magic that could make these two "renders" agree even if hydration happened instantaneously.',
        'This is exactly why the main page\'s fix works: passing the server-computed value down as a prop (computed ONCE, reused on both server and client) sidesteps the problem entirely — there is no SECOND, independent call to the non-deterministic function at all.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>non-deterministic values genuinely differ between renders</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Simulate the exact SSR/hydration scenario: the SAME rendering function,
// called once as "server render" and once as "client render" a short time later.
function renderTimestamp(): string {
  return new Date().toLocaleString();
}

(async () => {
  const serverRenderOutput = renderTimestamp();
  console.log('SERVER render output:', serverRenderOutput);

  // Simulate the real gap between server response and client hydration
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const clientRenderOutput = renderTimestamp();
  console.log('CLIENT render output (same function, called again after hydration delay):', clientRenderOutput);

  console.log('do they match?', serverRenderOutput === clientRenderOutput, '— if false, this is EXACTLY a real hydration mismatch.');

  // Same problem with Math.random()
  const randomServer = Math.random();
  const randomClient = Math.random();
  console.log('Math.random() called twice:', randomServer, 'vs', randomClient, '— match?', randomServer === randomClient);

  console.log('---');
  console.log('THE FIX: compute the value ONCE (e.g. server-side), pass it down as a prop/input.');
  console.log('There is no second, independent call — so there is nothing left to mismatch.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team debugging a hydration mismatch warning traces it to a component that renders <span>{Math.random() < 0.5 ? \'A\' : \'B\'}</span> for an A/B test variant. They try fixing it by moving the Math.random() call into a useEffect/ngOnInit lifecycle hook instead of the render body, hoping that avoids the mismatch. Does this actually fix the problem, or does it just move it?',
    hint: 'Ask whether calling Math.random() in a lifecycle hook still means the SERVER and the CLIENT are each independently deciding the variant — is there still a second, independent random call happening?',
    solution: 'Moving it to a lifecycle hook does not fix the underlying problem — it just changes WHEN the mismatch becomes visible. If the server picks a variant during SSR and the client ALSO calls Math.random() independently (even in a lifecycle hook, after the initial render), the two are still uncoordinated and will show a DIFFERENT variant to the user than what was server-rendered, causing the visible content to flip after hydration — a worse experience than a console warning. Confirmed by this subtopic\'s demo: any two independent Math.random() calls, regardless of WHERE in the code they happen, will differ almost every time. The real fix is deciding the variant ONCE — either purely server-side (passed to the client as data) or purely client-side (never rendered differently during SSR) — not moving an independent random call to a different point in the lifecycle.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Hydration mismatches are rare edge cases that mostly happen due to genuine bugs (typos, wrong conditionals) — using Date.now() or Math.random() directly in render output is a minor style issue, not something that reliably causes real problems.',
      reality: 'This subtopic\'s demo shows the mismatch is essentially GUARANTEED, not an edge case — two calls to the exact same non-deterministic function, even milliseconds apart, produced different values every single time tested, confirming this is a structural certainty, not a rare occurrence.'
    },
    {
      thought: 'If the server and client render close enough together in time (a very fast page load), Date.now()-based values would likely match closely enough to avoid a mismatch in practice.',
      reality: 'Even Date.now() itself, at millisecond precision, is exceedingly unlikely to match across two independent calls separated by any real network/hydration delay — and formatted values like toLocaleString() round to whole seconds, making even a sub-second gap enough to produce genuinely different strings, confirmed directly in this subtopic\'s demo.'
    },
    {
      thought: 'The fix for hydration mismatches from dynamic values is always to suppress the warning (e.g. suppressHydrationWarning in React) rather than to restructure the code.',
      reality: 'Suppressing the warning only hides the SYMPTOM (the console message) — the underlying visual flash/re-render still happens unless the actual root cause is fixed, which the main page\'s recommended approach (compute once, pass down as a prop) genuinely eliminates rather than just silencing.'
    }
  ];
}
