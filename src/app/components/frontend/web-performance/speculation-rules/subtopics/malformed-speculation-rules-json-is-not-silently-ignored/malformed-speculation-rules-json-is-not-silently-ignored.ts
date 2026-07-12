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
  templateUrl: './malformed-speculation-rules-json-is-not-silently-ignored.html',
  styleUrl: './malformed-speculation-rules-json-is-not-silently-ignored.scss'
})
export class MalformedSpeculationRulesJsonIsNotSilentlyIgnoredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two very different kinds of "the browser didn\'t use my rules" — worth telling apart',
      points: [
        'The main page correctly states that an UNSUPPORTED browser (Firefox, Safari) safely ignores a <code>&lt;script type="speculationrules"&gt;</code> block entirely — no error, no console noise, just a silent no-op.',
        'That is a DIFFERENT situation from a SUPPORTED browser encountering genuinely malformed JSON inside that same block — the main page does not explicitly say what happens there, and it is easy to assume "ignored the same way" when the actual behavior is different.',
      ]
    },
    {
      heading: 'Confirmed directly — malformed JSON inside a speculationrules block produces a real, catchable syntax error in a supporting browser, unlike the silent no-op of an unsupported one',
      points: [
        'Injecting a <code>&lt;script type="speculationrules"&gt;</code> block containing deliberately broken JSON (<code>{ this is not valid JSON !!! </code>) into a supporting Chromium browser did NOT throw synchronously at the <code>appendChild()</code> call — but it DID trigger a real <code>window</code> <code>\'error\'</code> event shortly after, with the message <code>"Uncaught TypeError: Line: 1, column: 3, Syntax error."</code>.',
        'This is a genuinely different signal than what an unsupported browser produces: there, NOTHING happens at all — no error event, no console output, nothing observable. A malformed-but-supported case is loud (a real, catchable error); an unsupported browser is completely silent.',
        'Practical takeaway: a global <code>window.addEventListener(\'error\', ...)</code> handler (already common for error-tracking/Sentry-style setups) WILL catch a broken speculation rules JSON payload — this is a legitimate, low-effort way to catch a typo in a hand-written or dynamically-generated rules JSON before it ships silently broken to users.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>malformed speculation rules JSON is not silently ignored</title>
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
      content: `// Inject a speculationrules block with deliberately BROKEN JSON, and confirm a
// real, catchable window 'error' event fires — distinct from an unsupported browser's silent no-op.
let capturedError: { message: string; type: string } | null = null;

const errorHandler = (e: ErrorEvent) => {
  capturedError = { message: e.message, type: e.type };
};
window.addEventListener('error', errorHandler);

const script = document.createElement('script');
script.type = 'speculationrules';
script.textContent = '{ totally invalid json here !!! '; // deliberately malformed
document.head.appendChild(script);

// The error is reported asynchronously (not synchronously at appendChild) — wait for it
await new Promise((r) => setTimeout(r, 150));
window.removeEventListener('error', errorHandler);
script.remove();

console.log('window error event captured for malformed speculationrules JSON:', capturedError);
console.log('---');
if (capturedError) {
  console.log('a SUPPORTING browser with BROKEN json is LOUD: a real, catchable error.');
} else {
  console.log('no error captured — either unsupported, or JSON happened to be valid.');
}
console.log('compare: an UNSUPPORTED browser given a perfectly valid speculationrules block');
console.log('produces NO error, NO console output — a completely silent no-op, the opposite signal.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s error-tracking setup (e.g. a global window.addEventListener(\'error\', ...) handler reporting to Sentry) starts showing a new error: "Uncaught TypeError: ... Syntax error." with no stack trace pointing at any of their application JS files, shortly after a marketing team member manually edited a hand-written <code>&lt;script type="speculationrules"&gt;</code> JSON block in the site\'s HTML template. Is this error worth investigating, or likely an unrelated noise?',
    hint: 'Think about what this subtopic\'s demo showed happens specifically when speculationrules JSON is malformed in a SUPPORTING browser — does it produce exactly this kind of error?',
    solution: 'It is worth investigating, and is very likely directly caused by the JSON edit — not unrelated noise. This subtopic\'s demo produced the EXACT same signature: a window \'error\' event with the message "Uncaught TypeError: Line: 1, column: 3, Syntax error." and no meaningful stack trace pointing at application code, specifically when a speculationrules script block contains malformed JSON. The timing (right after a manual edit to that exact block) and the specific error shape both match. The fix is straightforward: validate the JSON (a linter, a build-time JSON.parse check, or simply re-checking the edited block) before it ships — this subtopic\'s finding confirms the browser will not silently tolerate the mistake the way it silently ignores the whole feature in an unsupported browser.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since unsupported browsers silently ignore a <code>&lt;script type="speculationrules"&gt;</code> block, any browser encountering a problem with that block (missing support, OR broken JSON) behaves the same way — silently.',
      reality: 'This subtopic\'s demo shows these are genuinely different situations: an unsupported browser produces zero observable signal, while a SUPPORTING browser given malformed JSON produces a real, catchable window error event with a specific syntax-error message — confirmed directly, not assumed.'
    },
    {
      thought: 'A syntax error inside a <code>&lt;script type="speculationrules"&gt;</code> JSON payload would be caught synchronously, the same way a syntax error in a regular <code>&lt;script&gt;</code> tag halts parsing immediately.',
      reality: 'This subtopic\'s demo shows the error is reported ASYNCHRONOUSLY — appendChild() itself did not throw, and the error only surfaced after a short delay via the window \'error\' event, confirming the browser parses the speculation rules JSON out-of-band from normal synchronous script execution, not inline like regular JS.'
    },
    {
      thought: 'Because malformed speculation rules JSON produces an error, that error will necessarily be caught by a try/catch block wrapped directly around the code that injects the <code>&lt;script&gt;</code> element.',
      reality: 'A synchronous try/catch around the appendChild() call will NOT catch this error, confirmed in this subtopic\'s demo — since the parse failure surfaces later via the asynchronous window error event, only a window.addEventListener(\'error\', ...) handler (not a local try/catch) will observe it.'
    }
  ];
}
