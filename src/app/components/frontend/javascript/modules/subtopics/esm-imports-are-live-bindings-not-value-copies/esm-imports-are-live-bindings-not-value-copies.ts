import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-esm-live-bindings-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './esm-imports-are-live-bindings-not-value-copies.html',
  styleUrl: './esm-imports-are-live-bindings-not-value-copies.scss',
})
export class EsmImportsAreLiveBindingsNotValueCopiesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Claim, Proven Across Two Real Files',
      points: [
        'The main page states: "ES module imports are live bindings: if the exporting module updates an exported variable, the importer sees the new value automatically. This differs from CommonJS <code>require()</code> which copies values." This subtopic builds two genuinely separate files — a <code>counter.ts</code> module and an importing <code>index.ts</code> — and logs the imported <code>count</code> value BEFORE and AFTER the exporting module\'s own code changes it, proving the importer\'s view updates automatically with no re-import needed.',
        'This is fundamentally different from importing a plain value in most other module systems (including CommonJS <code>require()</code>): the importer does not receive a SNAPSHOT of the value at import time — it receives a live, ongoing CONNECTION to the exporting module\'s actual binding, which stays in sync for the lifetime of the program.',
      ],
    },
    {
      heading: 'Why "Live Binding" Is the Precise, Correct Term',
      points: [
        'A "binding" in this context means the association between a variable name and its value — an ESM import doesn\'t copy the current value into a new local variable; it creates a reference to the SAME underlying binding the exporting module itself is using. When that binding changes, every importer observing it sees the change, because there was never a separate copy in the first place.',
        'This has a genuine practical consequence: an imported variable is read-only from the importer\'s side (you cannot reassign an imported binding directly), but its VALUE can still change over time if the exporting module reassigns it internally — the importer is a passive observer of the exporting module\'s own state, not an independent owner of a snapshot.',
        'CommonJS <code>require()</code>, by contrast, returns the value of <code>module.exports</code> AT THE MOMENT <code>require()</code> was called — if the exporting module later reassigns an exported primitive value, anyone who already required it keeps the OLD value, since what they received was a one-time copy, not an ongoing connection.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>ESM live bindings demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'counter.ts',
      content: `// This module owns a piece of mutable state and exposes a function
// to change it -- the exported "count" binding itself is what stays live.
export let count = 0;

export function increment() {
  count++;
}`,
    },
    {
      path: 'index.ts',
      content: `import { count, increment } from './counter.js';

console.log('count right after import:', count); // 0

increment();
console.log('count after calling increment() once:', count, '<-- updated automatically, no re-import needed');

increment();
increment();
console.log('count after two more increment() calls:', count, '<-- keeps staying in sync with counter.ts\\'s own internal state');

// Contrast: this is what a VALUE COPY (like CommonJS require()) would look like --
// simulated here with a plain object destructure that captures a snapshot instead.
const counterModule = { count: 0, increment() { this.count++; } };
const { count: snapshotCount } = counterModule; // a genuine one-time COPY of the value
counterModule.increment();
counterModule.increment();
console.log('the SNAPSHOT copy stays frozen at:', snapshotCount, '<-- unlike the real ESM import above, this copy never updates');
console.log('but the live object itself did change:', counterModule.count);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'After <code>index.ts</code> calls <code>increment()</code> three times total, does the imported <code>count</code> binding reflect all three increments, even though <code>index.ts</code> never re-imports <code>counter.ts</code>?',
    hint: 'Ask what exactly was imported -- a copy of count\'s value taken at import time, or a live connection to the actual binding counter.ts itself is mutating.',
    solution: `Yes -- the imported count binding reflects all three increments, ending
at 3, purely because it is a LIVE BINDING to counter.ts's own "count"
variable, not a value copied at import time.

Every time increment() runs inside counter.ts, it mutates counter.ts's
OWN "count" variable directly. Since index.ts's imported "count" isn't
a separate copy but a live reference to that exact same binding,
every log of count in index.ts reflects counter.ts's current state at
the moment of that log -- with zero need to re-import or re-fetch
anything.

The contrasting "snapshot" example at the end makes the difference
concrete: destructuring { count: snapshotCount } from a plain object
DOES capture a one-time value copy (exactly how CommonJS require()
behaves) -- calling increment() afterward changes the live object's
own count property, but snapshotCount stays frozen at its original
value of 0 forever, since it was never connected to the object's
internal state in the first place.

This is the core distinction the main page's theory establishes:
ESM's live-binding behavior is a genuine language guarantee, not
just something that happens to work for objects (which are always
"live" via reference) -- it applies even to primitive values like a
plain number, which would normally be copied by value in almost any
other assignment context in JavaScript.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'importing a value from another ES module captures a snapshot/copy of that value at the moment of import — later changes made by the exporting module require the importer to re-import to see the updated value.',
      reality: 'ESM imports are live bindings, not value copies — the importer automatically sees any later change the exporting module makes to that binding, with no re-import needed at all.',
    },
    {
      thought: 'this live-binding behavior only applies to objects and arrays (which are naturally "live" via reference in JavaScript) — importing a primitive value like a number or string behaves like an ordinary value copy instead.',
      reality: 'ESM\'s live-binding guarantee applies uniformly to EVERY exported binding, including primitives — an imported number updates automatically when the exporting module reassigns it, which is genuinely different from how primitive assignment normally works everywhere else in JavaScript.',
    },
    {
      thought: 'since an imported binding stays in sync with the exporting module, the importing code can freely reassign the imported variable itself to change its value from the importer\'s side too.',
      reality: 'an imported binding is strictly READ-ONLY from the importer\'s side — attempting to reassign an imported variable directly is a syntax/compile error; only the EXPORTING module can change the underlying value, and importers merely observe those changes.',
    },
  ];
}
