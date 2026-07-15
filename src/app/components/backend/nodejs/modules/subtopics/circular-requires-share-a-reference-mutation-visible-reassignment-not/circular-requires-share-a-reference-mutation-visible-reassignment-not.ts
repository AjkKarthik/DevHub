import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './circular-requires-share-a-reference-mutation-visible-reassignment-not.html',
  styleUrl: './circular-requires-share-a-reference-mutation-visible-reassignment-not.scss'
})
export class CircularRequiresShareAReferenceMutationVisibleReassignmentNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes circular requires returning "the partial exports of the module that is still loading" — Node\'s own docs actually hand back the SAME object reference, not a copy',
      points: [
        'When module A requires module B, and B (while still executing) requires A back, Node\'s require() returns A\'s module.exports object exactly as it exists AT THAT MOMENT — but critically, it returns the SAME underlying object reference, not a snapshot copy. If A had only set exports.done = false before B\'s circular require() call, B receives an object where done is currently false.',
        'Because it\'s the same reference (not a copy), any code in A that MUTATES that object afterward — exports.done = true, adding new properties — is visible through B\'s already-held reference too, since both are pointing at the identical object in memory. This is why Node\'s own canonical circular-dependency example works at all: B can read a.done and see it flip to true later, once A finishes and mutates the shared object.',
      ]
    },
    {
      heading: 'The distinction that breaks this: mutating module.exports vs. reassigning it',
      points: [
        'The "shared reference stays in sync" behavior depends entirely on A only ever MUTATING its exports object (module.exports.foo = ..., or the exports shorthand) after the circular require point — never doing a full module.exports = {...} reassignment. A mutation changes properties on the object B already has a reference to; a reassignment makes require.cache point to a BRAND NEW object, leaving B\'s already-captured reference pointing at the old, incomplete one forever.',
        'This means a LATER require("./a") call (after A finishes loading, outside the circular chain) can behave differently depending on what A did: if A only mutated, the later require() returns the exact same reference B already had — now fully populated. If A reassigned module.exports at any point after the circular require, the later require() returns the NEW object from the cache, while B\'s earlier reference is permanently stuck with the old, partial one — a subtle, easy-to-miss source of "why does this module have stale exports in one place but not another" bugs.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mutation — the shared reference stays in sync',
      language: 'typescript',
      code: `// a.js
exports.done = false;
const b = require('./b.js'); // circular — b requires a.js back
exports.done = true; // MUTATION — same object b already has

// b.js
const a = require('./a.js'); // a.js hasn't finished yet
console.log('b sees a.done as:', a.done); // false, at this moment

setTimeout(() => {
  // Later, after a.js finished mutating — b's reference
  // is the SAME object, so this now reads true.
  console.log('b sees a.done later:', a.done); // true
}, 0);`,
    },
    {
      label: 'Reassignment — the shared reference goes stale',
      language: 'typescript',
      code: `// a.js
exports.done = false;
const b = require('./b.js'); // circular — b requires a.js back
module.exports = { done: true, extra: 'new object' }; // REASSIGNMENT

// b.js
const a = require('./a.js'); // gets the ORIGINAL exports object
console.log('b sees a.done:', a.done); // false — forever, for b

// Later, in a THIRD file that requires a.js AFTER it fully loads:
// c.js
const a2 = require('./a.js');
console.log('c sees a2.done:', a2.done); // true — c gets the NEW object
// a2 !== a (from b.js's perspective) — two different objects now
// exist for what "should" be the same module's exports.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two files, a.js and b.js, circularly require each other. a.js sets exports.ready = false before requiring b.js, then LATER in the file does module.exports = { ready: true, version: 2 } (a full reassignment, not a mutation). b.js captures const a = require(\'./a.js\') during the circular require. A third file, c.js, requires a.js AFTER both a.js and b.js have finished loading. What does b.js\'s `a.ready` show, and what does c.js\'s freshly-required version show? Explain the difference.',
    hint: 'Does b.js\'s captured reference point at the object that existed at the moment of the circular require, or does it somehow "follow" a.js to whatever object module.exports later gets reassigned to? Does a LATER require() call from a different file read from that same old reference, or from require.cache\'s current value?',
    solution: 'b.js\'s a.ready stays false forever — b.js captured a reference to the ORIGINAL exports object that existed at the exact moment of its circular require() call, and a.js\'s later `module.exports = { ready: true, version: 2 }` is a full REASSIGNMENT, which makes require.cache point to a brand-new object instead of mutating the one b.js already holds a reference to. b.js\'s reference is now permanently disconnected from what a.js\'s module actually represents going forward. c.js, requiring a.js AFTER it fully finishes loading, gets whatever object is CURRENTLY in require.cache at that point — which is the new, reassigned object with ready: true and version: 2. So b.js and c.js end up holding two genuinely different objects for what conceptually should be "the same module\'s exports" — a real, subtle correctness bug caused specifically by mixing a circular require with a later full reassignment of module.exports, rather than only ever mutating it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a circular require returns a module\'s "partial" exports, it hands back a snapshot copy of whatever properties existed at that moment — later changes to the real module never affect what was already captured.',
      reality: 'This subtopic\'s theory clarifies it\'s the SAME object reference, not a copy — later mutations to that object (adding or changing properties) ARE visible through the already-captured reference, which is exactly why Node\'s own canonical circular-dependency example relies on this behavior to work correctly.'
    },
    {
      thought: 'Whether a module only mutates its exports object or fully reassigns module.exports makes no practical difference for other files that require it, as long as the final exported shape ends up correct.',
      reality: 'This subtopic\'s exercise shows this distinction is critical specifically for circular dependencies — a full reassignment after a circular require point breaks the reference the circularly-requiring module already captured, permanently disconnecting it from the module\'s actual final state, while a mutation keeps that reference correctly in sync.'
    },
    {
      thought: 'Once a circular dependency is set up between two modules, every future require() of either module (from any file, at any time) will always see perfectly consistent, up-to-date data.',
      reality: 'This subtopic\'s theory shows this consistency is NOT guaranteed — it depends entirely on the modules only mutating (never reassigning) their exports after the circular point; mixing in even one full reassignment can leave different requiring files holding genuinely different, disconnected objects for what should be the same module.'
    }
  ];
}
