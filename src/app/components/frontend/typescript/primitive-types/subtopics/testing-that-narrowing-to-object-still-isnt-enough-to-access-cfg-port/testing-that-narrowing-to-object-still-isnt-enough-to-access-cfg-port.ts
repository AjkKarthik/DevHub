import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-narrowing-object-not-enough-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-narrowing-to-object-still-isnt-enough-to-access-cfg-port.html',
  styleUrl: './testing-that-narrowing-to-object-still-isnt-enough-to-access-cfg-port.scss',
})
export class TestingThatNarrowingToObjectStillIsntEnoughToAccessCfgPortSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s "Right" Example Stops One Step Short',
      points: [
        'The "Using any instead of unknown for external data" mistake block\'s "right" example narrows with <code>if (typeof cfg === \'object\' && cfg !== null) { // narrow before accessing properties }</code> — and then the code tab ends there. It never actually accesses <code>cfg.port</code>, the exact property the "wrong" example crashes on.',
        'This subtopic completes that missing step and tests something the main page leaves implicit: is <code>typeof cfg === \'object\'</code> narrowing ENOUGH, on its own, to safely access <code>cfg.port</code>? The answer is genuinely useful to know before writing similar validation code.',
      ],
    },
    {
      heading: 'What typeof === \'object\' Actually Narrows To',
      points: [
        'After <code>typeof cfg === \'object\' && cfg !== null</code>, TypeScript narrows <code>cfg</code> from <code>unknown</code> down to the built-in <code>object</code> type — which represents "some non-primitive value," and has NO known properties at all. Attempting <code>cfg.port</code> at this point is still a compile error: <code>Property \'port\' does not exist on type \'object\'.</code>',
        'Reaching <code>cfg.port</code> safely requires ONE MORE narrowing step beyond what the main page\'s "right" example shows — either an <code>\'port\' in cfg</code> check (which narrows to <code>object & Record<"port", unknown></code>), or a type assertion to a specific shape (e.g. <code>(cfg as { port: unknown }).port</code>), followed by narrowing THAT value\'s type before calling <code>.toFixed()</code> on it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Narrowing unknown to object — one step short</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function parseConfig(raw: string): unknown {
  return JSON.parse(raw);
}

const cfg = parseConfig('{"port": 3000}');

// ── The main page's exact "right" example, completed one step ──────────────
if (typeof cfg === 'object' && cfg !== null) {
  // console.log(cfg.port.toFixed());
  // uncomment above: ERROR -- Property 'port' does not exist on type 'object'.
  // Narrowing to 'object' alone is NOT enough to access ANY specific
  // property, including 'port' -- this is exactly where the main
  // page's own "right" example stops, one step before the property
  // access it's supposed to be protecting.
  console.log('cfg is a non-null object, but .port is still inaccessible here');
}

// ── The actual fix: one more narrowing step ─────────────────────────────────
if (
  typeof cfg === 'object' && cfg !== null &&
  'port' in cfg && typeof cfg.port === 'number'
) {
  console.log(cfg.port.toFixed());  // OK -- fully narrowed to number
}

// ── Equivalent fix via a type guard function (reusable) ─────────────────────
interface Config { port: number }
function isConfig(x: unknown): x is Config {
  return typeof x === 'object' && x !== null &&
         'port' in x && typeof x.port === 'number';
}
if (isConfig(cfg)) {
  console.log(cfg.port.toFixed());  // OK -- cfg: Config
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the `cfg.port.toFixed()` line right after the first `if (typeof cfg === \'object\' && cfg !== null)` check in the playground above. Read the exact TypeScript error. Then explain, in one sentence, what additional check would need to be added at that exact point (not lower down in the file) to make it compile.',
    hint: 'The error names the specific type TypeScript has narrowed cfg to at that point — check what properties that type actually has.',
    solution: `The error reads: "Property 'port' does not exist on type
'object'." At that point, cfg has been narrowed only to the built-in
object type, which has no known properties whatsoever -- not
because port specifically is missing, but because object never has
ANY named properties in its type.

To make cfg.port accessible right there, you'd need to add a
further check narrowing cfg to something with a port property --
the minimal addition is 'port' in cfg (which narrows to
object & Record<"port", unknown>), and typically also
typeof cfg.port === 'number' to narrow port itself before calling
.toFixed() on it, exactly as the two fixed versions further down in
the playground demonstrate.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'checking `typeof cfg === \'object\' && cfg !== null` narrows an unknown value enough to safely access any property you expect it to have.',
      reality: 'that check only narrows to the built-in `object` type, which has no known properties at all — accessing ANY specific property, like `.port`, still requires a further check (an `in` operator test, a type guard, or an assertion).',
    },
    {
      thought: 'a "right" example in a mistake-correction block that ends with a comment like "// narrow before accessing properties" has already shown the complete fix.',
      reality: 'here the comment describes an intention the code never actually carries out — the property access it warns about is never attempted, so the reader never sees whether the shown narrowing was actually sufficient for it.',
    },
    {
      thought: 'once `unknown` has been narrowed to `object`, the remaining work is just a formality — you can reasonably assume the shape you expect.',
      reality: 'TypeScript enforces no such assumption — every additional property you want to use still needs its own explicit narrowing step, precisely because `object` on its own carries no information about which properties exist.',
    },
  ];
}
