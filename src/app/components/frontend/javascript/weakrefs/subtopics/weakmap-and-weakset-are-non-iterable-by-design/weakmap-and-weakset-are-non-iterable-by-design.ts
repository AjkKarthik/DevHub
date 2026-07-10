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
  selector: 'app-weakmap-non-iterable-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './weakmap-and-weakset-are-non-iterable-by-design.html',
  styleUrl: './weakmap-and-weakset-are-non-iterable-by-design.scss',
})
export class TryingToIterateAWeakMapOrWeakSetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #3, Proven With Every Iteration Method',
      points: [
        'The main page\'s Mistake #3 shows <code>for (const [k, v] of wm) { }</code> throwing "TypeError: wm is not iterable." This subtopic goes further — it also checks <code>wm.size</code> (which is <code>undefined</code>, not an error, since it simply doesn\'t exist), attempts <code>Object.keys(wm)</code>, and tries <code>[...wm]</code>, confirming that EVERY common way of "looking inside" a WeakMap fails, not just a plain <code>for...of</code> loop.',
        'This is DELIBERATE, spec-level design, not a missing feature that might be added later — the main page\'s explanation is direct: "Iteration would expose when entries have been GC\'d, which would make GC behavior observable — a security and determinism concern."',
      ],
    },
    {
      heading: 'Why Observable GC Timing Is a Real Security and Determinism Problem',
      points: [
        'If you COULD iterate a WeakMap and watch its entry count change over time, you would effectively be given a live window into exactly when the JavaScript engine\'s garbage collector runs and what it collects — this is information the spec deliberately keeps hidden, since different engines (and even different runs of the SAME engine) collect memory at genuinely unpredictable times.',
        'Beyond just being non-deterministic (making programs behave differently across environments), an observable GC would also be a genuine SECURITY leak in some contexts — timing side-channels based on memory pressure and collection patterns have been used in real security research to infer information that should otherwise be isolated between different pieces of code sharing a runtime (e.g., different browser tabs, different iframes, different origins).',
        'The main page\'s fix is unconditional: "If you need iteration, use Map/Set instead." There is no workaround, escape hatch, or alternative API to iterate a WeakMap/WeakSet — the non-iterability is a permanent, intentional constraint of the weak collection\'s design, not a temporary limitation.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>WeakMap non-iterable demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const obj1 = { name: 'a' };
const obj2 = { name: 'b' };
const wm = new WeakMap<object, string>();
wm.set(obj1, 'value-a');
wm.set(obj2, 'value-b');

console.log('--- Checking .size ---');
console.log('wm.size:', (wm as any).size, '<-- undefined, the property simply does not exist (no error, just missing)');

console.log('--- Attempting for...of ---');
try {
  for (const entry of wm as any) {
    console.log('entry:', entry);
  }
  console.log('for...of completed with no error?!');
} catch (e) {
  console.log('for...of THREW:', (e as Error).message);
}

console.log('--- Attempting spread [...wm] ---');
try {
  const arr = [...(wm as any)];
  console.log('spread succeeded?!', arr);
} catch (e) {
  console.log('spread THREW:', (e as Error).message);
}

console.log('--- Attempting Object.keys(wm) ---');
console.log('Object.keys(wm):', Object.keys(wm as any), '<-- empty array, no error -- but reveals NOTHING about the actual entries');

console.log('--- Attempting Array.from(wm) ---');
try {
  const arr2 = Array.from(wm as any);
  console.log('Array.from succeeded?!', arr2);
} catch (e) {
  console.log('Array.from THREW:', (e as Error).message);
}

console.log('--- Contrast: a regular Map supports ALL of these ---');
const m = new Map<object, string>();
m.set(obj1, 'value-a');
m.set(obj2, 'value-b');
console.log('m.size:', m.size);
console.log('[...m]:', [...m]);
for (const [k, v] of m) {
  console.log('Map entry:', k, v);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>wm.size</code> and <code>for (const entry of wm)</code> both fail to give you the WeakMap\'s entries — but do they fail in the SAME way?',
    hint: 'Ask what specifically happens for each attempt -- does accessing a property that simply was never defined behave the same way as trying to use an object with a protocol (like the iterator protocol) it was deliberately never given?',
    solution: `No -- they fail differently. wm.size returns undefined with NO
error at all, because .size is simply a property that was never
defined on WeakMap.prototype -- accessing any undefined property on
any object returns undefined, exactly as it would for a typo'd
property name.

for (const entry of wm), by contrast, throws a real TypeError:
"wm is not iterable" -- because WeakMap deliberately does not
implement the iterator protocol (no Symbol.iterator method exists
on WeakMap.prototype at all). The for...of loop's very first step
is checking for that protocol, and fails immediately when it's
missing.

The same is true for spread ([...wm]) and Array.from(wm) -- both
rely on the same iterator protocol WeakMap doesn't implement, so
both throw the identical "not iterable" TypeError.

Object.keys(wm) is the interesting middle case: it doesn't throw at
all, but it also reveals nothing useful -- it returns an empty
array, because Object.keys() only looks at the object's own
ENUMERABLE STRING-KEYED properties (WeakMap doesn't have any of
those; its actual entries are stored using an internal, unobservable
mechanism, not as normal properties).

The contrast with a regular Map at the end confirms all of these
operations work completely normally there -- Map implements .size,
the iterator protocol, and everything else WeakMap deliberately
omits, exactly because Map's entries are meant to be observable and
WeakMap's are not.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'WeakMap simply hasn\'t had iteration support added yet — it\'s a missing feature that might be implemented in a future JavaScript version, similar to how other APIs have gained capabilities over time.',
      reality: 'WeakMap\'s non-iterability is a permanent, deliberate design decision tied directly to how weak references work — allowing iteration would make garbage collection timing observable, which the spec intentionally prevents for determinism and security reasons, not a gap awaiting a future fix.',
    },
    {
      thought: 'checking wm.size and attempting for (const x of wm) both fail in essentially the same way — some kind of general "WeakMap doesn\'t support introspection" error.',
      reality: 'these fail through completely different mechanisms — wm.size silently returns undefined (since the property was simply never defined, like any other property miss), while for...of throws an actual TypeError because WeakMap deliberately never implements the iterator protocol at all.',
    },
    {
      thought: 'Object.keys(wm) or similar reflection-based approaches can be used as a workaround to inspect a WeakMap\'s actual entries, even though direct iteration is blocked.',
      reality: 'Object.keys() (and similar reflection utilities) reveal nothing about a WeakMap\'s actual entries — they only see conventional own, enumerable, string-keyed properties, and a WeakMap\'s real entries are stored through an internal mechanism that is completely inaccessible to any reflection API, by design.',
    },
  ];
}
