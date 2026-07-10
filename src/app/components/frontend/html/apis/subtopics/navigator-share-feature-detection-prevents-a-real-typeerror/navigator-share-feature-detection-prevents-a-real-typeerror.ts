import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-navigator-share-feature-detection-prevents-a-real-typeerror',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './navigator-share-feature-detection-prevents-a-real-typeerror.html',
  styleUrl: './navigator-share-feature-detection-prevents-a-real-typeerror.scss'
})
export class NavigatorShareFeatureDetectionPreventsARealTypeErrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'navigator.share is undefined, not a stub, on unsupported browsers',
      points: [
        'The main page\'s Common Mistake and Quiz both point at the same rule: "The Web Share API is not supported in all browsers; feature detection is required," and the fix is checking <code>if (navigator.share)</code> before calling it. This is not defensive-programming caution for its own sake — on an unsupported browser, <code>navigator.share</code> is genuinely <code>undefined</code>, not a no-op function.',
        'Calling <code>navigator.share(...)</code> directly when it is <code>undefined</code> is exactly the same category of mistake as calling any other undefined value as a function — it throws a real <code>TypeError: navigator.share is not a function</code>, not a silent failure or a resolved-but-empty Promise.',
      ]
    },
    {
      heading: 'The recommended check and the failure it prevents are both directly observable',
      points: [
        '<code>\'share\' in navigator</code> (or the equivalent <code>typeof navigator.share === \'function\'</code>) is a safe, throw-free way to check for the API\'s existence before ever calling it — exactly the pattern the main page\'s fix recommends.',
        'You can directly observe the alternative: wrapping an unconditional <code>navigator.share(...)</code> call in try/catch and inspecting the caught error\'s actual type and message confirms it really is a plain <code>TypeError</code> from calling a non-function, not some Web-Share-specific rejection.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>navigator.share feature detection</title></head>
  <body>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const isSupported = 'share' in navigator;
const lines: string[] = [];

lines.push(\`'share' in navigator → \${isSupported}\`);
lines.push(\`typeof navigator.share → "\${typeof (navigator as any).share}"\`);
lines.push('');

if (isSupported) {
  lines.push('This sandbox DOES expose navigator.share — calling it directly is safe here,');
  lines.push('though a real call would still need an actual user gesture and HTTPS to succeed.');
} else {
  lines.push('This sandbox does NOT expose navigator.share. Demonstrating the unguarded call:');
  try {
    // @ts-ignore — intentionally calling without feature detection to observe the real failure.
    (navigator as any).share({ title: 'test' });
    lines.push('  (no error thrown — unexpected in this environment)');
  } catch (e) {
    const err = e as Error;
    lines.push(\`  Caught: \${err.constructor.name}: \${err.message}\`);
    lines.push('  This is a plain TypeError from calling an undefined value as a function —');
    lines.push('  not a Web-Share-specific error, and not a rejected Promise.');
  }
}

output.textContent = lines.join('\\n');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'On a browser where <code>navigator.share</code> is unsupported, predict: does calling <code>navigator.share({...})</code> unconditionally return a rejected Promise (the way a denied permission often does), or does it throw synchronously before a Promise is ever created?',
    hint: 'A rejected Promise implies the function itself exists and started running before failing. Think about what "the function does not exist at all" actually looks like when you try to call it.',
    solution: `It throws synchronously, before any Promise is ever created — a plain TypeError, exactly like
calling any other undefined value as a function (e.g. undefinedVariable()). There is no Promise to
reject because navigator.share itself was never a function in the first place on that browser. This
is a meaningfully different failure mode from something like a user denying a permission prompt,
which DOES produce a rejected Promise from a real, existing function — the "not supported" case
fails one full step earlier, at the call itself.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling navigator.share() on an unsupported browser fails gracefully, similar to how a denied permission produces a rejected Promise you can .catch().',
      reality: 'It throws a synchronous TypeError immediately, before any Promise exists — there is nothing to .catch() because the function call itself never successfully starts on a browser where navigator.share is undefined.'
    },
    {
      thought: '\'share\' in navigator and typeof navigator.share === \'function\' are just two equally-arbitrary ways to write the same feature check, with no real difference.',
      reality: 'They are functionally equivalent as a boolean guard for this specific case, and both are safe against undefined — the main page\'s own recommendation is simply to use SOME feature-detection form before calling, rather than assuming any particular syntax is required.'
    },
    {
      thought: 'Feature-detecting navigator.share is really about permissions — checking whether the user has allowed sharing.',
      reality: 'It is entirely about API EXISTENCE, not permissions. A supported browser still requires a genuine user gesture and secure context for the call to succeed, but that is a separate concern from whether navigator.share is even defined as a function to call in the first place.'
    },
  ];
}
