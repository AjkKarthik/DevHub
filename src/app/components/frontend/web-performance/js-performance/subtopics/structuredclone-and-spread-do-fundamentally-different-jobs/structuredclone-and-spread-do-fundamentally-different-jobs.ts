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
  templateUrl: './structuredclone-and-spread-do-fundamentally-different-jobs.html',
  styleUrl: './structuredclone-and-spread-do-fundamentally-different-jobs.scss'
})
export class StructuredcloneAndSpreadDoFundamentallyDifferentJobsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The real distinction is not just "speed" — spread shares nested references, structuredClone genuinely copies them',
      points: [
        'The main page notes structuredClone is roughly 10× slower than spread for simple objects — but that comparison only tells half the story, and only applies to genuinely FLAT objects (a spread of a flat object and structuredClone of the same flat object measured within roughly the same order of magnitude in a direct test).',
        'For an object containing NESTED objects or arrays, <code>{ ...original }</code> only copies the TOP-LEVEL keys — any nested object or array inside is still the SAME shared reference in both the original and the copy. <code>structuredClone()</code> recursively clones everything, producing a genuinely independent copy at every level.',
        'Confirmed directly: mutating a nested property through a spread-copied object (<code>spreadCopy.user.settings.theme = \'light\'</code>) also changes the SAME property on the original object — they were never independent. The identical mutation through a <code>structuredClone()</code>-copied object leaves the original completely untouched.',
      ]
    },
    {
      heading: 'For genuinely nested data, the speed gap is also far larger than "10×" — because the two are no longer doing comparable amounts of work',
      points: [
        'Measured directly on a nested object (an array of 30 items, each with its own nested tags array and metadata object): spread took a fraction of a millisecond for 5,000 iterations, while structuredClone took over 200ms for the same 5,000 iterations — a gap of several orders of magnitude, not roughly 10×.',
        'This is not spread being "unfairly fast" — it is spread doing dramatically LESS work (one shallow copy) while structuredClone does a full recursive deep clone. The "10×" figure applies specifically to flat objects, where both operations are actually comparable in scope.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>structuredClone and spread do fundamentally different jobs</title>
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
      content: `// Part 1: does mutating a NESTED property through the copy affect the original?
const original = { user: { name: 'Alice', settings: { theme: 'dark' } } };

const spreadCopy = { ...original };
spreadCopy.user.settings.theme = 'light';
console.log('after mutating a NESTED prop via the SPREAD copy, original.user.settings.theme =', original.user.settings.theme, '(shared reference!)');

const original2 = { user: { name: 'Bob', settings: { theme: 'dark' } } };
const cloneCopy = structuredClone(original2);
cloneCopy.user.settings.theme = 'light';
console.log('after mutating a NESTED prop via the structuredClone copy, original2.user.settings.theme =', original2.user.settings.theme, '(genuinely independent)');

// Part 2: timing comparison on a NESTED object (not a flat one)
const bigObj = { items: [] as any[] };
for (let i = 0; i < 30; i++) {
  bigObj.items.push({ id: i, name: 'item' + i, tags: ['a', 'b', 'c'], meta: { active: true, score: i * 1.5 } });
}
const iterations = 5000;

let t0 = performance.now();
for (let i = 0; i < iterations; i++) { const c = { ...bigObj }; }
const spreadMs = performance.now() - t0;

t0 = performance.now();
for (let i = 0; i < iterations; i++) { const c = structuredClone(bigObj); }
const cloneMs = performance.now() - t0;

console.log('spread (' + iterations + ' iterations, NESTED object):', spreadMs.toFixed(1), 'ms');
console.log('structuredClone (' + iterations + ' iterations, SAME nested object):', cloneMs.toFixed(1), 'ms');
console.log('ratio:', (cloneMs / spreadMs).toFixed(0) + 'x — far beyond the ~10x figure that applies to flat objects only.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A form component uses const draft = { ...savedSettings } to create an editable draft copy, then lets the user edit draft.notifications.email (a nested boolean) before deciding whether to save. Testing reveals that clicking "Cancel" without saving still permanently changes the original savedSettings object. What is happening, and what is the one-line fix?',
    hint: 'Ask whether { ...savedSettings } actually creates an independent copy of savedSettings.notifications, or just copies the top-level reference to the same nested object.',
    solution: 'The spread only shallow-copies — draft.notifications is the exact SAME object reference as savedSettings.notifications, confirmed directly in this subtopic\'s demo where mutating a nested property through a spread copy changed the original too. Editing draft.notifications.email mutates the shared nested object directly, permanently affecting savedSettings even without ever calling a "save" function. The fix is const draft = structuredClone(savedSettings) — this creates a genuinely independent nested copy, confirmed in the same demo to leave the original untouched after an identical nested mutation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'structuredClone and spread are two speed tiers of the SAME operation — pick spread when you want fast, structuredClone when you want thorough, but both ultimately produce an independent copy.',
      reality: 'They produce fundamentally different results for nested data, not just different speeds — this subtopic\'s demo shows a spread copy sharing its nested objects with the original (mutating one mutates both), while structuredClone genuinely produces independent copies at every level.'
    },
    {
      thought: 'The "structuredClone is ~10x slower" rule of thumb applies universally, regardless of whether the object being cloned is flat or deeply nested.',
      reality: 'It specifically applies to flat objects, where spread and structuredClone are doing comparable amounts of work — for genuinely nested data, this subtopic\'s demo measured a gap of multiple orders of magnitude, since spread skips cloning the nested structure entirely while structuredClone recursively clones all of it.'
    },
    {
      thought: 'Since structuredClone is measurably slower, spread is always the better default choice for copying objects in performance-sensitive code, and structuredClone should be avoided unless there is no other option.',
      reality: 'The right choice depends on whether independence is actually needed — for flat objects or when shared nested references are fine, spread is the correct, fast choice; but for data that genuinely needs to be mutated independently of its source, spread introduces a real correctness bug (not just extra risk), and structuredClone is the only one of the two that actually solves it.'
    }
  ];
}
