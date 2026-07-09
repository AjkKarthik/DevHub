import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-assign-vs-spread-setters-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './object-assign-invokes-setters-spread-does-not.html',
  styleUrl: './object-assign-invokes-setters-spread-does-not.scss',
})
export class ObjectAssignInvokesSettersSpreadDoesNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA States This as a Fact — But Never Shows a Setter Actually Firing (or Not)',
      points: [
        'The QnA section says plainly: "Object.assign MUTATES the target and invokes setters on the target object. Spread creates a new object literal (no setters invoked)." This is a precise, testable claim, but the reader never sees a setter with a visible side effect (like a console.log) actually fire — or fail to fire — for each approach.',
        'This subtopic defines a target object with a setter that logs every time it runs, then compares what happens when the SAME source data is merged in via <code>Object.assign(target, source)</code> versus <code>{ ...target, ...source }</code>.',
      ],
    },
    {
      heading: 'Why the Two Approaches Trigger Different Underlying Operations',
      points: [
        '<code>Object.assign(target, ...sources)</code> copies each source property to the target using an ordinary property ASSIGNMENT (<code>target[key] = value</code>) — if <code>target</code> has a setter for that key (inherited or own), the assignment goes through the normal <code>[[Set]]</code> internal method, which triggers the setter exactly as if you\'d written the assignment by hand.',
        'Object spread (<code>{ ...target, ...source }</code>) works completely differently: it builds a BRAND NEW object literal by copying OWN ENUMERABLE properties as new, plain data properties on that new object — using <code>[[DefineOwnProperty]]</code> internally, not <code>[[Set]]</code>. This means any setter that existed on the ORIGINAL target object is never invoked, because spread isn\'t writing to target at all; it\'s creating a fresh object where that key is just a plain value.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Object.assign vs spread setters demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function makeTargetWithSetter() {
  let internalValue = 0;
  return {
    get value() { return internalValue; },
    set value(v) {
      console.log('  SETTER FIRED with value:', v);
      internalValue = v * 2;   // deliberately doubles, to make the effect visible
    },
  };
}

console.log('--- Object.assign(target, source) ---');
const targetForAssign = makeTargetWithSetter();
Object.assign(targetForAssign, { value: 5 });
console.log('targetForAssign.value after assign:', targetForAssign.value);

console.log('');
console.log('--- { ...target, ...source } ---');
const targetForSpread = makeTargetWithSetter();
const spreadResult = { ...targetForSpread, ...{ value: 5 } };
console.log('targetForSpread.value (original, unchanged?):', targetForSpread.value);
console.log('spreadResult.value (new plain property):', spreadResult.value);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Does "SETTER FIRED" log for the Object.assign case? Does it log for the spread case? What is targetForAssign.value versus targetForSpread.value afterward?',
    hint: 'Ask which approach actually performs an assignment (target[key] = value) against the ORIGINAL object, versus which one builds an entirely new object instead.',
    solution: `Object.assign case: "SETTER FIRED with value: 5" IS logged, and
targetForAssign.value afterward is 10 -- confirming the setter ran
(doubling 5 to 10) exactly as it would for a hand-written
targetForAssign.value = 5 assignment. Object.assign genuinely
performed a real property assignment against the original target
object, going through its setter.

Spread case: "SETTER FIRED" is NEVER logged. targetForSpread.value
(the ORIGINAL object) is still 0, completely unchanged -- the
spread operation never touched it at all. spreadResult.value (the
NEW object spread produced) is exactly 5, the raw, undoubled value
from the source -- confirming spread copied it as a plain data
property, bypassing whatever getter/setter pair existed on the
original target entirely.

This confirms the QnA's claim precisely, and reveals the practical
consequence: if a target object has meaningful setter logic (as
seen in class instances, Vue/MobX-style reactive objects, or
validation wrappers), Object.assign(target, source) will correctly
trigger that logic, while { ...target, ...source } silently produces
a NEW plain object where all that logic is gone -- not "skipped",
but structurally absent from the new object's own properties.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Object.assign(target, source) and { ...target, ...source } are functionally interchangeable — spread is just newer, cleaner syntax for the same operation.',
      reality: 'they trigger genuinely different internal operations — Object.assign performs real property ASSIGNMENTS against the target (invoking setters), while spread builds a brand-new object with plain data properties (never invoking any setter from the source objects).',
    },
    {
      thought: 'a getter/setter pair defined on an object survives being spread into a new object — the new object should have the same reactive behavior.',
      reality: 'spread copies the CURRENT VALUE at spread time as a plain, static data property — the new object has no getter/setter at all for that key, only whatever raw value the getter happened to return in that moment.',
    },
    {
      thought: 'since Object.assign mutates its target, it is always the "wrong" choice compared to spread\'s cleaner, immutable style — spread should be preferred in every case.',
      reality: 'if a target object genuinely needs its setter logic to run (validation, reactivity, computed side effects), Object.assign is the ONLY one of the two that actually achieves that — spread\'s immutability comes at the cost of silently bypassing that logic entirely.',
    },
  ];
}
